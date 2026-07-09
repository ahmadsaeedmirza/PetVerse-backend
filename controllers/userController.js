const multer = require('multer');
const AppError = require('./../utils/appErrors');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const Pet = require('../models/petModel');
const factory = require('./factoryFunctions');
const authController = require('./authController');
const Booking = require('../models/bookingModel');

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// exports.uploadPet = factory.createOne(Pet);

exports.uploadPet = catchAsync(async (req, res, next) => {
    const pet = await Pet.create({
        name: req.body.name,
        specie: req.body.specie,
        breed: req.body.breed,
        age: req.body.age,
        owner: req.user.id,
        gender: req.body.gender,
        medicalHistory: req.body.medicalHistory,
        image: req.body.image
    });

    res.status(200).json({
        status: 'success',
        pet
    });
});

exports.myPets = catchAsync(async (req, res, next) => {
    const pets = await Pet.find({ owner: req.user.id });

    res.status(200).json({
        status: 'success',
        count: pets.length,
        pets
    });
});

exports.bookAppointment = catchAsync(async (req, res, next) => {

    console.log(req.body);
    const booking = await Booking.create({
        vet: req.body.vet,
        pet: req.body.pet,
        date: req.body.date,
        timeSlot: req.body.timeSlot,
        user: req.user.id
    });

    res.status(200).json({
        status: 'success',
        data: {
            booking
        }
    });
});

exports.myBookings = catchAsync(async (req, res, next) => {
    const myBookings = await Booking.find({ user: req.user.id });

    req.status(200).json({
        status: 'success',
        myBookings
    });
});

exports.updateBooking = factory.updateOne(Booking);

exports.cancelBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with this id', 404));
    }

    res.status(204).json({
        status: 'succcess',
        data: null
    });
});

exports.signUp = authController.signup(User);
exports.reqOTP = authController.requestSignupOTP(User);
exports.verifyOTP = authController.verifySignupOTP(User);
exports.LogIn = authController.login(User);
exports.protect = authController.protect(User);
exports.isLoggedIn = authController.isLoggedIn(User);
exports.forgetPassword = authController.forgetPassword(User);
// exports.resetPassword = authController.resetPassword(User);
exports.updatePassword = authController.updatePassword(User);