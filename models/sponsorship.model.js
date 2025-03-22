const mongoose = require("mongoose");
const sponsorshipStatus = require("../utilities/sponsorshipStatus.js");

const sponsorshipSchema = new mongoose.Schema(
  {
    sponsor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orphan: { type: mongoose.Schema.Types.ObjectId, ref: "Orphan", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["JOD", "ILS", "USD"] },
    frequency: { type: String, enum: ["month", "year", "week", "day"], required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: [sponsorshipStatus.PENDING, sponsorshipStatus.ACTIVE, sponsorshipStatus.COMPLETED, sponsorshipStatus.CANCELED],
      default: sponsorshipStatus.PENDING
    },
    subscriptionId: { type: String, required: true }, // ID from Stripe/PayPal subscription (for automatic payment)
    latestInvoiceId: { type: String }, // Track latest invoice
  },
  { timestamps: true }
);

sponsorshipSchema.index({ donor: 1, orphan: 1, startDate: 1 }); // Allows multiple sponsorships for an orphan by the same donor

module.exports = mongoose.model("Sponsorship", sponsorshipSchema);
 