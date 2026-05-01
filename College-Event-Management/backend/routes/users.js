// User routes for profile and user management
const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile fetched successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's registered events (for students)
router.get('/my-events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can view registered events' });
        }

        const events = await Event.find({ registeredStudents: req.user.userId })
            .populate('organizer', 'name email')
            .populate('teams.teamLeader', 'name email studentId')
            .populate('teams.members', 'name email studentId')
            .sort({ date: 1 });

        res.json({
            message: 'Registered events fetched successfully',
            events
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get events created by organizer
router.get('/my-organized-events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can view organized events' });
        }

        const events = await Event.find({ organizer: req.user.userId })
            .populate('registeredStudents', 'name email studentId')
            .populate('teams.teamLeader', 'name email studentId')
            .populate('teams.members', 'name email studentId')
            .sort({ date: 1 });

        res.json({
            message: 'Organized events fetched successfully',
            events
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, department, year } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (department) user.department = department;
        if (year) user.year = year;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                year: user.year
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
