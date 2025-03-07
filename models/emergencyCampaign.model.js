const mongoose = require('mongoose');

const EmergencyCampaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    goalAmount: { type: Number, required: true },
    collectedAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    createdAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model("EmergencyCampaign", EmergencyCampaignSchema);
  