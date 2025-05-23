// const mongoose = require('mongoose');

// const DonationSchema = new mongoose.Schema({
//     donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     category: { 
//       type: String, 
//       enum: ["General Fund", "Education Support", "Medical Aid", "Emergency Relief"], 
//       required: true 
//     },
//     amount: { type: Number, required: true },
//     transactionId: { type: String, required: true },
//     status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
//     orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: false },
//     createdAt: { type: Date, default: Date.now }
//   });
  
// module.exports = mongoose.model("Donation", DonationSchema);  
const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  fee: { type: Number, default: 0 },//نسبة الخصم
  netAmount: { type: Number,
    default: function () {
      return this.amount;
    }
  },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["General Fund", "Education Support", "Medical Aid", "Emergency Relief"],
    required: true
  },
  donationType: {
    type: String,
    enum: ["Books", "Clothes", "Food", "Financial", "Material"],
    required: true
  },
  amount: { type: Number, default: 0 },  // المبلغ (في حالة التبرعات المالية)
  transactionId: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Completed" , "On Arrive", "Controlled"], default: "Pending" },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: false },
  createdAt: { type: Date, default: Date.now },
  supportProgram: { type: mongoose.Schema.Types.ObjectId, ref: "SupportProgram"}, // إضافة هذا الحقل
  
  books: [{
    name: { type: String },
    quantity: { type: Number }
  }],
   clothes: [{
    type: { type: String },  // نوع الملابس (مثل T-shirt، jacket، إلخ)
    size: { type: String },  // الحجم (مثل S, M, L)
    quantity: { type: Number }  // الكمية
  }],
  food: [{
    type: { type: String },
    quantity: { type: Number }
  }],
  material: [{
    type: { type: String },
    quantity: { type: Number }
  }],
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyCampaign", default: null, required: false }

  
});

module.exports = mongoose.model("Donation", DonationSchema);
