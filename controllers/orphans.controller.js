const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const { validationResult } = require("express-validator");
const asyncWrapper = require('../middlewares/asyncWrapper.js');

// Get all orphans with pagination
const getAllOrphans = asyncWrapper(
    async (req, res) => {
        const query = req.query;
        
        const limit = query.limit || 4;
        const page = query.page || 1;
        const skip = (page - 1) * limit;
        
        const orphans = await Orphan.find({}, { __v: false })
            .limit(limit)
            .skip(skip)
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        return res.json({ status: httpStatusText.SUCCESS, data: { orphans } });
    }
);

// Get orphan by ID
const getOrphanById = asyncWrapper(
    async (req, res, next) => {
        const id = req.params.id;
        const orphan = await Orphan.findById(id)
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        if (!orphan) {
            const error = appError.create("Orphan not found", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS, data: { orphan } });
    }
);


const createOrphan = asyncWrapper(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = appError.create(errors.array(), 400, httpStatusText.FAIL);
            return next(error);
        }

        const { name, age, gender, educationStatus, healthCondition, orphanage, photos } = req.body;
        const orphanageAdmin=req.currentUser.id;

        const orphanageDoc = await Orphanage.findById(orphanage);
        if (!orphanageDoc) {
            const error = appError.create("Orphanage not found", 400, httpStatusText.FAIL);
            return next(error);
        }

        if (!orphanageDoc.admin.equals(orphanageAdmin)) {
            const error = appError.create("Orphanage Admin mismatch", 400, httpStatusText.FAIL);
            return next(error);
        }

        const newOrphan = new Orphan({
            name:name,
            age:age,
            gender:gender,
            educationStatus:educationStatus,
            healthCondition:healthCondition,
            orphanage:orphanage,
            orphanageAdmin:orphanageAdmin,
            photos:photos
        });

        await newOrphan.save();
        res.status(201).json({
            status: httpStatusText.SUCCESS,
            data: { orphan: newOrphan },
            message: "Orphan created successfully."
        });
    }
);

// Approve orphan (this could be based on some approval logic, e.g., admin verifies orphan info)
const approveOrphan = asyncWrapper(
    async (req, res, next) => {
        const orphanId = req.params.id;
        const orphan = await Orphan.findById(orphanId);

        if (!orphan) {
            return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
        }

        // Assuming you want an approval flag here
        orphan.approved = true; // Add an "approved" field if necessary
        await orphan.save();

        res.json({
            status: httpStatusText.SUCCESS,
            message: "Orphan approved successfully.",
            data: { orphan }
        });
    }
);

// Update orphan details
const updateOrphan = asyncWrapper(async (req, res, next) => {
    const orphanId = req.params.id;
    const updates = req.body;

    const orphan = await Orphan.findByIdAndUpdate(orphanId, updates, { new: true });

    if (!orphan) {
        return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
    }

    res.json({
        status: httpStatusText.SUCCESS,
        message: "Orphan updated successfully.",
        data: { orphan }
    });
});

// Delete orphan
const deleteOrphan = asyncWrapper(async (req, res, next) => {
    const orphanId = req.params.id;

    const orphan = await Orphan.findByIdAndDelete(orphanId);

    if (!orphan) {
        return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
    }

    res.json({
        status: httpStatusText.SUCCESS,
        message: "Orphan deleted successfully."
    });
});

module.exports = {
    getAllOrphans,
    getOrphanById,
    createOrphan,
    approveOrphan,
    updateOrphan,
    deleteOrphan
};
