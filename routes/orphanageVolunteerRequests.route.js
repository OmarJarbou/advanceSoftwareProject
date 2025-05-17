const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utilities/userRoles");

const controller = require("../controllers/VolunteerRequests.controller.js");

//Only ORPHANAGE_ADMIN

router.get(
  "/dashboard-summary",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.getOrphanageDashboardSummary
);
// إنشاء طلب تطوع جديد
router.post(
  "/",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.createVolunteerRequest
);

// تعديل طلب تطوع
router.patch(
  "/:id",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.updateVolunteerRequest
);

// حذف طلب تطوع
router.delete(
  "/:id",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.deleteVolunteerRequest
);

// الحصول على طلب تطوع معين
router.get(
  "/:id",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.getVolunteerRequestById
);

router.get(
  "/",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  controller.getMyVolunteerRequests
);


module.exports = router;
