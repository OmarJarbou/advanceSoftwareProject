const express = require("express");
const router = express.Router();

const driverRequestController = require("../controllers/driverRequest.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// driver يقدم طلب ل orphanage
router.post("/", verifyToken, allowedTo(userRoles.DRIVER), driverRequestController.createDriverRequest);

// orphanage admin يعرض الطلبات الخاصة بداره
router.get("/:orphanageId", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), driverRequestController.getDriverRequestsForOrphanage);

// orphanage admin يوافق أو يرفض طلب سائق
router.patch("/:requestId", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), driverRequestController.updateDriverRequestStatus);

module.exports = router;
