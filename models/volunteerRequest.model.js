const mongoose = require('mongoose');

const VolunteerRequestSchema = new mongoose.Schema({
    orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
    description: { type: String, required: true },
    requiredSkills: { type: String },
    requiredServiceType: {
    type: String,
    enum: ["Teaching", "Mentoring", "Healthcare", "Other"],
    required: true
  },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
      applicationCount: { type: Number, default: 0 }, 
      maxVolunteers: { type: Number, default: 5 },
        acceptedCount: { type: Number, default: 0 },   

    createdAt: { type: Date, default: Date.now }
    
  });
  
// module.exports = mongoose.model("VolunteerRequest", VolunteerRequestSchema);
  module.exports = mongoose.models.VolunteerRequest || mongoose.model("VolunteerRequest", VolunteerRequestSchema);
