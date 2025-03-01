const appError = require("../utilities/appError");
const httpStatusText = require('../utilities/httpStatusText.js');

module.exports = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.currentUser.role)) {
            return next(appError.create('Your forbidden to do this action'), 403, httpStatusText.ERROR);
        }
    }
}