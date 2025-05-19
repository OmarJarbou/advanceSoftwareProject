const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  transactionFeePercent: {
    type: Number,
    required: true,
    default: 5
  }
});
module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
