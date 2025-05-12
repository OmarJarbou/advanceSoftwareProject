const EmergencyCampaign = require("../models/emergencyCampaign.model.js");
const Orphanage = require("../models/orphanage.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");

// Create a new campaign
const createCampaign = asyncWrapper(async (req, res, next) => {
  const { title, description, targetAmount, endDate, orphanage } = req.body;

  // Validate campaign
  if (!title || !description || !targetAmount || !endDate) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const campaign = await EmergencyCampaign.create({
    title,
    description,
    targetAmount,
    endDate,
    orphanage
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Emergency campaign created successfully",
    data: { campaign }
  });
});

// Get all campaigns (optionally filter by status)
const getCampaigns = asyncWrapper(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const campaigns = await EmergencyCampaign.find(filter).populate("orphanage");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { campaigns }
  });
});

// Get one campaign by ID
const getCampaignById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const campaign = await EmergencyCampaign.findById(id).populate("orphanage");
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { campaign }
  });
});

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById
};