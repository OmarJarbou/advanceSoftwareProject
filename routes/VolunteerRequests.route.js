const express = require("express");
const router = express.Router();
const controller = require("../controllers/VolunteerRequests.controller.js");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utilities/userRoles");

// Create volunteer request (ORPHANAGE ADMIN only)
router
.route("/")
.get(controller.getAllVolunteerRequests)
.post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), controller.createVolunteerRequest);

// Get specific request by ID
router
.route("/:id")
.get(controller.getVolunteerRequestById)
.delete(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), controller.deleteVolunteerRequest)
  .patch(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN), controller.updateVolunteerRequest);

module.exports = router;