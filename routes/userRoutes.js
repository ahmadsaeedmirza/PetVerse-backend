const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', userController.signUp);
router.post('/signup-otp', userController.reqOTP);
router.post('/verify-otp', userController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

router.post('/login', userController.LogIn);
router.get('/logout', authController.logOut);
router.post('/forgetPassword', userController.forgetPassword);
router.patch('/resetPassword/:type/:token', authController.resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(userController.protect);

router.patch('/updatePassword', userController.updatePassword);
router.patch('/updateMe', userController.updateUser);
router.delete('/deleteMe', userController.deleteUser);
router.get('/me', userController.getUser);

// PET ROUTES
router.post('/uploadPet', userController.uploadPet);
router.get('/myPets', userController.myPets);

// BOOKING ROUTES
router.post('/booking', userController.bookAppointment);
router.get('/myBookings', userController.myBookings);
router.patch('/booking/:id', userController.updateBooking);
router.delete('/booking/:id', userController.cancelBooking);

module.exports = router;