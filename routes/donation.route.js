const express = require("express");
const router = express.Router();

const donationController = require("../controllers/donation.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// creat donation educational support - financial
router.post( "/educational-support/financial",verifyToken,allowedTo( userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN),donationController.createDonationEducattionFinancial);

// creat donation general - financial
router.post( "/genaral-fund/financial",verifyToken,allowedTo( userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN),donationController.createDonationGeneralFinancial);
// Create donation for medical aid financial
router.post("/medical-aid/financial", verifyToken, allowedTo(userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.createDonationMidicalFinancial);

// Create donation for educational support - books
router.post("/educational-support/books", verifyToken, allowedTo(userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.createBooksDonation);

// Create donation for medical aid - material
router.post("/medical-aid/material", verifyToken, allowedTo(userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.createMidicalMaterial);
// Create donation for educational - material
router.post("/educational-support/material", verifyToken, allowedTo(userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.createEducationMaterial);

// creat donation general - food
router.post( "/genaral-fund/food",verifyToken,allowedTo( userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN),donationController.createGeneralFood);

// creat donation general - clothes
router.post( "/genaral-fund/clothes",verifyToken,allowedTo( userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN),donationController.createGeneralClothes);


// get donation 
router.get("/", verifyToken, allowedTo(userRoles.ADMIN, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.getAllDonations);

// get donation by id 
router.get("/orphanage/:orphanageid", verifyToken, allowedTo(userRoles.ADMIN, userRoles.ORPHANAGE_ADMIN), donationController.getDonationsByOrphanage);//check

// Get donations for the logged-in donor
router.get("/mine", verifyToken, allowedTo(userRoles.DONOR, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.getDonationDonor);

// Get a single donation by ID
router.get("/:id", verifyToken, allowedTo(userRoles.DONOR, userRoles.ADMIN, userRoles.SUPPORT_PROGRAM_ADMIN), donationController.getDonationById);



module.exports = router;
