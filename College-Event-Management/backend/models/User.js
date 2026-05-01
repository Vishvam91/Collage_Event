// User model for students and organizers
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: function() {
            return this.role === 'student'; // Only required for students
        }
    },
    role: {
        type: String,
        enum: ['student', 'organizer'],
        default: 'student'
    },
    department: {
        type: String,
        enum: ['CSE', 'CE', 'IT', 'AIML'],
        required: function() {
            return this.role === 'student';
        }
    },
    year: {
        type: Number,
        required: function() {
            return this.role === 'student';
        }
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check password
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
