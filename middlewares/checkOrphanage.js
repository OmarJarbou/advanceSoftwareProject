const mongoose = require("mongoose");
const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const requestStatus = require("../utilities/requestStatus");
const userRoles = require("../utilities/userRoles.js");

const checkOrphanage = asyncWrapper(
    async (req, res, next) => {
        if(req.currentUser.role === userRoles.ORPHANAGE_ADMIN){
            let orphanageId;
            let orphanId;
            let oldOrphan;
            if(Object.keys(req.params).length === 0){ // on add new orphan
                orphanageId = req.body.orphanage;
            }
            else{ // on get operations
                if(req.params.orphanid){
                    orphanId = req.params.orphanid;
                    oldOrphan = await Orphan.findById(orphanId);
                    
                    if (!oldOrphan) {
                        return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
                    }
                }
                else if(req.params.orphanageid){
                    orphanageId = req.params.orphanageid;
                }
                else if(req.params.id){
                    orphanageId = req.params.id;
                }
            }
            const orphanageAdmin = req.currentUser.id;
            let orphanageDoc;
            if(req.params.orphanid){
                orphanageDoc = await Orphanage.findById(new mongoose.Types.ObjectId(oldOrphan.orphanage));
            }
            else{
                orphanageDoc = await Orphanage.findById(new mongoose.Types.ObjectId(orphanageId));
            }
                
            if (!orphanageDoc) {
                const error = appError.create("Orphanage not found", 400, httpStatusText.FAIL);
                return next(error);
            }
            
            if (orphanageDoc.status !== requestStatus.APPROVED){
                const error = appError.create("Orphanage not approved", 400, httpStatusText.FAIL);
                return next(error);
            }
            
            if (!orphanageDoc.admin.equals(orphanageAdmin)) {
                const error = appError.create("Orphanage Admin mismatch", 400, httpStatusText.FAIL);
                return next(error);
            }
        }
        next();
        return;
    }
);

module.exports = checkOrphanage;