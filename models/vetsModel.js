const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');

const vetsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        require: [true, 'A user must have an email adress'],
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    title: { type: String }, // e.g. Dr.
    degree: { type: String }, // e.g. DVM
    specialty: { type: String }, // e.g. Pet Specialist
    profileImage: { type: String }, // image URL
    isPVMCVerified: { type: Boolean, default: false },
    stats: {
        experience: { type: String }, // e.g. "2 Years"
        satisfaction: { type: Number, default: 0 }, // in %
        waitTime: { type: String } // e.g. "20 Mins"
    },
    ratingsAverage: { type: Number, default: 0 }, // Average rating
    ratingsQuantity: { type: Number, default: 0 }, // Number of ratings
    aboutMe: { type: String },
    specialization: [{ type: String }], // e.g. ["Dog Specialist", "Cat Specialist"]
    slug: { type: String },
    password: {
        type: String,
        required: [true, 'A vet must have a password'],
        minlength: 8,
        select: false // So it’s only queried when needed (for security)
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords do not match!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Service fields directly in vet schema
    clinicAppointments: {
        enabled: { type: Boolean, default: false },
        price: { type: Number },
        days: [{ type: String }],
        fromTime: { type: String },
        tillTime: { type: String },
        location: { type: String } // e.g. address
    },
    onlineConsultation: {
        enabled: { type: Boolean, default: false },
        price: { type: Number },
        days: [{ type: String }],
        fromTime: { type: String },
        tillTime: { type: String },
        location: { type: String, default: "Online" }
    },
    homeVisits: {
        enabled: { type: Boolean, default: false },
        price: { type: Number },
        days: [{ type: String }],
        fromTime: { type: String },
        tillTime: { type: String },
        location: { type: String }
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: { type: [Number], required: true },
    },
    area: { type: String, required: true },   // e.g., "Model Town"
    address: String,
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });


vetsSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
})

vetsSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

vetsSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
})

vetsSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

vetsSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

vetsSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

vetsSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

const Vet = mongoose.model('Vet', vetsSchema);

module.exports = Vet;