const VolunteerApplication = require("../models/VolunteerApplication.model.js");
const VolunteerRequest = require("../models/VolunteerRequest.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");

// ✅ Volunteer applies to a request
const applyToVolunteerRequest = asyncWrapper(async (req, res, next) => {
  const { requestId } = req.params;
  const volunteerId = req.currentUser.id;
  const { serviceType, message } = req.body;

  if (!["Teaching", "Mentoring", "Healthcare", "Other"].includes(serviceType)) {
    return next(appError.create("Invalid service type", 400, httpStatusText.FAIL));
  }

  const request = await VolunteerRequest.findById(requestId).populate("orphanage");

  if (!request || request.status === "Closed" ) {
  return next(appError.create("Volunteer request is not available", 400, httpStatusText.FAIL));
}

  const existing = await VolunteerApplication.findOne({
    volunteer: volunteerId,
    volunteerRequest: requestId
  });

  if (existing) {
    return next(appError.create("You already applied to this request", 400, httpStatusText.FAIL));
  }

  const application = await VolunteerApplication.create({
    volunteer: volunteerId,
    volunteerRequest: request._id,
    orphanage: request.orphanage._id,
    serviceType,
    message
  });

  request.applicationCount += 1;

  if (request.applicationCount >= request.maxVolunteers) {
    request.status = "Closed";
  }

  await request.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Application submitted successfully.",
    data: { application }
  });
});

// ✅ Volunteer gets their applications
const getMyApplications = asyncWrapper(async (req, res, next) => {
  const volunteerId = req.currentUser.id;

  const applications = await VolunteerApplication.find({ volunteer: volunteerId })
    .populate("volunteerRequest", "description requiredServiceType status")
    .populate("orphanage", "name");

  // تعديل كل تطبيق حسب حالة الطلب المرتبط
  const modifiedApplications = applications.map(app => {
    const appObject = app.toObject();

    if (!app.volunteerRequest) {
      // تم حذف الطلب المرتبط
      appObject.volunteerRequest = {
        status: "Deleted",
        description: "This request was deleted by the orphanage admin.",
        requiredServiceType: "N/A"
      };
    }

    return appObject;
  });

  res.json({
    status: httpStatusText.SUCCESS,
    data: { applications: modifiedApplications }
  });
});

// ✅ Orphanage admin views applications
const getApplicationsForOrphanage = asyncWrapper(async (req, res, next) => {
  const adminId = req.currentUser.id;

  const orphanage = await Orphanage.findOne({ admin: adminId });
  if (!orphanage) {
    return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }
   const filter = { orphanage: orphanage._id };

  //  فلترة حسب نوع الخدمة إذا تم تحديدها
  if (req.query.serviceType) {
    filter.serviceType = req.query.serviceType;
  }

  const applications = await VolunteerApplication.find({ orphanage: orphanage._id })
    .populate("volunteer", "firstName lastName email phone")
    .populate("volunteerRequest", "description requiredServiceType");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { applications }
  });
});


// ✅ Approve application

const approveApplication = asyncWrapper(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await VolunteerApplication.findById(applicationId).populate("volunteerRequest");

  if (!application) {
    return next(appError.create("Application not found", 404, httpStatusText.FAIL));
  }

  if (application.status !== "Pending") {
    return next(appError.create("Application already processed", 400, httpStatusText.FAIL));
  }

  application.status = "Accepted";
  await application.save();

  // ✅ Increment acceptedCount
  const request = await VolunteerRequest.findById(application.volunteerRequest._id);
  request.acceptedCount = (request.acceptedCount || 0) + 1;

  if (request.acceptedCount >= request.maxVolunteers) {
    request.status = "Closed";
  }

  await request.save();

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Application approved.",
    data: { application }
  });
});

