const SystemSettings = require("../models/systemSettings.model.js");
const appError = require('../utilities/appError.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');


const createDefaultSystemSettings = asyncWrapper(async (req, res, next) => {
  const existing = await SystemSettings.findOne();
  if (existing) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "SystemSettings already exists.",
      data: { settings: existing }
    });
  }

  const newSettings = await SystemSettings.create({ transactionFeePercent: 5 });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Default SystemSettings created.",
    data: { settings: newSettings }
  });
});

const updateOperationalFee = asyncWrapper(async (req, res, next) => {
  const { operationalFeePercentage } = req.body;

  if (operationalFeePercentage < 0 || operationalFeePercentage > 0.3) {
    return next(appError.create("Fee must be between 0 and 0.3", 400, httpStatusText.FAIL));
  }

  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({ operationalFeePercentage });
  } else {
    settings.operationalFeePercentage = operationalFeePercentage;
    await settings.save();
  }

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Operational fee updated successfully",
    data: { operationalFeePercentage: settings.operationalFeePercentage }
  });
});

const getSettings = asyncWrapper(async (req, res) => {
  const settings = await SystemSettings.findOne();
  res.json({
    status: httpStatusText.SUCCESS,
    data: settings || { operationalFeePercentage: 0.05 }
  });
});

module.exports = { 
    createDefaultSystemSettings,
    updateOperationalFee,
     getSettings };
