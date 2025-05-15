require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const cron = require("node-cron");
const EmergencyCampaign = require("../models/emergencyCampaign.model");

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected for campaign job"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

cron.schedule("0 * * * *", async () => { // Runs every hour
  console.log("⏰ Checking for expired campaigns...");

  try {
    const now = new Date();
    const expiredCampaigns = await EmergencyCampaign.find({
      endDate: { $lt: now },
      status: "Active",
      $expr: { $lt: ["$raisedAmount", "$targetAmount"] }
    });

    for (const campaign of expiredCampaigns) {
      campaign.status = "Expired";
      await campaign.save();
      console.log(`⚠️ Campaign "${campaign.title}" marked as expired.`);
    }

    if (expiredCampaigns.length === 0) {
      console.log("✅ No expired campaigns found.");
    }

  } catch (err) {
    console.error("❌ Error checking campaign expirations:", err);
  }
});
