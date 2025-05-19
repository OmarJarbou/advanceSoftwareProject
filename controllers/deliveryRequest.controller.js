const DeliveryRequest = require("../models/deliveryRequest.model");
const Donation = require("../models/donation.model");
const User = require("../models/user.model");
const Orphanage = require("../models/orphanage.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utilities/appError");
const httpStatusText = require("../utilities/httpStatusText");
const sendEmail = require("../utilities/sendEmail");
const mongoose = require("mongoose");
const userRoles = require("../utilities/userRoles");

// create new delivery request
const createDeliveryRequest = asyncWrapper(async (req, res, next) => {
  const donor = req.currentUser;
  const { donation, orphanage, location, destination } = req.body;

  if (!donation || !location ||  !destination) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donationExists = await Donation.findOne({ _id: donation });
  if (!donationExists) return next(appError.create("Donation not found", 404, httpStatusText.FAIL));
  if (donationExists.status !== "Pending") return next(appError.create("Donation must be Pending", 400, httpStatusText.FAIL));
  if (donationExists.donationType === "Financial") return next(appError.create("Only physical donations allowed", 400, httpStatusText.FAIL));

  if (orphanage) {
    const orphanageExists = await Orphanage.findById(orphanage);
    if (!orphanageExists) return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }

  if (
    !location.coordinates || 
    typeof location.coordinates[0] !== "number" || // latitude
    typeof location.coordinates[1] !== "number"    // longitude
  ) {
    return next(appError.create("your location must have valid coordinates", 400, httpStatusText.FAIL));
  }
  if (
    !destination.coordinates || 
    typeof destination.coordinates[0] !== "number" || // latitude
    typeof destination.coordinates[1] !== "number"    // longitude
  ) {
    return next(appError.create("destination location must have valid coordinates", 400, httpStatusText.FAIL));
  }

  // Step 1: Send Email First (don't save delivery yet)
  const availableDrivers = await User.find({ role: "DRIVER", driverStatus: "AVAILABLE" });

  if (!availableDrivers.length) {
    return next(appError.create("No available drivers at the moment", 400, httpStatusText.FAIL));
  }

  // Temporarily create a fake deliveryRequest to get the ID (not saved)
  const tempId = new mongoose.Types.ObjectId();

  const claimLink = `${process.env.FRONTEND_URL}/claim-delivery.html?deliveryId=${tempId}`;
  const html = `
    <h3>🚚 New Delivery Request</h3>
    <p>A donor has submitted a delivery request for physical donation pickup.</p>
    <p><strong>Pickup Location:</strong> [${location.coordinates.join(", ")}]</p>
    <p><a href="${claimLink}">Click here to claim the delivery</a></p>
  `;

  for (const driver of availableDrivers) {
    await sendEmail({
      to: driver.email,
      subject: "New Delivery Request Available",
      html
    });
  }

  // Step 2: Only now save the delivery request
  const deliveryRequest = await DeliveryRequest.create({
    _id: tempId,
    donor: donor.id,
    donation,
    orphanage,
    status: "PENDING",
    location,
    destination
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Delivery request created and drivers notified.",
    data: { deliveryId: deliveryRequest._id }
  });
});


// Claim delivery request
const claimDeliveryRequest = asyncWrapper(async (req, res, next) => {
  const driverId = req.currentUser.id;
  const { id } = req.params;

  const delivery = await DeliveryRequest.findById(id);
  if (!delivery) {
    return next(appError.create("Delivery request not found", 404, httpStatusText.FAIL));
  }

  if (delivery.status !== "PENDING") {
    return next(appError.create("Delivery request is no longer available", 400, httpStatusText.FAIL));
  }

  delivery.status = "CLAIMED";
  delivery.driver = driverId;
  await delivery.save();

  await User.findByIdAndUpdate(driverId, { driverStatus: "BUSY" });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Delivery successfully claimed",
    data: { delivery }
  });
});

// Update delivery status (CLAIMED → IN_TRANSIT → DELIVERED)
const updateDeliveryStatus = asyncWrapper(async (req, res, next) => {
  const driverId = req.currentUser.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["IN_TRANSIT", "DELIVERED", "CANCELED"].includes(status)) {
    return next(appError.create("Invalid or missing status", 400, httpStatusText.FAIL));
  }

  const delivery = await DeliveryRequest.findById(id);
  if (!delivery) {
    return next(appError.create("Delivery request not found", 404, httpStatusText.FAIL));
  }

  if (!delivery.driver || delivery.driver.toString() !== driverId) {
    return next(appError.create("You are not assigned to this delivery", 403, httpStatusText.FAIL));
  }

  if (["DELIVERED", "CANCELED"].includes(delivery.status)) {
    return next(appError.create("This delivery is already completed or canceled", 400, httpStatusText.FAIL));
  }

  // Rules for allowed transitions
  if (status === "IN_TRANSIT" && delivery.status !== "CLAIMED") {
    return next(appError.create("Only claimed deliveries can be marked as in transit", 400, httpStatusText.FAIL));
  }
  if (status === "DELIVERED" && delivery.status !== "IN_TRANSIT") {
    return next(appError.create("Only in-transit deliveries can be marked as delivered", 400, httpStatusText.FAIL));
  }

  delivery.status = status;
  await delivery.save();

  // If final status, mark driver as available
  if (["DELIVERED", "CANCELED"].includes(status)) {
    await User.findByIdAndUpdate(driverId, { driverStatus: "AVAILABLE" });
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: `Delivery status updated to ${status}`,
    data: { delivery }
  });
});

