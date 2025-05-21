const express = require("express");
const router = express.Router();
const orphanageController = require("../controllers/orphanages.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");
const checkOrphanage = require("../middlewares/checkOrphanage.js");

router
  .route("/")
  .post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanageController.createOrphanage) // Only Orphanage Admin can create orphanage
  .get(orphanageController.getAllOrphanages); // Public

router
  .route("/:id")
  .get(orphanageController.getOrphanageById)
  .patch(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanageController.updateOrphanage) // Only Orphanage Admin
  .delete(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanageController.deleteOrphanage); // Only Orphanage Admin

router
  .route("/:id/approve")
  .patch(verifyToken, allowedTo(userRoles.ADMIN), orphanageController.approveOrphanage) // Only App Admin can approve
router
  .route("/:id/reject") 
  .patch(verifyToken, allowedTo(userRoles.ADMIN), orphanageController.rejectOrphanage); // Only App Admin can reject

module.exports = router;
