const express = require("express");
const router = express.Router();

const donationController = require("../controllers/donation.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// creat donation educational support - financial
router.post( "/educational-support/financial",verifyToken,allowedTo( userRoles.DONOR),donationController.createDonationEducattionFinancial);
// Create donation for educational support - books
router.post("/educational-support/books", verifyToken, allowedTo(userRoles.DONOR), donationController.createBooksDonation);


// get donation 
router.get("/", verifyToken, allowedTo(userRoles.ADMIN), donationController.getAllDonations);

// get donation by id 
router.get("/orphanage/:orphanageid", verifyToken, allowedTo(userRoles.ADMIN), donationController.getDonationsByOrphanage);

// Get donations for the logged-in donor
router.get("/mine", verifyToken, allowedTo(userRoles.DONOR), donationController.getDonationDonor);

// Get a single donation by ID
router.get("/:id", verifyToken, allowedTo(userRoles.DONOR, userRoles.ADMIN), donationController.getDonationById);

module.exports = router;
