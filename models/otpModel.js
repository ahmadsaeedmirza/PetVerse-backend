const mongoose = require('mongoose');
const validator = require('validator');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email field is required'],
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    verified: {
        type: Boolean,
        default: false
    },
    otp: String,
    role: {
        type: String,
    },
    expiresAt: Date
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;