const express = require("express");
const router = express.Router();
const controllingDonationController = require("../controllers/controlDonation.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// إنشاء سجل تحكم
router.post(
  "/:donationId/control",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN),
  controllingDonationController.createControlDonation
);



// جلب سجل معين بواسطة ID
router.get(
  "/:id",
  verifyToken,
  allowedTo(userRoles.ADMIN, userRoles.ORPHANAGE_ADMIN),
  controllingDonationController.getControlDonationById
);
router.get("/", verifyToken, allowedTo(userRoles.ADMIN, userRoles.ORPHANAGE_ADMIN), controllingDonationController.getControlDonations);

router.patch(
  "/:id",
  verifyToken,
  allowedTo(userRoles.ADMIN, userRoles.ORPHANAGE_ADMIN),
  controllingDonationController.updateControlDonation
);



module.exports = router;
