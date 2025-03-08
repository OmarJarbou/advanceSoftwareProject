const mongoose = require("mongoose");

const OrphanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["Male", "Female"], required: true },
  educationStatus: { type: String },
  healthCondition: { type: String },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true }, // Reference to orphanage
  orphanageAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Assigned orphanage admin
  sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of sponsors
  photos: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Ensure that orphanageAdmin is actually the admin of the orphanage
OrphanSchema.pre("save", async function (next) {
  const Orphanage = mongoose.model("Orphanage");
  const orphanage = await Orphanage.findById(this.orphanage);

  if (!orphanage) {
    return next(new Error("Invalid orphanage ID"));
  }

  if (!orphanage.admin.equals(this.orphanageAdmin)) {
    return next(new Error("Orphanage Admin mismatch"));
  }

  next();
});

module.exports = mongoose.model("Orphan", OrphanSchema);


// const mongoose = require('mongoose');

// const OrphanSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     age: { type: Number, required: true },
//     gender: { type: String, enum: ["Male", "Female"], required: true },
//     educationStatus: { type: String },
//     healthCondition: { type: String },
//     orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: true },
//     sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     photos: [{ type: String }],
//     createdAt: { type: Date, default: Date.now }
//   });
  
// module.exports = mongoose.model("Orphan", OrphanSchema);  