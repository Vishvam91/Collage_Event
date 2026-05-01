// Event model for college events
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Cultural', 'Technical', 'Sports', 'Workshop', 'Hackathon', 'Other'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    eligibility: {
        type: String,
        default: 'All students'
    },
    seatLimit: {
        type: Number,
        required: true
    },
    isTeamEvent: {
        type: Boolean,
        default: false
    },
    teamSize: {
        type: Number,
        default: 1,
        min: 1
    },
    registeredStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    teams: [{
        teamName: {
            type: String,
            required: true
        },
        teamLeader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        registeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'registration-closed', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    registrationOpen: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    feedback: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Calculate available seats
eventSchema.virtual('availableSeats').get(function() {
    if (this.isTeamEvent) {
        return this.seatLimit - this.teams.length;
    }
    return this.seatLimit - this.registeredStudents.length;
});

module.exports = mongoose.model('Event', eventSchema);
