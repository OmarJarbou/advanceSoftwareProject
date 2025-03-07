const mongoose = require('mongoose');

const OrphanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    educationStatus: { type: String },
    healthCondition: { type: String },
    orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
    sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    photos: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model("Orphan", OrphanSchema);  