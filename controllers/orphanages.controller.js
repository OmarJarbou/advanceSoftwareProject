const asyncWrapper = require('../middlewares/asyncWrapper.js');
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const {validationResult} = require('express-validator');

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
        const adminIdHeader = req.headers['AdminID'] || req.headers['adminid'];
        console.log(adminIdHeader);
        if(!adminIdHeader) {
            return res.status(401).json({ message: 'admin id is rquired' });
        }
        const adminId = adminIdHeader;

        const newOrphanage = new Orphanage({ 
            name: name, 
            location: location, 
            description: description, 
            contact: {
                phone: phone, 
                email: email
            },
            admin: adminId 
        });
        await newOrphanage.save();
        res.status(201).json({ status: httpStatusText.SUCCESS, data: {orphanage: newOrphanage} });
    }
);

module.exports = {
    getAllOrphanages,
    getOrphanageById,
    createOrphanage
}