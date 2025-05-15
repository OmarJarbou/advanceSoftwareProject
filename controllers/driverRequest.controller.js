const DriverRequest = require("../models/driverRequest.model.js");
const Orphanage = require("../models/orphanage.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");

// تقديم طلب سائق
const createDriverRequest = asyncWrapper(async (req, res, next) => {
  const { orphanageId, skills, age } = req.body;
  const driver = req.currentUser.id;

  // تحقق من وجود orphanageId
  if (!orphanageId) {
    return next(appError.create("Orphanage ID is required", 400, httpStatusText.FAIL));
  }

  // تحقق من وجود skills
  if (!skills || skills.trim() === "") {
    return next(appError.create("Skills are required", 400, httpStatusText.FAIL));
  }

  // تحقق من وجود age وأنه رقم صحيح وأكبر من 18
  if (!age || typeof age !== "number" || age < 18) {
    return next(appError.create("Age must be a number and at least 18", 400, httpStatusText.FAIL));
  }

  // تحقق إذا السائق قدم طلب لنفس الدار مسبقاً
  const existingRequest = await DriverRequest.findOne({ driver, orphanage: orphanageId });
  if (existingRequest) {
    return next(appError.create("You have already applied for this orphanage", 400, httpStatusText.FAIL));
  }

  // تحقق وجود ال orphanage
  const orphanage = await Orphanage.findById(orphanageId);
  if (!orphanage) {
    return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }

  const newRequest = await DriverRequest.create({
    driver,
    orphanage: orphanageId,
    skills,
    age,
    status: "Pending"
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Driver request submitted successfully",
    data: { request: newRequest }
  });
});


// عرض كل طلبات السائقين لدار معينة (لـ Orphanage Admin فقط)
const getDriverRequestsForOrphanage = asyncWrapper(async (req, res, next) => {
  const { orphanageId } = req.params;

  const requests = await DriverRequest.find({ orphanage: orphanageId })
    .populate("driver", "firstName lastName email phone");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { requests }
  });
});

// تحديث حالة الطلب (موافقة أو رفض) - فقط لـ Orphanage Admin
const updateDriverRequestStatus = asyncWrapper(async (req, res, next) => {
  const { requestId } = req.params;
  const { status } = req.body;

  if (!["Accepted", "Rejected"].includes(status)) {
    return next(appError.create("Invalid status value", 400, httpStatusText.FAIL));
  }

  const request = await DriverRequest.findById(requestId);
  if (!request) {
    return next(appError.create("Request not found", 404, httpStatusText.FAIL));
  }

  request.status = status;
  await request.save();

  res.json({
    status: httpStatusText.SUCCESS,
    message: `Driver request ${status.toLowerCase()} successfully`,
    data: { request }
  });
});

module.exports = {
  createDriverRequest,
  getDriverRequestsForOrphanage,
  updateDriverRequestStatus
};
