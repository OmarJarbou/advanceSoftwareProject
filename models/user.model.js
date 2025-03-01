const mongoose = require('mongoose');
const validator = require('validator');
const userRoles = require('../utilities/userRoles');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail /*we dont want to call the func (just pass it) thats why we did not put ()*/, 'Field must be a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    role:{
        type:String,
        enum: [userRoles.USER, userRoles.ADMIN, userRoles.MANAGER],
        default: userRoles.USER
    },
    avatar:{
        type:String,
        default: 'uploads/profile.png'
    }
});

module.exports = mongoose.model('User',userSchema);