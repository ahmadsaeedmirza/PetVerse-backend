const mongoose = require('mongoose');
const User = require('./userModel');

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A pet must have a name']
    },
    specie: {
        type: String, // Dog, cat, etc
        required: [true, 'A pet type must be specified']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Neutral']
    },
    image: String,
    breed: String,
    age: Number,
    // weight: Number,
    medicalHistory: String,
    // vaccinationHistory: [
    //     {
    //         type: String,
    //         date: Date,
    //         notes: String
    //     }
    // ],
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Pet = mongoose.model('Pet', petSchema);

module.exports = Pet;