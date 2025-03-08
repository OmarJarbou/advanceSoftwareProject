// const express = require("express");
// const router = express.Router();
// const orphanController = require("../controllers/orphans.controller");
// const verifyToken = require("../middlewares/verifyToken");
// const allowedTo = require("../middlewares/allowedTo");
// const userRoles = require("../utilities/userRoles");

// // CRUD operations for orphans
// router
//   .route("/")
//   .get(orphanController.getAllOrphans) // Get all orphans
//   .post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.createOrphan); // Add new orphan

// router
//   .route("/:id")
//   .get(orphanController.getOrphanById) // Get a single orphan by ID
//   .patch(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.updateOrphan) // Update orphan details
//   .delete(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), orphanController.deleteOrphan); // Delete orphan

// module.exports = router;