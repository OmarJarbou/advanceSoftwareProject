const mongoose = require("mongoose");
const requestStatus = require("../utilities/requestStatus");

const sponsorshipSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orphan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orphan",
      required: true
    },
    orphanage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orphanage",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    frequency: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Completed", "Canceled"],
      default: "Pending"
    },
    paymentDetails: {
      transactionId: String,
      paymentMethod: String,
      paidAt: Date
    }
  },
  { timestamps: true }
);

// Ensure a donor can only sponsor an orphan once
sponsorshipSchema.index({ donor: 1, orphan: 1, startDate: 1 }); 

module.exports = mongoose.model("Sponsorship", sponsorshipSchema);
 