// ✅ Reject application
const rejectApplication = asyncWrapper(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await VolunteerApplication.findById(applicationId).populate("volunteerRequest");

  if (!application) {
    return next(appError.create("Application not found", 404, httpStatusText.FAIL));
  }

  if (application.status !== "Pending" && application.status !== "Accepted") {
    return next(appError.create("Application already processed", 400, httpStatusText.FAIL));
  }

  // Decrement acceptedCount if previously accepted
  if (application.status === "Accepted") {
    const request = await VolunteerRequest.findById(application.volunteerRequest._id);
    request.acceptedCount = Math.max(0, (request.acceptedCount || 0) - 1);
    if (request.status === "Closed" && request.acceptedCount < request.maxVolunteers) {
      request.status = "Open";
    }
    await request.save();
  }

  application.status = "Rejected";
  await application.save();

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Application rejected.",
    data: { application }
  });
});
// ✅ Get all approved orphanages (for volunteers)
const getAllApprovedOrphanages = asyncWrapper(async (req, res) => {
  const orphanages = await Orphanage.find({ status: "APPROVED", verified: true }, { __v: 0 });

  res.json({
    status: httpStatusText.SUCCESS,
    data: { orphanages }
  });
});

// ✅ Get all open volunteer requests
const getAllOpenRequests = asyncWrapper(async (req, res) => {
  const requests = await VolunteerRequest.find({ status: "Open" })
    .populate("orphanage", "name location")
    .select("-__v");

  res.json({
    status: httpStatusText.SUCCESS,
    data: { requests }
  });
});

// ✅ Get available service types
const getServiceTypes = asyncWrapper(async (req, res) => {
  const types = ["Teaching", "Mentoring", "Healthcare", "Other"];
  res.json({
    status: httpStatusText.SUCCESS,
    data: { serviceTypes: types }
  });
});
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
// const deleteVolunteerApplication = asyncWrapper(async (req, res, next) => {
//   const { applicationId } = req.params;
//   const currentUserId = req.currentUser.id;

//   const application = await VolunteerApplication.findById(applicationId).populate("volunteerRequest");

//   if (!application) {
//     return next(appError.create("Application not found", 404, httpStatusText.FAIL));
//   }

//   // السماح بالحذف فقط إذا كان المتطوع هو صاحب الطلب
//   if (application.volunteer.toString() !== currentUserId) {
//     return next(appError.create("Not authorized to delete this application", 403, httpStatusText.FAIL));
//   }

//   const request = application.volunteerRequest;

//   // إذا كان التطبيق مقبول، ننقص acceptedCount
//   if (application.status === "Accepted") {
//     request.acceptedCount = Math.max((request.acceptedCount || 1) - 1, 0);

//     if (request.status === "Closed" && request.acceptedCount < request.maxVolunteers) {
//       request.status = "Open";
//     }

//     await request.save();
//   }

//   await application.deleteOne();

//   res.json({
//     status: httpStatusText.SUCCESS,
//     message: "Application deleted successfully."
//   });
// });
const deleteVolunteerApplication = asyncWrapper(async (req, res, next) => {
  const { applicationId } = req.params;
  const currentUserId = req.currentUser.id;

  const application = await VolunteerApplication.findById(applicationId).populate("volunteerRequest");

  if (!application) {
    return next(appError.create("Application not found", 404, httpStatusText.FAIL));
  }

  if (!application.volunteer.equals(currentUserId)) {
    return next(appError.create("Not authorized to delete this application", 403, httpStatusText.FAIL));
  }

  const request = application.volunteerRequest;

  if (!request) {
    return next(appError.create("Related volunteer request not found", 404, httpStatusText.FAIL));
  }

  if (application.status === "Accepted") {
    request.acceptedCount = Math.max((request.acceptedCount || 0) - 1, 0);

    if (request.status === "Closed" && request.acceptedCount < request.maxVolunteers) {
      request.status = "Open";
    }

    await request.save();
  }

  await application.deleteOne();

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Application deleted successfully."
  });
});




module.exports = {
  applyToVolunteerRequest,
  getMyApplications,
  getApplicationsForOrphanage,
  approveApplication,
  rejectApplication,
  getAllApprovedOrphanages,
  getAllOpenRequests,
  getServiceTypes,
  getVolunteerRequestsByOrphanageId,
  deleteVolunteerApplication
};
