const mongoose = require('mongoose');

const EmergencyCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
  status: { type: String, enum: ["Active", "Completed", "Expired"], default: "Active" },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmergencyCampaign", EmergencyCampaignSchema);
