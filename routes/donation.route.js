const express = require("express");
const router = express.Router();

const donationController = require("../controllers/donation.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");

// creat donation educational support - financial
router.post( "/educational-support/financial",verifyToken,allowedTo( userRoles.DONOR),donationController.createDonationEducattionFinancial);

// creat donation general - financial
router.post( "/genaral-fund/financial",verifyToken,allowedTo( userRoles.DONOR),donationController.createDonationGeneralFinancial);
// Create donation for medical aid financial
router.post("/medical-aid/financial", verifyToken, allowedTo(userRoles.DONOR), donationController.createDonationMidicalFinancial);

// Create donation for educational support - books
router.post("/educational-support/books", verifyToken, allowedTo(userRoles.DONOR), donationController.createBooksDonation);

// Create donation for medical aid - material
router.post("/medical-aid/material", verifyToken, allowedTo(userRoles.DONOR), donationController.createMidicalMaterial);
// Create donation for educational - material
router.post("/educational-support/material", verifyToken, allowedTo(userRoles.DONOR), donationController.createEducationMaterial);

// creat donation general - food
router.post( "/genaral-fund/food",verifyToken,allowedTo( userRoles.DONOR),donationController.createGeneralFood);

// creat donation general - clothes
router.post( "/genaral-fund/clothes",verifyToken,allowedTo( userRoles.DONOR),donationController.createGeneralClothes);



// get donation 
router.get("/", verifyToken, allowedTo(userRoles.ADMIN), donationController.getAllDonations);

// get donation by id 
router.get("/orphanage/:orphanageid", verifyToken, allowedTo(userRoles.ADMIN), donationController.getDonationsByOrphanage);

// Get donations for the logged-in donor
router.get("/mine", verifyToken, allowedTo(userRoles.DONOR), donationController.getDonationDonor);

// Get a single donation by ID
router.get("/:id", verifyToken, allowedTo(userRoles.DONOR, userRoles.ADMIN), donationController.getDonationById);



router.get(
  "/admin/export-fees",
  verifyToken,
  allowedTo(userRoles.ADMIN),
  donationController.exportFeesReportExcel
);
router.get(
  "/admin/financial-summary",
  verifyToken,
  allowedTo(userRoles.ADMIN),
  donationController.getDonationFinanceSummary
);
module.exports = router;
