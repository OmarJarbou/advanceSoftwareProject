const mongoose = require("mongoose");

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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Orphanage", OrphanageSchema);


// const mongoose = require('mongoose');

// const OrphanageSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     location: { type: String, required: true },
//     description: { type: String },
//     contactInfo: { type: String },
//     verified: { type: Boolean, default: false },
//     orphans: [{ type: mongoose.Schema.Types.ObjectId, ref: "Orphan" }],
//     createdAt: { type: Date, default: Date.now }
//   });
  
// module.exports = mongoose.model("Orphanage", OrphanageSchema);  