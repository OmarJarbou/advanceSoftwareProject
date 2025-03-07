const mongoose = require('mongoose');

const SponsorshipSchema = new mongoose.Schema({
    sponsor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orphan: { type: mongoose.Schema.Types.ObjectId, ref: "Orphan", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    createdAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model("Sponsorship", SponsorshipSchema);  