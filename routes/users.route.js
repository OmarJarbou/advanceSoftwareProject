const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller.js');
const verifyToken = require('../middlewares/verifyToken.js');
const appError = require('../utilities/appError.js');
const httpStatusText = require('../utilities/httpStatusText.js');

const multer  = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //cb: callback
      cb(null /*error*/, 'uploads');
    },
    filename: function (req, file, cb) {
      const ext = file.mimetype.split('/')[1];
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext; // to handle same-name uploaded files
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
const fileFilter = (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if(fileType === 'image'){
        return cb(null, true);
    }
    else{
        return cb(appError.create('file type should be image', 400, httpStatusText.FAIL), false);
    }
};
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

router.route('/')
    .get(verifyToken, usersController.getAllUsers);

router.route('/register')
    .post(upload.single('avatar'), usersController.register);

router.route('/login')
    .post(usersController.login);

module.exports = router;