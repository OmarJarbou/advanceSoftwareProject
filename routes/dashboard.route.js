const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// مسار لجلب كل سجلات التحكم المرتبطة بتبرعات الدونور
router.get(
  "/donor/control-records",
  verifyToken,
  allowedTo(userRoles.DONOR),
  dashboardController.getDonorControlRecords
);

// مسار لجلب سجل تحكم معين للدونور بواسطة ID
router.get(
  "/donor/control-records/:id",
  verifyToken,
  allowedTo(userRoles.DONOR),
  dashboardController.getDonorControlRecordsById
);

// مسار لعرض ملخص تبرعات الدونور حسب النوع
router.get(
  "/donor/summary",
  verifyToken,
  allowedTo(userRoles.DONOR),
  dashboardController.getDonorSummary
);

module.exports = router;
