const mongoose = require("mongoose");

const VolunteerApplicationSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerRequest", required: true },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
  message: { type: String },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VolunteerApplication", VolunteerApplicationSchema);