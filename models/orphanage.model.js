const mongoose = require("mongoose");
const requestStatus = require("../utilities/requestStatus");

const OrphanageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  contact: { 
    phone: { type: String },
    email: { type: String } 
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Orphanage Admin
  orphans: [{ type: mongoose.Schema.Types.ObjectId, ref: "Orphan" }], // List of orphans in this orphanage
  status: { type: String, enum: [requestStatus.PENDING, requestStatus.APPROVED, requestStatus.REJECTED], default: "pending" }, // Approval status
  verified: { type: Boolean, default: false }, // Will be updated by the App Admin
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Donation" }], // List of donations for this orphanage (optional)
  supportPrograms: [{ type: mongoose.Schema.Types.ObjectId, ref: "SupportProgram" }], // حقل البرامج
  createdAt: { type: Date, default: Date.now }
  
});

module.exports = mongoose.model("Orphanage", OrphanageSchema);