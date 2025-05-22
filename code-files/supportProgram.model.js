// models/supportProgram.model.js
const mongoose = require("mongoose");

const supportProgramSchema = new mongoose.Schema({
name: { type: String, required: true },
description: { type: String },
orphanage: { type: mongoose.Schema.Types.ObjectId, ref: "Orphanage", required: false }, // optional
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SupportProgram", supportProgramSchema);