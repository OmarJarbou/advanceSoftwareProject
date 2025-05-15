const mongoose = require("mongoose");
const EmergencyCampaign = require("../models/emergencyCampaign.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Donation = require("../models/donation.model");
const Orphanage = require("../models/orphanage.model.js");
const userRoles = require("../utilities/userRoles.js");
const User = require("../models/user.model");
const sendEmail = require("../utilities/sendEmail");

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
  const user = req.currentUser;

  const orphanageDoc = await Orphanage.find({admin: new mongoose.Types.ObjectId(user.id)});
  if(user.role !== userRoles.ADMIN){
    if (!orphanageDoc[0]) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }
  }

  if (
    user.role !== userRoles.ADMIN &&
    (user.role !== userRoles.ORPHANAGE_ADMIN || orphanageDoc[0]._id.toString() !== orphanage)
  ) {
    return next(appError.create("Unauthorized action or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

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

  // after campaign is created
  const donors = await User.find({ role: "DONOR" });

  const html = `
    <h2>🚨 New Emergency Campaign Launched!</h2>
    <p><strong>${campaign.title}</strong></p>
    <p>${campaign.description}</p>
    <p>Target: $${campaign.targetAmount}</p>
    <p><a href="${process.env.FRONTEND_URL}/campaigns/${campaign._id}">View Campaign</a></p>
  `;

  for (const donor of donors) {
    await sendEmail({
      to: donor.email,
      subject: "🚨 New Emergency Campaign Needs Your Help",
      html,
    });
  }

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

  const campaigns = await EmergencyCampaign.find(filter).populate("orphanage", "name location contact");
  if (!campaigns || campaigns.length === 0) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "No campaigns found"
    });
  }
  // also find donations for each campaign
  const donations = await Donation.find({ campaign: campaigns.map(c => c._id) })
    .select("category donationType amount status createdAt campaign")
    .populate("donor", "name email");
  
  const donationsByCampaign = {};
  donations.forEach(donation => {
    if (!donationsByCampaign[donation.campaign]) {
      donationsByCampaign[donation.campaign] = [];
    }
    donationsByCampaign[donation.campaign].push(donation);
  });
  // now send each campaign with its donations (immediately in response)
  const campaignsWithDonations = campaigns.map(campaign => {
    return {
      ...campaign._doc,
      donations: donationsByCampaign[campaign._id] || []
    };
  });
  // send the campaigns with their donations
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { campaigns: campaignsWithDonations }
  });
});

// Get one campaign by ID
const getCampaignById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const campaign = await EmergencyCampaign.findById(id).populate("orphanage", "name location contact");
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }
  // also find donations for this campaign
  const donations = await Donation.find({ campaign: id })
    .select("category donationType amount status createdAt campaign")
    .populate("donor", "name email");
  const donationsByCampaign = {};
  donations.forEach(donation => {
    if (!donationsByCampaign[donation.campaign]) {
      donationsByCampaign[donation.campaign] = [];
    }
    donationsByCampaign[donation.campaign].push(donation);
  });
  // now send the campaign with its donations (immediately in response)
  const campaignWithDonations = {
    ...campaign._doc,
    donations: donationsByCampaign[campaign._id] || []
  };

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { campaignWithDonations }
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

  const orphanage = await Orphanage.find({admin: new mongoose.Types.ObjectId(user.id)});
  if(user.role !== userRoles.ADMIN){
    if (!orphanage[0]) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }
  }

  // Check access permissions
  if (
    user.role !== userRoles.ADMIN &&
    (user.role !== userRoles.ORPHANAGE_ADMIN || orphanage[0]._id.toString() !== campaign.orphanage.toString())
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
  const user = req.currentUser;

  const campaign = await EmergencyCampaign.findById(campaignId).populate("orphanage");
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  const orphanage = await Orphanage.find({admin: new mongoose.Types.ObjectId(user.id)});
  if(user.role !== userRoles.ADMIN){
    if (!orphanage[0]) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }
  }

  // Authorization (admin or owning orphanage)
  if (user.role !== userRoles.ADMIN &&
    (user.role !== userRoles.ORPHANAGE_ADMIN || orphanage[0]._id.toString() !== campaign.orphanage._id.toString())) {
    return next(appError.create("Not authorized to view this campaign summary or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

  // Get all donations for this campaign
  const donations = await Donation.find({ campaign: campaignId, status: "Completed" });

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const donorIds = new Set(donations.map(d => d.donor.toString()));
  console.log("🎯 Donor IDs:", donations.map(d => d.donor.toString()));
  const donorCount = donorIds.size;
  const progressPercent = (campaign.raisedAmount / campaign.targetAmount) * 100;

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

// Update a campaign (only for admin or the owning orphanage)
const updateCampaign = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, targetAmount, endDate } = req.body;
  const user = req.currentUser;

  const campaign = await EmergencyCampaign.findById(id);
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  const orphanage = await Orphanage.find({admin: new mongoose.Types.ObjectId(user.id)});
  if(user.role !== userRoles.ADMIN){
    if (!orphanage[0]) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }
  }

  // Only allow updates for active campaigns
  if (campaign.status !== "Active") {
    return next(appError.create("Only active campaigns can be updated", 400, httpStatusText.FAIL));
  }

  // Allow only admin or the owning orphanage
  if (
    user.role !== userRoles.ADMIN &&
    (!campaign.orphanage || campaign.orphanage.toString() !== orphanage[0]._id.toString())
  ) {
    return next(appError.create("Not authorized to update this campaign or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

  // Update allowed fields
  if (title) campaign.title = title;
  if (description) campaign.description = description;
  if (targetAmount) campaign.targetAmount = targetAmount;
  if (endDate) campaign.endDate = endDate;

  await campaign.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Campaign updated successfully",
    data: { campaign }
  });
});

// Delete a campaign (only for admin or the owning orphanage)
const deleteCampaign = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = req.currentUser;

  const campaign = await EmergencyCampaign.findById(id);
  if (!campaign) {
    return next(appError.create("Campaign not found", 404, httpStatusText.FAIL));
  }

  const orphanage = await Orphanage.find({admin: new mongoose.Types.ObjectId(user.id)});
  if(user.role !== userRoles.ADMIN){
    if (!orphanage[0]) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }
  }

  // Only allow deletion if status is still active
  if (campaign.status !== "Active") {
    return next(appError.create("Only active campaigns can be deleted", 400, httpStatusText.FAIL));
  }

  // Authorization: Only admin or campaign's orphanage
  if (
    user.role !== userRoles.ADMIN &&
    (!campaign.orphanage || campaign.orphanage.toString() !== orphanage[0]._id.toString())
  ) {
    return next(appError.create("Not authorized to delete this campaign or Orphanage Admin mismatch", 403, httpStatusText.FAIL));
  }

  await EmergencyCampaign.findByIdAndDelete(id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Campaign deleted successfully"
  });
});


module.exports = {
  donateToCampaign,
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignDonations,
  getCampaignSummary,
  updateCampaign,
  deleteCampaign
};