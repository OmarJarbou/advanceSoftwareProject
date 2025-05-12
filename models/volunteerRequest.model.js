const mongoose = require('mongoose');

const VolunteerRequestSchema = new mongoose.Schema({
    orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
    description: { type: String, required: true },
    requiredSkills: { type: String },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    createdAt: { type: Date, default: Date.now }
    
  });
  
module.exports = mongoose.model("VolunteerRequest", VolunteerRequestSchema);
  