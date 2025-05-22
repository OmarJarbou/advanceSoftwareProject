const Donation = require("../models/donation.model.js");
const ControllingDonation = require("../models/controllingDonation.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");

// 1. جلب كل سجلات التحكم المرتبطة بتبرعات الدونور
const getDonorControlRecords = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;

  const donations = await Donation.find({ donor: donorId }).select("_id");
  if (!donations || donations.length === 0) {
    return next(appError.create("No donations found for this donor", 404, httpStatusText.FAIL));
  }

  const donationIds = donations.map(d => d._id);

  const controlRecords = await ControllingDonation.find({ donation: { $in: donationIds } })
    // .populate("donation")
    .populate("orphanage", "name location")
    .populate("controlledBy", "name email")
    .populate("orphansImpacted", "name age");

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: controlRecords.length,
    data: { controlRecords }
  });
});

// 2. جلب سجل تحكم معين للدونور بالمعرف
const getDonorControlRecordsById = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;
  const { id } = req.params;

  const record = await ControllingDonation.findById(id)
    // .populate("donation")
    .populate("orphanage", "name location")
    .populate("controlledBy", "name email")
    .populate("orphansImpacted", "name age");

  if (!record) {
    return next(appError.create("Control donation record not found", 404, httpStatusText.FAIL));
  }

  

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { record }
  });
});

const getDonorSummary = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;

  // جلب كل التبرعات للدونور
  const donations = await Donation.find({ donor: donorId });
  if (!donations || donations.length === 0) {
    return next(appError.create("No donations found for this donor", 404, httpStatusText.FAIL));
  }

  // استخراج الـ IDs وأنواع التبرعات
  const donationIds = donations.map(d => d._id);
  const donationTypes = {};
  donations.forEach(donation => {
    donationTypes[donation._id.toString()] = donation.donationType;
  });

  // جلب سجلات التحكم المرتبطة بهذه التبرعات
  const controlRecords = await ControllingDonation.find({ donation: { $in: donationIds } }).select("donation");

  // عد سجلات التحكم لكل نوع تبرع
  const controlCountByType = {};
  controlRecords.forEach(record => {
    const donationType = donationTypes[record.donation.toString()];
    if (donationType) {
      controlCountByType[donationType] = (controlCountByType[donationType] || 0) + 1;
    }
  });

  // عد التبرعات لكل نوع
  const donationCountByType = donations.reduce((acc, donation) => {
    acc[donation.donationType] = (acc[donation.donationType] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      donationCountByType,
      controlCountByType
    }
  });
});


module.exports = {
  getDonorControlRecords,
  getDonorControlRecordsById,
  getDonorSummary,
};
