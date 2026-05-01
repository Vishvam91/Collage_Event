// Event routes for managing college events
const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendRegistrationConfirmation } = require('../services/emailService');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .populate('registeredStudents', 'name email studentId')
            .populate('teams.teamLeader', 'name email studentId')
            .populate('teams.members', 'name email studentId')
            .sort({ date: 1 });

        res.json({
            message: 'Events fetched successfully',
            events
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('registeredStudents', 'name email studentId');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({
            message: 'Event fetched successfully',
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new event (only organizers)
router.post('/', auth, upload.single('eventImage'), async (req, res) => {
    try {
        // Check if user is organizer
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can create events' });
        }

        const { title, description, category, date, time, venue, eligibility, seatLimit, isTeamEvent, teamSize } = req.body;

        // Get image path if file was uploaded
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

        const eventData = {
            title,
            description,
            category,
            date,
            time,
            venue,
            eligibility: eligibility || 'All students',
            seatLimit,
            organizer: req.user.userId,
            imageUrl: imageUrl,
            isTeamEvent: isTeamEvent === 'true',
        };

        // Add team size if it's a team event
        if (eventData.isTeamEvent) {
            eventData.teamSize = parseInt(teamSize) || 2;
        }

        const event = new Event(eventData);

        await event.save();

        // Populate organizer info before sending response
        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email');

        res.status(201).json({
            message: 'Event created successfully',
            event: populatedEvent
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Register for event (students only)
router.post('/:id/register', auth, async (req, res) => {
    try {
        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can register for events' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if already registered
        if (event.registeredStudents.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Check seat availability
        if (event.registeredStudents.length >= event.seatLimit) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Add student to event
        event.registeredStudents.push(req.user.userId);
        await event.save();

        res.json({
            message: 'Successfully registered for event',
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Unregister from event (students only)
router.post('/:id/unregister', auth, async (req, res) => {
    try {
        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can unregister from events' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if registered
        const index = event.registeredStudents.indexOf(req.user.userId);
        if (index === -1) {
            return res.status(400).json({ message: 'Not registered for this event' });
        }

        // Handle team event unregistration
        if (event.isTeamEvent) {
            // Find the team this user belongs to
            const teamIndex = event.teams.findIndex(team => 
                team.members.some(member => member.toString() === req.user.userId)
            );

            if (teamIndex !== -1) {
                const team = event.teams[teamIndex];
                
                // If user is team leader, remove entire team
                if (team.teamLeader.toString() === req.user.userId) {
                    // Remove all team members from registeredStudents
                    team.members.forEach(memberId => {
                        const memberIndex = event.registeredStudents.indexOf(memberId);
                        if (memberIndex !== -1) {
                            event.registeredStudents.splice(memberIndex, 1);
                        }
                    });
                    
                    // Remove the team
                    event.teams.splice(teamIndex, 1);
                    
                    await event.save();
                    
                    return res.json({
                        message: 'Team disbanded and all members unregistered from event',
                        event
                    });
                } else {
                    return res.status(400).json({ 
                        message: 'Only team leader can unregister the team. Contact your team leader.' 
                    });
                }
            }
        } else {
            // Handle individual event unregistration
            event.registeredStudents.splice(index, 1);
            await event.save();

            return res.json({
                message: 'Successfully unregistered from event',
                event
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Team registration for events (students only)
router.post('/:id/register-team', auth, async (req, res) => {
    try {
        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can register teams for events' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if it's a team event
        if (!event.isTeamEvent) {
            return res.status(400).json({ message: 'This is not a team event' });
        }

        // Check if event is still open for registration
        if (event.status !== 'upcoming' || !event.registrationOpen) {
            return res.status(400).json({ message: 'Registration is closed for this event' });
        }

        const { teamName, memberEmails } = req.body;

        if (!teamName || !memberEmails || !Array.isArray(memberEmails)) {
            return res.status(400).json({ message: 'Team name and member emails are required' });
        }

        // Validate team size
        if (memberEmails.length !== event.teamSize - 1) { // -1 because team leader is not in the array
            return res.status(400).json({ 
                message: `Team must have exactly ${event.teamSize} members (including team leader)` 
            });
        }

        // Check if seats are available
        if (event.teams.length >= event.seatLimit) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if team leader is already registered
        const isLeaderAlreadyRegistered = event.teams.some(team => 
            team.members.some(member => member.toString() === req.user.userId)
        );
        
        if (isLeaderAlreadyRegistered) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // Check if team name already exists
        const teamNameExists = event.teams.some(team => 
            team.teamName.toLowerCase() === teamName.toLowerCase()
        );
        
        if (teamNameExists) {
            return res.status(400).json({ message: 'Team name already exists for this event' });
        }

        // Validate member emails and get user IDs
        const User = require('../models/User');
        const memberIds = [];
        
        for (const email of memberEmails) {
            const user = await User.findOne({ email: email.toLowerCase(), role: 'student' });
            if (!user) {
                return res.status(400).json({ 
                    message: `Student with email ${email} not found or not a student` 
                });
            }
            
            // Check if member is already registered for this event
            const isMemberAlreadyRegistered = event.teams.some(team => 
                team.members.some(member => member.toString() === user._id.toString())
            );
            
            if (isMemberAlreadyRegistered) {
                return res.status(400).json({ 
                    message: `${email} is already registered for this event` 
                });
            }
            
            memberIds.push(user._id);
        }

        // Add team leader to members array
        memberIds.push(req.user.userId);

        // Create new team
        const newTeam = {
            teamName,
            teamLeader: req.user.userId,
            members: memberIds,
        };

        event.teams.push(newTeam);
        
        // Also add all members to registeredStudents for compatibility
        event.registeredStudents.push(...memberIds);
        
        await event.save();

        res.json({
            message: 'Team registered successfully for event',
            team: newTeam,
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update event (only organizers can update their own events)
router.put('/:id', auth, upload.single('eventImage'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is organizer and owns this event
        if (req.user.role === 'organizer' && event.organizer.toString() === req.user.userId) {
            
            // Update event fields
            const { title, description, category, date, time, venue, eligibility, seatLimit } = req.body;
            
            if (title) event.title = title;
            if (description) event.description = description;
            if (category) event.category = category;
            if (date) event.date = date;
            if (time) event.time = time;
            if (venue) event.venue = venue;
            if (eligibility) event.eligibility = eligibility;
            if (seatLimit) event.seatLimit = seatLimit;
            
            // Update image if new file was uploaded
            if (req.file) {
                event.imageUrl = `/uploads/${req.file.filename}`;
            }

            await event.save();

            // Populate organizer info before sending response
            const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email');

            res.json({
                message: 'Event updated successfully',
                event: populatedEvent
            });
        } else {
            return res.status(403).json({ message: 'You can only update your own events' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete event (only organizers)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is organizer
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can delete events' });
        }

        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get event registrations (only for organizers)
router.get('/:id/registrations', auth, async (req, res) => {
    try {
        // Find the event and populate registered students with full details
        const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email studentId department year createdAt');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is organizer of this event
        if (req.user.role === 'organizer' && event.organizer.toString() === req.user.userId) {
            
            res.json({
                message: 'Event registrations retrieved successfully',
                event: {
                    _id: event._id,
                    title: event.title,
                    seatLimit: event.seatLimit,
                    date: event.date,
                    time: event.time,
                    venue: event.venue
                },
                registrations: event.registeredStudents
            });
        } else {
            return res.status(403).json({ message: 'You can only view registrations for your own events' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Close event registration (organizers only)
router.put('/:id/close-registration', auth, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can close registrations' });
        }

        const event = await Event.findById(req.params.id).populate('registeredStudents', 'name email studentId department year');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user owns this event
        if (event.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only close registrations for your own events' });
        }

        // Update event status
        event.registrationOpen = false;
        event.status = 'registration-closed';
        await event.save();

        // Send confirmation emails to all registered students
        console.log(`📧 Sending confirmation emails to ${event.registeredStudents.length} students...`);
        
        for (const student of event.registeredStudents) {
            try {
                await sendRegistrationConfirmation(student.email, student.name, {
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    venue: event.venue,
                    category: event.category,
                    eligibility: event.eligibility
                });
            } catch (emailError) {
                console.error(`Failed to send email to ${student.email}:`, emailError);
            }
        }

        res.json({
            message: `Registration closed successfully. Confirmation emails sent to ${event.registeredStudents.length} students.`,
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark event as completed (organizers only)
router.put('/:id/complete', auth, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can mark events as completed' });
        }

        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user owns this event
        if (event.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only complete your own events' });
        }

        // Update event status
        event.status = 'completed';
        await event.save();

        res.json({
            message: 'Event marked as completed successfully. Students can now submit feedback.',
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Submit feedback for completed event (students only)
router.post('/:id/feedback', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can submit feedback' });
        }

        const { rating, comment } = req.body;

        if (!rating || !comment || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please provide a valid rating (1-5) and comment' });
        }

        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'completed') {
            return res.status(400).json({ message: 'Feedback can only be submitted for completed events' });
        }

        // Check if student was registered for this event
        if (!event.registeredStudents.includes(req.user.userId)) {
            return res.status(403).json({ message: 'You can only provide feedback for events you attended' });
        }

        // Check if feedback already submitted
        const existingFeedback = event.feedback.find(f => f.student.toString() === req.user.userId);
        if (existingFeedback) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        // Add feedback
        event.feedback.push({
            student: req.user.userId,
            rating: parseInt(rating),
            comment: comment.trim()
        });

        await event.save();

        res.json({
            message: 'Feedback submitted successfully',
            feedbackCount: event.feedback.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get event feedback (organizers only)
router.get('/:id/feedback', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('feedback.student', 'name studentId department year email')
            .populate('organizer', 'name email');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is organizer of this event
        if (req.user.role === 'organizer' && event.organizer._id.toString() === req.user.userId) {
            
            // Calculate feedback statistics
            const totalFeedback = event.feedback.length;
            const averageRating = totalFeedback > 0 
                ? (event.feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
                : 0;

            const ratingDistribution = {
                5: event.feedback.filter(f => f.rating === 5).length,
                4: event.feedback.filter(f => f.rating === 4).length,
                3: event.feedback.filter(f => f.rating === 3).length,
                2: event.feedback.filter(f => f.rating === 2).length,
                1: event.feedback.filter(f => f.rating === 1).length
            };

            res.json({
                message: 'Event feedback retrieved successfully',
                event: {
                    _id: event._id,
                    title: event.title,
                    date: event.date,
                    status: event.status,
                    totalRegistrations: event.registeredStudents.length
                },
                stats: {
                    totalFeedback,
                    averageRating: parseFloat(averageRating),
                    ratingDistribution,
                    responseRate: totalFeedback > 0 ? Math.round((totalFeedback / event.registeredStudents.length) * 100) : 0
                },
                feedback: event.feedback
            });
        } else {
            return res.status(403).json({ message: 'You can only view feedback for your own events' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
