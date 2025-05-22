const express = require("express");
const router = express.Router();
const supportProgramController = require("../controllers/supportProgram.controller");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utilities/userRoles");

// إنشاء Support Program
router.post(
  "/create",
  verifyToken,
  allowedTo(userRoles.SUPPORT_PROGRAM_ADMIN),
  supportProgramController.createSupportProgram
);

// الحصول على جميع برامج الدعم
router.get("/", verifyToken, allowedTo(userRoles.SUPPORT_PROGRAM_ADMIN,userRoles.ADMIN,userRoles.ORPHANAGE_ADMIN), supportProgramController.getAllSupportPrograms);

// الحصول على برنامج دعم بواسطة ID
router.get("/:id", verifyToken  ,allowedTo(userRoles.SUPPORT_PROGRAM_ADMIN, userRoles.ADMIN,userRoles.ORPHANAGE_ADMIN),supportProgramController.getSupportProgramById);



// حذف برنامج الدعم
router.delete(
  "/:id",
  verifyToken,
  allowedTo(userRoles.SUPPORT_PROGRAM_ADMIN),
  supportProgramController.deleteSupportProgram
);
router.get(
  "/orphanage/:orphanageId",  // استخدام :orphanageId لتمرير معرف المؤسسة
  verifyToken,
  allowedTo(userRoles.SUPPORT_PROGRAM_ADMIN,userRoles.ADMIN, userRoles.ORPHANAGE_ADMIN),  // السماح للـ Admin و Orphanage Admin
  supportProgramController.getSupportProgramByOrphanage
);


module.exports = router;
