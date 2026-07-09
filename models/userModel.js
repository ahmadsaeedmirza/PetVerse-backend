const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const { type } = require('os');
const Pet = require('./petModel');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'A user must have a name'],
        trim: true
    },
    email: {
        type: String,
        require: [true, 'A ser must have an email adress'],
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    phoneNo: {
        type: String,
        require: [true, 'A user must have a phone number']
    },
    password: {
        type: String,
        required: [true, 'Password field is required'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please reenter the password to confirm'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not same!'
        }
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: { type: [Number], default: [0, 0] }
    },
    pets: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Pet'
        }
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    role: {
        type: String,
        default: 'user'
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// userSchema.virtual('pets', {
//     ref: 'Pet',
//     foreignField: 'owner',
//     localField: '_id'
// });

userSchema.virtual('petList', {
    ref: 'Pet',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'pets'
    });
    next();
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;