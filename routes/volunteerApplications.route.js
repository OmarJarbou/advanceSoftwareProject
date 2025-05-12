const express = require("express");
const router = express.Router();
const volunteerController = require("../controllers/VolunteerApplications.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

router.post("/apply/:requestId", verifyToken, allowedTo(userRoles.VOLUNTEER), volunteerController.applyToVolunteerRequest);
  router.get("/my-applications", verifyToken, allowedTo(userRoles.VOLUNTEER), volunteerController.getMyApplications);
  router.get("/:applicationId", verifyToken, allowedTo(userRoles.VOLUNTEER), volunteerController.getApplicationById);
  router.delete("/cancel/:applicationId", verifyToken, allowedTo(userRoles.VOLUNTEER), volunteerController.cancelApplication);

// // Orphanage admin: view all applications for their orphanage
 router.get("/orphanage/my-application", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), volunteerController.getApplicationsForMyOrphanage);

// // Orphanage admin: view applications for a specific request
// router.get("/request/:requestId", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), volunteerController.getApplicationsByRequest);

// // Orphanage admin: accept/reject application
// router.patch("/:applicationId/accept", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), volunteerController.acceptApplication);
// router.patch("/:applicationId/reject", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), volunteerController.rejectApplication);
module.exports = router; 