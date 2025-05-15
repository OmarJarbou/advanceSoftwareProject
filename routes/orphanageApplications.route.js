const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utilities/userRoles");

const controller = require("../controllers/VolunteerApplications.controller.js");

// Only ORPHANAGE_ADMIN

// عرض كل الطلبات المقدمة لمؤسسة المشرف
router.get(
  "/",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.getApplicationsForOrphanage
);

// قبول طلب تطوع
router.patch(
  "/:applicationId/approve",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.approveApplication
);

// رفض طلب تطوع
router.patch(
  "/:applicationId/reject",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.rejectApplication
);

module.exports = router;
