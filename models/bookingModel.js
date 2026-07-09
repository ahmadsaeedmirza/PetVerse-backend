const mongoose = require('mongoose');
const Vet = require('./vetsModel');
const User = require('./userModel');
const Pet = require('./petModel');

const bookingSchema = new mongoose.Schema({
    vet: {
        type: mongoose.Schema.ObjectId,
        ref: 'Vet',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    pet: {
        type: mongoose.Schema.ObjectId,
        ref: 'Pet'
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String, // e.g., "10:30 AM - 11:00 AM"
        required: true
    },
    type: {
        type: String,
        enum: ['in-person', 'online'],
        default: 'in-person'
    },
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    price: {
        type: Number
    },
    payment: {
        type: String,
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;