const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryRequest.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// DONOR: Create new delivery request
router.post(
  "/",
  verifyToken,
  allowedTo(userRoles.DONOR),
  deliveryController.createDeliveryRequest
);

// DRIVER: Claim delivery request
router.post(
  "/claim/:id",
  verifyToken,
  allowedTo(userRoles.DRIVER),
  deliveryController.claimDeliveryRequest
);

// driver route map link generator
router.post(
  "/driver-route",
  verifyToken,
  allowedTo(userRoles.DRIVER),
  deliveryController.generateDriverRouteLink
);

// DRIVER: Update delivery status (CLAIMED → IN_TRANSIT → DELIVERED)
router.patch(
  "/:id/status",
  verifyToken,
  allowedTo(userRoles.DRIVER),
  deliveryController.updateDeliveryStatus
);

// Get all delivery requests for current user (donor or driver)
router.get(
  "/my",
  verifyToken,
  allowedTo(userRoles.DONOR, userRoles.DRIVER),
  deliveryController.getMyDeliveryRequests
);

// Get delivery request by ID
router.get(
  "/:id",
  verifyToken,
  deliveryController.getDeliveryRequestById
);
// *************

// Driver updates current location
router.put(
  "/drivers/location",
  verifyToken,
  allowedTo(userRoles.DRIVER),
  deliveryController.updateDriverLocation
);
// *************

// Get current driver location for a delivery
router.get(
  "/:id/track",
  verifyToken,
  deliveryController.getDriverLocation
);

// Get all busy drivers locations
router.get(
  "/drivers/busy/locations",
  verifyToken,
  deliveryController.getAllBusyDriversLocations
);

module.exports = router;