// Get all delivery requests for current user (donor or driver)
const getMyDeliveryRequests = asyncWrapper(async (req, res) => {
  const userId = req.currentUser.id;
  const role = req.currentUser.role;
  console.log("User ID:", userId);
  console.log("User Role:", role);

  const query = role === "DONOR"
    ? { donor: userId }
    : role === "DRIVER"
    ? { driver: userId }
    : {};

  const deliveries = await DeliveryRequest.find(query)
    .populate("donation", "category donationType status books clothes food material")
    .populate("orphanage", "name contact location")
    .populate("driver", "firstName lastName email")
    .populate("donor", "firstName lastName email");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { deliveries }
  });
});

// Get single delivery request by ID
const getDeliveryRequestById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const delivery = await DeliveryRequest.findById(id)
    .populate("donation", "category donationType status books clothes food material")
    .populate("orphanage", "name contact location")
    .populate("driver", "firstName lastName email")
    .populate("donor", "firstName lastName email");

  if (!delivery) {
    return next(appError.create("Delivery request not found", 404, httpStatusText.FAIL));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { delivery }
  });
});

// Driver updates current location
const updateDriverLocation = asyncWrapper(async (req, res, next) => {
  const driverId = req.currentUser.id;
  const { latitude, longitude } = req.body;

  // of if its a number in string format
  if (!latitude || !longitude) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return next(appError.create("Coordinates must be numbers", 400, httpStatusText.FAIL));
  }

  const updated = await User.findByIdAndUpdate(
    driverId,
    {
      driverCurrentLocation: {
        type: "Point",
        coordinates: [latitude, longitude],
      },
    },
    { new: true }
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Location updated",
    data: { location: updated.driverCurrentLocation },
  });
});

// Get current driver location for a delivery
const getDriverLocation = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const delivery = await DeliveryRequest.findById(id).populate("driver");
  if (!delivery) {
    return next(appError.create("Delivery request not found", 404, httpStatusText.FAIL));
  }
  if (!delivery.driver) {
    return next(appError.create("No driver assigned yet", 400, httpStatusText.FAIL));
  }
  const location = delivery.driver.driverCurrentLocation;
  if (!location) {
    return next(appError.create("Driver location not found", 404, httpStatusText.FAIL));
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { driverLocation: location },
  });
}
);

// get all busy drivers locations
const getAllBusyDriversLocations = asyncWrapper(async (req, res, next) => {
  const busyDrivers = await User.find({ role: userRoles.DRIVER, driverStatus: "BUSY" });
  
  if (!busyDrivers.length) {
    return next(appError.create("No busy drivers found", 404, httpStatusText.FAIL));
  }

  const locations = busyDrivers.map(driver => ({
    id: driver._id,
    location: driver.driverCurrentLocation
  }));

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { locations }
  });
});

// driver route map link generator
const generateDriverRouteLink = asyncWrapper(async (req, res, next) => {
  const { deliveryId } = req.body;
  const driverId = req.currentUser.id;

  if (!deliveryId) {
    return next(appError.create("Missing delivery ID", 400, httpStatusText.FAIL));
  }

  const delivery = await DeliveryRequest.findById(new mongoose.Types.ObjectId(deliveryId));
  if (!delivery) {
    return next(appError.create("Delivery request not found", 404, httpStatusText.FAIL));
  }
  if (!delivery.driver) {
    return next(appError.create("No driver assigned yet", 400, httpStatusText.FAIL));
  }
  if(delivery.driver.toString() !== driverId.toString()) {
    return next(appError.create("You are not assigned to this delivery", 403, httpStatusText.FAIL));
  }
  const mapLink = `${process.env.FRONTEND_URL}/driver-route.html?deliveryId=${deliveryId}`;
  if (!mapLink) {
    return next(appError.create("Failed to generate map link", 500, httpStatusText.FAIL));
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Driver route link generated",
    data: { mapLink }
  });
});

module.exports = {
  createDeliveryRequest,
  claimDeliveryRequest,
  updateDeliveryStatus,
  getMyDeliveryRequests,
  getDeliveryRequestById,
  updateDriverLocation,
  getDriverLocation,
  getAllBusyDriversLocations,
  generateDriverRouteLink
};