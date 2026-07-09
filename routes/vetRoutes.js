const express = require('express');
const vetController = require('./../controllers/vetController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', vetController.signUp);
router.post('/signup-otp', vetController.reqOTP);
router.post('/verify-otp', vetController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

router.post('/login', vetController.logIn);
router.get('/logout', authController.logOut);
router.post('/forgetPassword', vetController.forgetPassword);
router.patch('/resetPassword/:type/:token', authController.resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(vetController.protect);

router.patch('/updatePassword', vetController.updatePassword);
router.patch('/updateMe', vetController.updateVet);
router.delete('/deleteMe', vetController.deleteVet);
router.get('/me', vetController.getVet);

router.use(authController.restrictTo('vet'));

// BOOKINGS
router.get('/bookings', vetController.getAllBookings);
router.patch('/booking/:id/confirm', vetController.confirmBooking);
router.patch('booking/:id/cancel', vetController.cancelBooking);
router.get('/booking/:id', vetController.getBooking);

module.exports = router;