const express = require("express");
const router = express.Router();
const orphanController = require("../controllers/orphans.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// CRUD operations for orphans
router
  .route("/")
  //.get(orphanController.getAllOrphans) // Get all orphans
  .post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.createOrphan); // Add new orphan
  //.get(orphanController.getAllOrphans)

 


// router
//   .route("/:id")
//   .get(orphanController.getOrphanById) // Get a single orphan by ID
//   .patch(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.updateOrphan) // Update orphan details
//   .delete(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.deleteOrphan); // Delete orphan

module.exports = router;