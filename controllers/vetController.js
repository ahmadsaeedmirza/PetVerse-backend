const multer = require('multer');
const AppError = require('./../utils/appErrors');
const catchAsync = require('./../utils/catchAsync');
const Vet = require('./../models/vetsModel');
const factory = require('./factoryFunctions');
const authController = require('./authController');
const Booking = require('../models/bookingModel');

exports.updateVet = factory.updateOne(Vet);
exports.deleteVet = factory.deleteOne(Vet);
exports.getAllVets = factory.getAll(Vet);
exports.getVet = factory.getOne(Vet);

exports.signUp = authController.signup(Vet);
exports.reqOTP = authController.requestSignupOTP(Vet);
exports.verifyOTP = authController.verifySignupOTP(Vet);
exports.logIn = authController.login(Vet);
exports.protect = authController.protect(Vet);
exports.isLoggedIn = authController.isLoggedIn(Vet);
exports.forgetPassword = authController.forgetPassword(Vet);
// exports.resetPassword = authController.resetPassword(Vet);
exports.updatePassword = authController.updatePassword(Vet);

exports.confirmBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: 'confirmed' },
        { new: true, runValidators: true }
    );

    if (!booking) return next(new AppError('No booking found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true, runValidators: true }
    );

    if (!booking) return next(new AppError('No booking found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ vet: req.user.id });

    res.status(200).json({
        status: 'success',
        data: {
            bookings
        }
    });
});

exports.getBooking = factory.getOne(Booking);