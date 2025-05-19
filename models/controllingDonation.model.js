const mongoose = require("mongoose");

const ControllingDonationSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", required: true, unique: true },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage" },
  controlledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  controlDate: { type: Date, default: Date.now },

  usageSummary: { type: String, required: true },
  orphansImpacted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Orphan" }],
  photos: [{ type: String }],
  notes: { type: String },

 });

module.exports = mongoose.model("ControllingDonation", ControllingDonationSchema);
