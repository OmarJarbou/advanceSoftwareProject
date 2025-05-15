const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/emergencyCampaign.controller");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");
const checkOrphanage = require("../middlewares/checkOrphanage.js");

// Basic routes
router
    .route("/")
    .post(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN), campaignController.createCampaign)
    .get(campaignController.getCampaigns);

router
    .route("/:id")
    .get(campaignController.getCampaignById)
    .put(
        verifyToken,
        allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN),
        campaignController.updateCampaign
    )
    .delete(
        verifyToken,
        allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN),
        campaignController.deleteCampaign
    );

router
    .route("/:id/donate")
    .post(verifyToken, allowedTo(userRoles.DONOR), campaignController.donateToCampaign);

router
  .route("/:id/donations")
  .get(verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN), campaignController.getCampaignDonations);

router.get("/:id/summary", verifyToken, allowedTo(userRoles.ORPHANAGE_ADMIN, userRoles.ADMIN), campaignController.getCampaignSummary);

module.exports = router;