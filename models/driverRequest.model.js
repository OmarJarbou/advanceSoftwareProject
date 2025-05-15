const mongoose = require('mongoose');

const driverRequestSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
  skills: { type: String }, 
  age: { type: Number },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DriverRequest", driverRequestSchema);
