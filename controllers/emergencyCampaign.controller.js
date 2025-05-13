const mongoose = require("mongoose");
const EmergencyCampaign = require("../models/emergencyCampaign.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Donation = require("../models/donation.model");
const Orphanage = require("../models/orphanage.model.js");
const userRoles = require("../utilities/userRoles.js");

const donateToCampaign = asyncWrapper(async (req, res, next) => {
    try {
        const { id: campaignId } = req.params;
        const { amount, orphanage } = req.body;
        const donor = req.currentUser.id;

        // 0. Validate orphanage
        const orphanageFound = await Orphanage.findById(orphanage);
        if (!orphanageFound) {
            return next(appError.create("Orphanage not found", 404, httpStatusText.ERROR));
        }

        // check if "orphanage" is the creator of this "campaign"
        // 1. Validate campaign
        const campaign = await EmergencyCampaign.findById(campaignId);
        if (!campaign || campaign.status !== "Active") {
            return next(appError.create("Invalid or inactive campaign" , 400, httpStatusText.FAIL));
        }
        else{
            if(orphanage !== campaign.orphanage.toString()){
                return next(appError.create("The entered orphanage is not the creator of this campaign." , 400, httpStatusText.FAIL));
            }
        }

        if (new Date(campaign.endDate) < new Date()) {
        return next(appError.create("Campaign has already ended.", 400, httpStatusText.FAIL));
        }
        // 2. Validate amount
        if (!amount || amount <= 0) {
                return next(appError.create("Invalid amount. Please enter a positive number", 400, httpStatusText.FAIL));
        }

        // 2. Create Donation (Pending)
        const donation = new Donation({
        donor,
        category: "Emergency Relief",
        donationType: "Financial",
        amount,
        transactionId: "TEMP",
        status: "Pending",
        campaign: campaignId
        });

        await donation.save();

        // 3. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                price_data: {
                    currency: "usd",
                    product_data: {
                    name: `Emergency Campaign Donation`,
                    },
                    unit_amount: amount * 100,
                },
                quantity: 1,
                },
            ],
            metadata: {
                donationId: donation._id.toString(),
            },
            success_url: `${process.env.DOMAIN}/success`,
            cancel_url: `${process.env.DOMAIN}/cancel`,
        });
        await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
        // Update transaction ID temporarily with Stripe session ID
        donation.transactionId = session.payment_intent || session.id;
        await donation.save();

        return res.status(201).json({
        message: "Donation initialized. Complete payment using the URL.",
        url: session.url,
        });
    } catch (error) {
        console.error("💥 Donation Error:", error);
        res.status(500).json({ message: "Failed to process donation." });
    }
    }
);

// make sure to keep traking the end date and the status (if reaches the end date without reaching target amount then change to expired) of the created campaign 
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

// Get all donations for a specific campaign
const getCampaignDonations = asyncWrapper(async (req, res, next) => {
  const { id: campaignId } = req.params;
  const user = req.currentUser;

  const campaign = await EmergencyCampaign.findById(campaignId);
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  // Check access permissions
  if (
    user.role !== userRoles.ADMIN &&
    (user.role !== userRoles.ORPHANAGE_ADMIN || user.orphanage !== campaign.orphanage.toString())
  ) {
    return next(appError.create("Unauthorized access or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

  const donations = await Donation.find({ campaign: campaignId, status: "Completed" })
    .select("_id donor category donationType amount status createdAt")
    .populate("donor", "name email");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { donations }
  });
});

// Get campaign summary (for admin and orphanage admin)
const getCampaignSummary = asyncWrapper(async (req, res, next) => {
  const campaignId = req.params.id;

  const campaign = await EmergencyCampaign.findById(campaignId).populate("orphanage");
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  // Authorization (admin or owning orphanage)
  const user = req.currentUser;
  const isAdmin = user.role === userRoles.ADMIN;
  const isOrphanageAdmin = user.role === userRoles.ORPHANAGE_ADMIN && user.orphanage?.toString() === campaign.orphanage.toString();

  if (!isAdmin && !isOrphanageAdmin) {
    return next(appError.create("Not authorized to view this campaign summary or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

  // Get all donations for this campaign
  const donations = await Donation.find({ campaign: campaignId, status: "Completed" });

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const donorIds = new Set(donations.map(d => d.donor.toString()));
  const donorCount = donorIds.size;
  const progressPercent = (campaign.currentAmount / campaign.targetAmount) * 100;

  const today = new Date();
  const endDate = new Date(campaign.endDate);
  const timeDiff = Math.max(endDate - today, 0);
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      campaign: {
        title: campaign.title,
        targetAmount: campaign.targetAmount,
        currentAmount: campaign.currentAmount,
        status: campaign.status,
        endDate: campaign.endDate
      },
      totalDonations,
      donorCount,
      progressPercent: Math.round(progressPercent),
      daysRemaining
    }
  });
});

module.exports = {
  donateToCampaign,
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignDonations,
  getCampaignSummary
};