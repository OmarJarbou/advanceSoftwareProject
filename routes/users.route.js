const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller.js');
const verifyToken = require('../middlewares/verifyToken.js');
const appError = require('../utilities/appError.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const upload = require('../middlewares/uploadUserAvatar.js');
const allowedTo = require('../middlewares/allowedTo.js');
const userRoles = require('../utilities/userRoles.js');

router.route('/')
    .get(verifyToken, usersController.getAllUsers)
    .put(
        verifyToken,
        upload.single("avatar"),
        usersController.updateInfo
    )
    .delete(verifyToken, usersController.deleteMyAccount);

router.route('/register')
    .post(upload.single('avatar'), usersController.register);

router.route('/login')
    .post(usersController.login);

//Get All Users With Role TEMPORARY
router.route('/temporary')
    .get(verifyToken, allowedTo(userRoles.ADMIN), usersController.getAllTemporaryUsers);

router.route('/:id')
    .delete(verifyToken, usersController.deleteUserById)
    .get(verifyToken, usersController.getUserById);

//Accept Adminitration Request
router.route('/AdministrationRequest/:id')
    .put(verifyToken, allowedTo(userRoles.ADMIN), usersController.acceptAdministration);

//Forget Password
// router.route('/forgetPassword')
//     .post(usersController.forgetPassword);

module.exports = router;