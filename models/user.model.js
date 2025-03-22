const mongoose = require('mongoose');
const validator = require('validator');
const userRoles = require('../utilities/userRoles');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, validate: [validator.isEmail /*we dont want to call the func (just pass it) thats why we did not put ()*/, 'Field must be a valid email address'] },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    role: { type: String, enum: [userRoles.DONOR, userRoles.VOLUNTEER, userRoles.SPONSOR, userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN], default: userRoles.DONOR, required: true },
    avatar: { type: String, default: 'uploads/profile.png' },
    token: { type: String },
    stripeCustomerId: { type: String }, // for sponsors
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);