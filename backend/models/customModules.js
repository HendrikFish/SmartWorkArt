const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    employer: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    facility: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'co-admin', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('Customer', customerSchema);
