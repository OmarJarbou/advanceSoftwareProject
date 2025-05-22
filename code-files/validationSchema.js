const {body} = require('express-validator');

const validationSchema = () => {
    return [
        body('name')
            .notEmpty()
            .withMessage("Name is at least 1 character") 
            .isLength({min: 1})
            .withMessage("Name is required") 
            .isString()
            .withMessage("Name is string"), 
        body('price')
            .notEmpty()
            .withMessage("Price is required")
            .isNumeric()
            .withMessage("Price is numeric") /*chaining*/
    ];
};

module.exports = {
    validationSchema
};