const asyncWrapper = require('../middlewares/asyncWrapper.js');
const User = require('../models/user.model.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const appError = require('../utilities/appError.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateJWT = require('../utilities/generateJWT.js');
const userRoles = require('../utilities/userRoles.js');

const getAllUsers = asyncWrapper(
    async (req,res) => {
        console.log(req.headers);
        const query = req.query;

        /* Pagination */
            const limit = query.limit || 4;
            const page = query.page || 1;
            const skip = (page - 1) * limit;

            const users = await User.find({}, {__v: false, 'password': false}).limit(limit).skip(skip);
        /* Pagination */

        return res.json({ status: httpStatusText.SUCCESS, data: {users} });
    }
);

const register = asyncWrapper(
    async(req,res,next) => {
        const {firstName, lastName, email, password, phone, address, role} = req.body;
        let resultRole = role;

        // Check if all required fields are provided
        if (!firstName || !lastName || !email || !password || !phone || !address || !role) {
            const error = appError.create('All fields are required', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const error = appError.create('Invalid email format', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the password is strong
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            const error = appError.create('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the phone number is valid
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            const error = appError.create('Invalid phone number format', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Cheak if the role is ADMIN => if yes, then mark role as TEMPORARY
        if (role === userRoles.ADMIN) {
            resultRole = userRoles.TEMPORARY;
        }
        // Check if the role is valid
        if (![userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN, userRoles.DRIVER, userRoles.ORPHANAGE_ADMIN, userRoles.SPONSOR, userRoles.VOLUNTEER, userRoles.TEMPORARY].includes(resultRole)) {
            const error = appError.create('Invalid role', 400, httpStatusText.FAIL);
            return next(error);
        }

        // Check if file exists
        let avatarFilename = null;
        if (req.file) {
            avatarFilename = req.file.filename;
        }

        // password hashing:
        const hashedPassword = await bcrypt.hash(password, 10); // hash(password, salt /*adding random string - to protect against rainbow table anmd brute-force attacks*/)
        const isDriver = (resultRole === userRoles.DRIVER);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            address,
            role: resultRole,
            driverStatus: isDriver ? 'AVAILABLE' : undefined,
            driverCurrentLocation: isDriver ? { type: 'Point', coordinates: [0, 0] } : undefined,
            avatar: avatarFilename
        });

        // generate jwt token
        const token = await generateJWT({id: newUser._id, email: newUser.email, role: newUser.role});
        newUser.token = token;

        const oldUser = await User.findOne({email: email});
        if(oldUser) {
            const error = appError.create('user already exists', 400, httpStatusText.FAIL);
            return next(error);
        }

        await newUser.save();
        return res.status(201).json({ status: httpStatusText.SUCCESS, data: {user: newUser} });
    }
);

const login = asyncWrapper(
    async (req, res, next) => {
        const {email, password} = req.body;

        if(!email || !password){
            const error = appError.create('email and password are required', 400, httpStatusText.FAIL);
            return next(error);
        }

        const user = await User.findOne({email: email});

        if(!user){
            const error = appError.create('user not found', 400, httpStatusText.FAIL);
            return next(error);
        }

        const matchedPassword = bcrypt.compare(password, user.password /*hashed pass from DB*/);

        if(user && matchedPassword){
            // logged in successfully
            const token = await generateJWT({id: user._id, email: user.email, role: user.role});
            return res.json({ status: httpStatusText.SUCCESS, data: {id: user._id, token}});
        }
        else{
            const error = appError.create('invalid email or password', 404, httpStatusText.ERROR);
            return next(error);
        }
    }
);

// ADMIN accepts/denies user registration with role ADMIN
const acceptAdministration = asyncWrapper(async (req, res, next) => {
    const {id} = req.params;
    const {status} = req.body;
    const user = await User.findById(id);
    if (!user) {
        return next(appError.create('User not found', 404, httpStatusText.FAIL));
    }  
    if (status === 'ACCEPT') {
        user.role = userRoles.ADMIN;
    }
    else if (status === 'DENY') {
        user.role = userRoles.DONOR;
    }
    else {
        return next(appError.create('Invalid status', 400, httpStatusText.FAIL));
    }
    await user.save();
    res.status(200).json({ status: httpStatusText.SUCCESS, message: `User ${status === 'ACCEPT' ? 'accepted' : 'denied'} successfully.` });
});

// Get all users with role TEMPORARY
const getAllTemporaryUsers = asyncWrapper(async (req, res, next) => {
    const users = await User.find({ role: userRoles.TEMPORARY }, { __v: false, password: false });
    if (!users || users.length === 0) {
        return next(appError.create('No temporary users found', 404, httpStatusText.FAIL));
    }
    res.status(200).json({ status: httpStatusText.SUCCESS, data: { users } });
});

// Update user information
const updateInfo = asyncWrapper(async (req, res, next) => {
        const userId = req.currentUser.id;
        const {firstName, lastName, email, password, phone, address, role} = req.body;
        let resultRole = role;

        // Check if all required fields are provided
        if (!firstName || !lastName || !email || !password || !phone || !address || !role) {
            const error = appError.create('All fields are required', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const error = appError.create('Invalid email format', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the password is strong
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            const error = appError.create('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Check if the phone number is valid
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            const error = appError.create('Invalid phone number format', 400, httpStatusText.FAIL);
            return next(error);
        }
        // Cheak if the role is ADMIN => if yes, then mark role as TEMPORARY
        if (role === userRoles.ADMIN) {
            resultRole = userRoles.TEMPORARY;
        }
        // Check if the role is valid
        if (![userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN, userRoles.DRIVER, userRoles.ORPHANAGE_ADMIN, userRoles.SPONSOR, userRoles.VOLUNTEER, userRoles.TEMPORARY].includes(resultRole)) {
            const error = appError.create('Invalid role', 400, httpStatusText.FAIL);
            return next(error);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
            return next(appError.create('Email already used by another user', 400, httpStatusText.FAIL));
        }

        // Check if file exists
        let avatarFilename = null;
        if (req.file) {
            avatarFilename = req.file.filename;
        }

        // password hashing:
        const hashedPassword = await bcrypt.hash(password, 10); // hash(password, salt /*adding random string - to protect against rainbow table anmd brute-force attacks*/)
        const isDriver = (resultRole === userRoles.DRIVER);

        // generate jwt token
        const token = await generateJWT({id: userId, email: email, role: role});

        const user = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phone,
                address,
                role: resultRole,
                token,
                driverStatus: isDriver ? 'AVAILABLE' : undefined,
                driverCurrentLocation: isDriver ? { type: 'Point', coordinates: [0, 0] } : undefined,
                avatar: avatarFilename
            },
            { new: true, runValidators: true }
        );

        if (!user) return next(appError.create("User not found", 404, httpStatusText.FAIL));
        res.status(200).json({ status: httpStatusText.SUCCESS, data: { user } });
});

// Delete user account
const deleteMyAccount = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return next(appError.create("User not found", 404, httpStatusText.FAIL));
    res.status(200).json({ status: httpStatusText.SUCCESS, message: "Your account has been deleted." });
});

// Delete user by ID (admin only)
const deleteUserById = asyncWrapper(async (req, res, next) => {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return next(appError.create("User not found", 404, httpStatusText.FAIL));
    res.status(200).json({ status: httpStatusText.SUCCESS, message: "User deleted successfully." });
});

module.exports = {
    getAllUsers,
    register,
    login,
    updateInfo,
    deleteMyAccount,
    deleteUserById,
    acceptAdministration,
    getAllTemporaryUsers
}