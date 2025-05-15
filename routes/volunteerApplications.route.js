const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utilities/userRoles");

const controller = require("../controllers/VolunteerApplications.controller.js");

// 👤 Only VOLUNTEER

// تقديم طلب تطوع لطلب معين
router.post(
  "/apply/:requestId",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.applyToVolunteerRequest
);

// عرض كل طلبات المتطوع الحالي
router.get(
  "/my-applications",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.getMyApplications
);


router.get(
  "/orphanages",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.getAllApprovedOrphanages
);

// عرض كل الطلبات المفتوحة
router.get(
  "/requests",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.getAllOpenRequests
);

// عرض أنواع الخدمات التطوعية
router.get(
  "/service-types",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.getServiceTypes
);
router.get(
  "/volunteer-requests/orphanage/:orphanageId",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.getVolunteerRequestsByOrphanageId
);
router.delete(
  "/:applicationId",
  verifyToken,
  allowedTo(userRoles.VOLUNTEER),
  controller.deleteVolunteerApplication
);


module.exports = router;
