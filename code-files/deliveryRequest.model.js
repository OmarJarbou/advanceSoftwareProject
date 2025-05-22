const mongoose = require("mongoose");

const deliveryRequestSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  donation: {type: mongoose.Schema.Types.ObjectId, ref: "Donation", required: true},
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage" },
  status: {
    type: String,
    enum: ["PENDING", "CLAIMED", "IN_TRANSIT", "DELIVERED", "CANCELED"],
    default: "PENDING"
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  destination: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now }
});

// Create a 2dsphere index for geospatial queries
// This allows us to perform geospatial queries on the location and destination fields
// The 2dsphere index is used for queries that involve spherical geometry
deliveryRequestSchema.index({ location: "2dsphere" });
deliveryRequestSchema.index({ destination: "2dsphere" });

module.exports = mongoose.model("DeliveryRequest", deliveryRequestSchema);