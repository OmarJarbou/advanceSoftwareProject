const VolunteerRequest = require("../models/volunteerRequest.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");

// Create a new volunteer request
const createVolunteerRequest = asyncWrapper(async (req, res, next) => {
    const { description, requiredSkills } = req.body;
    const adminId = req.currentUser.id;

    const orphanage = await Orphanage.findOne({ admin: adminId, status: "APPROVED" });
    if (!orphanage) {
        return next(appError.create("You do not have an approved orphanage", 403, httpStatusText.FAIL));
    }

    const newRequest = await VolunteerRequest.create({
        orphanage: orphanage._id,
        description,
        requiredSkills
    });

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: "Volunteer request created successfully.",
        data: { request: newRequest }
    });
});

// Get all volunteer requests
const getAllVolunteerRequests = asyncWrapper(async (req, res, next) => {
    const requests = await VolunteerRequest.find()
        .populate("orphanage", "name location");

    res.json({
        status: httpStatusText.SUCCESS,
        data: { requests }
    });
});

// Get volunteer request by ID
const getVolunteerRequestById = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const request = await VolunteerRequest.findById(id)
        .populate("orphanage", "name location");

    if (!request) {
        return next(appError.create("Request not found", 404, httpStatusText.FAIL));
    }

    res.json({
        status: httpStatusText.SUCCESS,
        data: { request }
    });
});
// Delete volunteer request by ID
const deleteVolunteerRequest = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const deletedRequest = await VolunteerRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
        return next(appError.create("Volunteer request not found", 404, httpStatusText.FAIL));
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Volunteer request deleted successfully."
    });
});
// Update volunteer request by ID
const updateVolunteerRequest = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    const updatedRequest = await VolunteerRequest.findByIdAndUpdate(id, updates, {
        new: true, // return the updated document
        runValidators: true
    });

    if (!updatedRequest) {
        return next(appError.create("Volunteer request not found", 404, httpStatusText.FAIL));
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Volunteer request updated successfully.",
        data: { request: updatedRequest 
            
        }
    });
});



module.exports = {
    createVolunteerRequest,
    getAllVolunteerRequests,
    getVolunteerRequestById,
    deleteVolunteerRequest,
    deleteVolunteerRequest,
    updateVolunteerRequest
};