const asyncWrapper = require('../middlewares/asyncWrapper.js');
const User = require('../models/user.model.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const appError = require('../utilities/appError.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateJWT = require('../utilities/generateJWT.js');

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

        // password hashing:
        const hashedPassword = await bcrypt.hash(password, 10); // hash(password, salt /*adding random string - to protect against rainbow table anmd brute-force attacks*/)

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            address,
            role,
            avatar: req.file.filename
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

module.exports = {
    getAllUsers,
    register,
    login
}