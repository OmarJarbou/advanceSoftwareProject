// const Orphan = require("../models/orphan.model");
// const httpStatusText = require("../utilities/httpStatusText");

// // Get all orphans
// exports.getAllOrphans = async (req, res, next) => {
//   try {
//     const orphans = await Orphan.find().populate("orphanage sponsors");
//     res.status(200).json({ status: httpStatusText.SUCCESS, data: orphans });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get single orphan by ID
// exports.getOrphanById = async (req, res, next) => {
//   try {
//     const orphan = await Orphan.findById(req.params.id).populate("orphanage sponsors");
//     if (!orphan) {
//       return res.status(404).json({ status: httpStatusText.ERROR, message: "Orphan not found" });
//     }
//     res.status(200).json({ status: httpStatusText.SUCCESS, data: orphan });
//   } catch (error) {
//     next(error);
//   }
// };

// // Create a new orphan
// exports.createOrphan = async (req, res, next) => {
//   try {
//     const orphan = new Orphan(req.body);
//     await orphan.save();
//     res.status(201).json({ status: httpStatusText.SUCCESS, data: orphan });
//   } catch (error) {
//     next(error);
//   }
// };

// // Update orphan details
// exports.updateOrphan = async (req, res, next) => {
//   try {
//     const orphan = await Orphan.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!orphan) {
//       return res.status(404).json({ status: httpStatusText.ERROR, message: "Orphan not found" });
//     }
//     res.status(200).json({ status: httpStatusText.SUCCESS, data: orphan });
//   } catch (error) {
//     next(error);
//   }
// };

// // Delete an orphan
// exports.deleteOrphan = async (req, res, next) => {
//   try {
//     const orphan = await Orphan.findByIdAndDelete(req.params.id);
//     if (!orphan) {
//       return res.status(404).json({ status: httpStatusText.ERROR, message: "Orphan not found" });
//     }
//     res.status(200).json({ status: httpStatusText.SUCCESS, message: "Orphan deleted successfully" });
//   } catch (error) {
//     next(error);
//   }
// };
