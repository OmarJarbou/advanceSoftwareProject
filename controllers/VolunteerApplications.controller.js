const asyncWrapper = require('../middlewares/asyncWrapper.js');
const VolunteerApplication = require('../models/VolunteerApplication.model.js');
const VolunteerRequest = require('../models/VolunteerRequest.model.js');
const Orphanage = require('../models/orphanage.model.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const appError = require('../utilities/appError.js');

// const applyToVolunteerRequest = asyncWrapper(async (req, res, next) => {
//     const { requestId } = req.params;
//     const volunteerId = req.currentUser.id;
//     const { message } = req.body;

//     const request = await VolunteerRequest.findById(requestId).populate("orphanage");
//     if (!request) return next(appError.create("Request not found", 404, httpStatusText.FAIL));

//     const alreadyApplied = await VolunteerApplication.findOne({ volunteer: volunteerId, request: requestId });
//     if (alreadyApplied) return next(appError.create("Already applied", 400, httpStatusText.FAIL));

//     const application = new VolunteerApplication({
//         volunteer: volunteerId,
//         request: requestId,
//         orphanage: request.orphanage._id,
//         message
//     });

//     await application.save();
//     request.applicationCount += 1;
//     await request.save();

//     res.status(201).json({
//         status: httpStatusText.SUCCESS,
//         message: "Application submitted successfully",
//         data: { application }
//     });
// });
const applyToVolunteerRequest = asyncWrapper(async (req, res, next) => {
    const requestId = req.params.requestId;
    const volunteerId = req.currentUser.id;
    const { message } = req.body;

    const request = await VolunteerRequest.findById(requestId).populate("orphanage");
    if (!request) return next(appError.create("Volunteer request not found", 404, httpStatusText.FAIL));

    const existingApplication = await VolunteerApplication.findOne({ volunteer: volunteerId, request: requestId });
    if (existingApplication) return next(appError.create("You have already applied to this request", 400, httpStatusText.FAIL));

    const newApplication = new VolunteerApplication({
        volunteer: volunteerId,
        request: requestId,
        orphanage: request.orphanage._id,
        message
    });

    await newApplication.save();

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: "Application submitted successfully",
        data: { application: newApplication }
    });
});

const getMyApplications = asyncWrapper(async (req, res, next) => {
    const volunteerId = req.currentUser.id;

    const applications = await VolunteerApplication.find({ volunteer: volunteerId })
        .populate("request", "description requiredSkills")
        .populate("orphanage", "name location");

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { applications }
    });
});
// ⬅️ عرض تقديم معين للمتطوع
const getApplicationById = asyncWrapper(async (req, res, next) => {
    const volunteerId = req.currentUser.id;
    const applicationId = req.params.applicationId;

    const application = await VolunteerApplication.findOne({
        _id: applicationId,
        volunteer: volunteerId
    })
        .populate("request", "description")
        .populate("orphanage", "name location");

    if (!application) {
        return next(appError.create("Application not found", 404, httpStatusText.FAIL));
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { application }
    });
});

// ⬅️ إلغاء تقديم
const cancelApplication = asyncWrapper(async (req, res, next) => {
    const volunteerId = req.currentUser.id;
    const applicationId = req.params.applicationId;

    const deleted = await VolunteerApplication.findOneAndDelete({
        _id: applicationId,
        volunteer: volunteerId
    });

    if (!deleted) {
        return next(appError.create("Application not found or not yours", 404, httpStatusText.FAIL));
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Application cancelled successfully"
    });
});
const getApplicationsForMyOrphanage = asyncWrapper(async (req, res, next) => {
    const adminId = req.currentUser.id;

    const orphanage = await Orphanage.findOne({ admin: adminId });
    if (!orphanage) {
        return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }

    const applications = await VolunteerApplication.find({ orphanage: orphanage._id })
        .populate("volunteer", "firstName lastName email")
        .populate("request", "description");

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { applications }
    });
});


module.exports = {
    applyToVolunteerRequest,
    getMyApplications,
    getApplicationById,
    getApplicationsForMyOrphanage,
    cancelApplication
    
};