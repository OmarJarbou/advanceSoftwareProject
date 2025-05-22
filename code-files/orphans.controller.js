const mongoose = require("mongoose");
const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const { validationResult } = require("express-validator");
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const requestStatus = require("../utilities/requestStatus");

// Get all orphans with pagination: ok
const getAllOrphans = asyncWrapper(
    async (req, res, next) => {
        const query = req.query;
        
        const limit = query.limit || 4;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        const orphans = await Orphan.find({}, { __v: false })
            .limit(limit)
            .skip(skip)
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        if(!orphans.length === 0){
            const error = appError.create("No Orphans In Your Orphanage Yet!", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS, data: { orphans } });
    }
);

// Get all orphans of orphanage with pagination: ok
const getAllOrphansOfOrphanage = asyncWrapper(
    async (req, res, next) => {
        const query = req.query;
        
        const limit = query.limit || 4;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        const orphanageId = req.params.id;
        const orphanageDoc = await Orphanage.findById(new mongoose.Types.ObjectId(orphanageId));

        // find orphan by it orphanage id:
        const orphans = await Orphan.find({orphanage: orphanageDoc._id}, { __v: false })
            .limit(limit)
            .skip(skip)
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        if(!orphans.length === 0){
            const error = appError.create("No Orphans In Your Orphanage Yet!", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS, data: { orphans } });
    }
);

// Get orphan by ID: ok
const getOrphanById = asyncWrapper(
    async (req, res, next) => {
        const id = req.params.orphanid;
        const orphan = await Orphan.findById(new mongoose.Types.ObjectId(id))
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        if (!orphan) {
            const error = appError.create("Orphan not found", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS, data: { orphan } });
    }
);

const getOrphanPhotos = asyncWrapper(async (req, res, next) => {
  const orphanId = req.params.orphanid;

  const orphan = await Orphan.findById(orphanId);
  if (!orphan) {
    return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
  }

  const photos = orphan.photos || [];

  // Build full URLs for each image
  const photoUrls = photos.map(filename => `${process.env.FRONTEND_URL}/uploads/orphans/${filename}`);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { photos: photoUrls }
  });
});


// Get orphan by ID in orphanage: ok
const getOrphanByIdInOrphanage = asyncWrapper(
    async (req, res, next) => {
        const orphanageId = req.params.orphanageid;
        const orphanageDoc = await Orphanage.findById(new mongoose.Types.ObjectId(orphanageId));

        const id = req.params.id;
        const orphan = await Orphan.find({orphanage: orphanageDoc._id, _id: id})
            .populate("orphanage", "name location")
            .populate("orphanageAdmin", "name email");

        if (orphan.length === 0) {
            const error = appError.create("There is No Orphan With This ID In Your Orphanage!", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS, data: { orphan } });
    }
);

// Create orphan: ok - {photos}
const createOrphan = asyncWrapper(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = appError.create(errors.array(), 400, httpStatusText.FAIL);
            return next(error);
        }

        const { name, age, gender, educationStatus, healthCondition, orphanage } = req.body;
        const orphanageAdmin=req.currentUser.id;
        console.log(orphanageAdmin);
        const orphanageDoc = await Orphanage.findById(new mongoose.Types.ObjectId(orphanage));
        const photoFilenames = req.files?.map(file => file.filename) || [];

        const newOrphan = new Orphan({
            name:name,
            age:age,
            gender:gender,
            educationStatus:educationStatus,
            healthCondition:healthCondition,
            orphanage:orphanage,
            orphanageAdmin:orphanageAdmin,
            photos:photoFilenames
        });
        await newOrphan.save();
        orphanageDoc.orphans.push(newOrphan);
        await orphanageDoc.save();

        res.status(201).json({
            status: httpStatusText.SUCCESS,
            data: { orphan: newOrphan },
            message: "Orphan created successfully."
        });
    }
);

// Update orphan details
const updateOrphan = asyncWrapper(async (req, res, next) => {
    const orphanId = req.params.orphanid;
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
    const orphanId = req.params.orphanid;

    const oldOrphan = await Orphan.findById(orphanId);

    if (!oldOrphan) {
        return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
    }
    
    const orphanageDoc = await Orphanage.findById(oldOrphan.orphanage);

    // Delete the orphan
    await Orphan.findByIdAndDelete(orphanId);

    // Remove orphan from orphanage's orphans array
    orphanageDoc.orphans = orphanageDoc.orphans.filter(id => !id.equals(orphanId));
        
    // Save the updated orphanage document
    await orphanageDoc.save();

    res.json({
        status: httpStatusText.SUCCESS,
        message: "Orphan deleted successfully."
    });
});

module.exports = {
    getAllOrphans,
    getAllOrphansOfOrphanage,
    getOrphanById,
    getOrphanByIdInOrphanage,
    createOrphan,
    updateOrphan,
    deleteOrphan,
    getOrphanPhotos
};
