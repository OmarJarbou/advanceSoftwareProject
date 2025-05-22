const jwt = require('jsonwebtoken');
const httpStatusText = require('../utilities/httpStatusText.js');
const appError = require('../utilities/appError.js');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if(!authHeader) {
        return res.status(401).json({ message: 'token is rquired' });
    }
    const token = authHeader.split(' ')[1];

    try{
        const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY); // decode
        req.currentUser = currentUser;
        next();
    }
    catch(err){
        const error = appError.create("Invalid token", 401, httpStatusText.ERROR);// unauthorized
        return next(error);
    }
}

module.exports = verifyToken;