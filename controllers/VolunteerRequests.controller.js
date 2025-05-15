const VolunteerRequest = require("../models/volunteerRequest.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const VolunteerApplication = require("../models/VolunteerApplication.model.js");

// Create a new volunteer request by ORPHANAGE ADMIN
const createVolunteerRequest = asyncWrapper(async (req, res, next) => {
  const { description, requiredSkills, requiredServiceType, maxVolunteers } = req.body;
  const adminId = req.currentUser.id;

  const orphanage = await Orphanage.findOne({ admin: adminId, status: "APPROVED" });
  if (!orphanage) {
    return next(appError.create("You do not have an approved orphanage", 403, httpStatusText.FAIL));
  }

  const newRequest = await VolunteerRequest.create({
    orphanage: orphanage._id,
    description,
    requiredSkills,
    requiredServiceType,
    maxVolunteers: maxVolunteers || 5,
    acceptedCount: 0
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer request created successfully.",
    data: { request: newRequest }
  });
});

// View all requests (for VOLUNTEERS with optional filter)
const getAllVolunteerRequests = asyncWrapper(async (req, res, next) => {
  const { serviceType, limit = 4, page = 1 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { status: "Open" };
  if (serviceType) {
    filter.requiredServiceType = serviceType;
  }

  const requests = await VolunteerRequest.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .populate("orphanage", "name location");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { requests }
  });
});

// Get request by ID (any role)
const getVolunteerRequestById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const request = await VolunteerRequest.findById(id).populate("orphanage", "name location");

  if (!request) {
    return next(appError.create("Request not found", 404, httpStatusText.FAIL));
  }

  res.json({
    status: httpStatusText.SUCCESS,
    data: { request }
  });
});

// Admin: Get requests for specific orphanage
const getVolunteerRequestsByOrphanageId = asyncWrapper(async (req, res, next) => {
  const { orphanageId } = req.params;
  const { limit = 4, page = 1 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    orphanage: orphanageId,
    status: "Open"
  };

  if (req.query.serviceType) {
    filter.requiredServiceType = req.query.serviceType;
  }

  const requests = await VolunteerRequest.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .populate("orphanage", "name location");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { requests }
  });
});

// Update request (admin only)
const updateVolunteerRequest = asyncWrapper(async (req, res, next) => {
const { id } = req.params;
  const updates = req.body;

  const request = await VolunteerRequest.findById(id);
  if (!request) {
    return next(appError.create("Volunteer request not found", 404, httpStatusText.FAIL));
  }

  // تحديث الحقول المدخلة
  Object.assign(request, updates);

  // تحقق من تغيير العدد الأقصى للمقبولين
  if (updates.maxVolunteers !== undefined) {
    const acceptedCount = request.acceptedCount || 0;

    if (acceptedCount < updates.maxVolunteers && request.status === "Closed") {
      request.status = "Open";
    }

    if (acceptedCount >= updates.maxVolunteers) {
      request.status = "Closed";
    }
  }

  await request.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer request updated successfully.",
    data: { request }
  });
});

// Delete request (admin only)
const deleteVolunteerRequest = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  // تحقق من وجود الطلب أولًا
  const request = await VolunteerRequest.findById(id);
  if (!request) {
    return next(appError.create("Volunteer request not found", 404, httpStatusText.FAIL));
  }

  // حذف كل التطبيقات المرتبطة بهذا الطلب
  await VolunteerApplication.deleteMany({ volunteerRequest: request._id });

  // حذف الطلب نفسه
  await VolunteerRequest.findByIdAndDelete(id);

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Volunteer request and related applications deleted successfully."
  });

});
const getMyVolunteerRequests = asyncWrapper(async (req, res, next) => {
  const adminId = req.currentUser.id;

  const orphanage = await Orphanage.findOne({ admin: adminId });
  if (!orphanage) {
    return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }

  const filter = { orphanage: orphanage._id };

  // Optional: allow filtering by status (e.g., Open or Closed)
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const requests = await VolunteerRequest.find(filter)
    .populate("orphanage", "name");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { requests }
  });
});
const getOrphanageDashboardSummary = asyncWrapper(async (req, res, next) => {
  const adminId = req.currentUser.id;
  const orphanage = await Orphanage.findOne({ admin: adminId });

  if (!orphanage) {
    return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }

  const orphanageId = orphanage._id;

  // إجمالي الطلبات
  const totalRequests = await VolunteerRequest.countDocuments({ orphanage: orphanageId });

  // الطلبات المفتوحة والمغلقة
  const openRequests = await VolunteerRequest.countDocuments({ orphanage: orphanageId, status: "Open" });
  const closedRequests = await VolunteerRequest.countDocuments({ orphanage: orphanageId, status: "Closed" });

  // جميع التطبيقات
  const totalApplications = await VolunteerApplication.countDocuments({ orphanage: orphanageId });

  const acceptedApplications = await VolunteerApplication.countDocuments({
    orphanage: orphanageId,
    status: "Accepted"
  });

  const rejectedApplications = await VolunteerApplication.countDocuments({
    orphanage: orphanageId,
    status: "Rejected"
  });

  const pendingApplications = await VolunteerApplication.countDocuments({
    orphanage: orphanageId,
    status: "Pending"
  });

  // توزيع حسب نوع الخدمة
  const serviceTypes = ["Teaching", "Mentoring", "Healthcare", "Other"];
  const requestDistributionByType = {};
  const acceptedVolunteersByType = {};

  for (const type of serviceTypes) {
    const requestCount = await VolunteerRequest.countDocuments({
      orphanage: orphanageId,
      requiredServiceType: type
    });

    const acceptedCount = await VolunteerApplication.countDocuments({
      orphanage: orphanageId,
      status: "Accepted",
      serviceType: type
    });

    requestDistributionByType[type] = requestCount;
    acceptedVolunteersByType[type] = acceptedCount;
  }

  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      totalRequests,
      openRequests,
      closedRequests,
      totalApplications,
      acceptedApplications,
      rejectedApplications,
      pendingApplications,
      requestDistributionByType,
      acceptedVolunteersByType
    }
  });
});


module.exports = {
  createVolunteerRequest,
  getAllVolunteerRequests,
  getVolunteerRequestById,
  updateVolunteerRequest,
  deleteVolunteerRequest,
  getMyVolunteerRequests,
  getOrphanageDashboardSummary
};
