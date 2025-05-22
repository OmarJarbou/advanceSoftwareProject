// routes/systemSettings.route.js
const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

const controller = require("../controllers/systemSettings.controller.js");

router.post("/init", controller.createDefaultSystemSettings);

router.get("/", verifyToken, allowedTo(userRoles.ADMIN), controller.getSettings);

router.patch("/", verifyToken, allowedTo(userRoles.ADMIN), controller.updateOperationalFee);

module.exports = router;
