const crypto = require('crypto');
const { promisify } = require('util');
const Vet = require('../models/vetsModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('../utils/appErrors');
const jwt = require('jsonwebtoken');
const OTPModel = require('../models/otpModel');
const transporter = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production'
    });

    // Debug log
    console.log('JWT cookie created:', {
        token,
        env: process.env.NODE_ENV,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
    });

    user.password = undefined;
    user.active = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.requestSignupOTP = Model => catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await Model.findOne({ email });

    if (!user) {
        const existingOTP = await OTPModel.findOne({ email });

        if (existingOTP && existingOTP.expiresAt > Date.now()) {
            return res.status(400).json({
                status: 'fail',
                message: 'OTP already sent. Please wait for it to expire.'
            });
        }

        // If expired, delete old record to avoid duplicates
        if (existingOTP) {
            await OTPModel.deleteOne({ email });
        }

        const expiresAt = Date.now() + 2 * 60 * 1000;

        // Store OTP + user data temporarily
        await OTPModel.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP
        // await transporter.sendMail({
        //     to: email,
        //     subject: "FindsVet OTP CODE (valid for 2 minutes)",
        //     text: `Your OTP is ${otp}. It expires in 2 minutes.`
        // });

        res.status(200).json({
            status: 'success',
            message: 'OTP sent to your email',
            expiresAt
        });
    } else {
        return res.status(400).json({
            status: 'fail',
            message: 'This email is already registered!'
        })
    }
});

exports.resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const prevUser = await OTPModel.findOne({ email });

    if (!prevUser) {
        return res.status(404).json({
            status: 'fail',
            message: 'No signup request found for this email'
        });
    }

    if (prevUser.expiresAt > Date.now()) {
        return res.status(400).json({
            status: 'fail',
            message: 'OTP already sent. Please wait for it to expire.'
        });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newExpiry = Date.now() + 2 * 60 * 1000;
    const user = await OTPModel.findOneAndUpdate(
        { email },
        { otp, expiresAt: newExpiry },
        { new: true }
    );

    // Send OTP
    // await transporter.sendMail({
    //     to: email,
    //     subject: "FindsVet OTP CODE (valid for 2 minutes)",
    //     text: `Your OTP is ${otp}. It expires in 2 minutes.`
    // });

    res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email',
        expiresAt: newExpiry
    });
});

exports.verifySignupOTP = Model => catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    const record = await OTPModel.findOne({ email, otp });
    if (!record) {
        return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP' });
    }

    console.log(record);

    if (record.expiresAt < Date.now()) {
        await OTPModel.deleteMany({ email, verified: false });
        return res.status(400).json({ status: 'fail', message: 'OTP expired' });
    }

    record.verified = true;
    if (Model === Vet) {
        record.role = 'vet';
    } else if (Model === User) {
        record.role = 'user';
    }

    await record.save();

    // createSendToken(newUser, 201, req, res);
    res.status(200).json({
        status: 'success'
    })
});

exports.signup = Model => catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const otpRecord = await OTPModel.findOne({ email, verified: true });
    if (!otpRecord) {
        return res.status(400).json({ status: 'fail', message: 'Email not verified' });
    }
    const newUser = await Model.create(req.body);
    await OTPModel.deleteOne({ email });
    createSendToken(newUser, 201, req, res);
});

exports.login = Model => catchAsync(async (req, res, next) => {

    const { email, password } = req.body;

    // CHECK IF EMAIL & PASSWORD IS PROVIDED
    if (!email || !password) {
        return next(new AppError('Please provide email and Password'), 400);
    }

    // CHECK IF THAT EMAIL EXISTS
    const user = await Model.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Invalid email or password', 401));
    }

    // IF EVERYTHING OK, SEND TOKEN
    createSendToken(user, 200, req, res);
});

exports.logOut = (req, res) => {
    res.cookie('jwt', 'bahirhoNikalEthon', {
        expiresIn: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = Model => catchAsync(async (req, res, next) => {

    console.log(req.cookies.jwt);
    let token;
    // 1) GETTING TOKEN & CHECK IF IT'S THERE
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    console.log(token);

    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access', 401));
    }

    // 2) VERIFYING TOKEN
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) CHECK IF USER STILL EXISTS
    const currentUser = await Model.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists'));
    }

    // 4) CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again!', 401));
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.isLoggedIn = Model => async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) VERIFYING TOKEN
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 2) CHECK IF USER STILL EXISTS
            const currentUser = await Model.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) CHECK IS USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
            if (currentUser.chengedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
}

exports.forgetPassword = Model => catchAsync(async (req, res, next) => {
    // 1) GET USER BASED ON POSTED EMAIL
    const email = req.body.email;
    const user = await Model.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('No user found with this email!', 404));
    }

    // 2) GENERATE RANDOM RESET TOKEN
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        // const resetUrl = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
        let resetUrl;
        if (Model === Vet) {
            resetUrl = `${process.env.FRONTEND_URL}/resetPassword/vet/${resetToken}`;
        } else {
            resetUrl = `${process.env.FRONTEND_URL}/resetPassword/user/${resetToken}`;
        }

        // await transporter.sendMail({
        //     to: email,
        //     subject: "FindsVet OTP CODE (valid for 10 minutes)",
        //     text: `Your password reset url is ${resetUrl} It expires in 10 minutes.`
        // });

        console.log(resetUrl);

        res.status(200).json({
            status: 'success',
            message: 'Token sent to mail'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending mail! Please try again later', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {

    const { type, token } = req.params;

    // Select Model based on type
    let Model;
    if (type === 'user') {
        Model = User; // import your User model
    } else if (type === 'vet') {
        Model = Vet; // import your Vet model
    } else {
        return next(new AppError('Invalid user type!', 400));
    }

    // 1) GET USER BASED ON THE TOKEN
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await Model.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) IF TOKEN HAS NOT EXPIRED AND THERE IS USER, SET THE NEW PASSWORD
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) UPDATE THE passwordChangedAt PROPERTY FOR USER (HANDLED USING MIDDLEWARE)

    // 4) LOG THE USER IN & SEND THE JWT
    createSendToken(user, 200, req, res);
});

exports.updatePassword = Model => catchAsync(async (req, res, next) => {
    // 1) GET USER FROM COLLECTION
    const user = await Model.findById(req.user.id).select('+password');

    // 2) CHECK IF POSTED PASSWORD IS CORRECT
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Invalid Password', 401));
    }

    // 3) IF SO, UPDATE PASSWORD
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    // 4) LOGIN USER, SEND JWT
    createSendToken(user, 200, req, res);
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            next(new AppError('You do not have permission to perform this action!', 403));
        }
        next();
    }
}