const asyncWrapper = require('../middlewares/asyncWrapper.js');
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const {validationResult} = require('express-validator');
const requestStatus = require("../utilities/requestStatus");

//get all orphanages
const getAllOrphanages = asyncWrapper(
    async (req, res) => {
        const query = req.query;
        
        /* Pagination */
            const limit = query.limit || 4;
            const page = query.page || 1;
            const skip = (page - 1) * limit;
        
            const orphanages = await Orphanage.find({}, {__v: false}).limit(limit).skip(skip).populate("admin", "name email");
        /* Pagination */

        return res.json({ status: httpStatusText.SUCCESS, data: {orphanages} });
    }
);

//get orphanage by id
const getOrphanageById = asyncWrapper(
    async (req, res, next) => {
        const id = req.params.id;
        const orphanage = await Orphanage.findById(id).populate("admin", "name email");

        if(!orphanage){
            const error = appError.create("orphanage not found", 400, httpStatusText.FAIL);
            return next(error);
        }

        return res.json({ status: httpStatusText.SUCCESS,data: {orphanage} });
    }
);

// create new orphanage
const createOrphanage = asyncWrapper(
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = appError.create(errors.array(), 400, httpStatusText.FAIL);
            return next(error);
        }

        const { name, location, description, contact: {phone, email} } = req.body;
        const userId = req.currentUser.id; // User requesting the orphanage

        const newOrphanage = new Orphanage({ 
            name: name, 
            location: location, 
            description: description, 
            contact: {
                phone: phone, 
                email: email
            },
            admin: userId, // The requesting user becomes the orphanage admin
            status: requestStatus.PENDING
        });
        await newOrphanage.save();
        res.status(201).json({ 
            status: httpStatusText.SUCCESS, 
            data: {orphanage: newOrphanage},
            message: "Orphanage request submitted, pending approval."
        });
    }
);

const approveOrphanage = asyncWrapper(
    async (req, res, next) => {
        const orphanageId = req.params.id;
        const orphanage = await Orphanage.findById(orphanageId);

        if (!orphanage) {
            return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
        }

        if (orphanage.status === requestStatus.APPROVED) {
            return res.json({ status: httpStatusText.SUCCESS, message: "Orphanage is already approved." });
        }

        orphanage.status = requestStatus.APPROVED;
        orphanage.verified = true;
        await orphanage.save();

        res.json({ 
            status: httpStatusText.SUCCESS, 
            message: "Orphanage approved successfully.", 
            data: { orphanage } 
        });
    }
);


module.exports = {
    getAllOrphanages,
    getOrphanageById,
    createOrphanage,
    approveOrphanage
}