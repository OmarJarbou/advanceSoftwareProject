const express = require("express");
const router = express.Router();
const orphanController = require("../controllers/orphans.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");
const checkOrphanage = require("../middlewares/checkOrphanage.js");
// CRUD operations for orphans
router
  .route("/")
  .get(orphanController.getAllOrphans) // Get all orphans
  .post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanController.createOrphan); // Add new orphan

router
  .route("/:orphanid")
  .get(orphanController.getOrphanById) // Get a single orphan by ID
  .patch(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanController.updateOrphan) // Update orphan details
  .delete(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanController.deleteOrphan); // Delete orphan

router
  .route("/all_orphans_of_current_orphanage/:id")
  .get(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanController.getAllOrphansOfOrphanage) // Get all orphans for orphanage of current orphanage admin


router
  .route("/:orphanageid/:id")
  .get(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), checkOrphanage, orphanController.getOrphanByIdInOrphanage) // Get orphan by id in orphanage of current orphanage admin

module.exports = router;