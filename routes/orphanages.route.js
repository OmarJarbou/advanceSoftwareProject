const express = require("express");
const router = express.Router();
const orphanageController = require("../controllers/orphanages.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

router
  .route("/")
  .post(verifyToken, allowedTo(userRoles.ADMIN), orphanageController.createOrphanage) // Only App Admin can create orphanage
  .get(orphanageController.getAllOrphanages); // Public

router
  .route("/:id")
  .get(orphanageController.getOrphanageById);
//   .patch(verifyToken, allowedTo(userRoles.ADMIN), orphanageController.updateOrphanage) // Only App Admin
//   .delete(verifyToken, allowedTo(userRoles.ADMIN), orphanageController.deleteOrphanage); // Only App Admin

module.exports = router;
