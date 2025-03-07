const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { 
      type: String, 
      enum: ["General Fund", "Education Support", "Medical Aid", "Emergency Relief"], 
      required: true 
    },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
    createdAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model("Donation", DonationSchema);  