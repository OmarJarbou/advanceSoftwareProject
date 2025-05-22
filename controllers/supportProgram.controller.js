// controllers/supportProgram.controller.js
const SupportProgram = require("../models/supportProgram.model.js");
const Orphanage = require("../models/orphanage.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utilities/appError");
const httpStatusText = require("../utilities/httpStatusText");
const User = require("../models/user.model.js");
const userRoles = require('../utilities/userRoles');
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");

const createSupportProgram = asyncWrapper(async (req, res, next) => {
const { name, description, orphanage } = req.body;
const userId = req.currentUser.id;

if (!name) {
return next(appError.create("Program name is required", 400, httpStatusText.FAIL));
}

let orphanageRef = null;
if (orphanage) {
const exists = await Orphanage.findById(orphanage);
if (!exists) {
return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
}
orphanageRef = orphanage;
}

const program = new SupportProgram({
name,
description,
orphanage: orphanageRef,
createdBy: userId,
});

await program.save();

if (orphanageRef) {
    await Orphanage.findByIdAndUpdate(
      orphanageRef,
      { $push: { supportPrograms: program._id } },
      { new: true } 
    );
  }

res.status(201).json({
status: httpStatusText.SUCCESS,
message: "Support Program created successfully",
data: { program },
});
});

// const getAllSupportPrograms = asyncWrapper(async (req, res, next) => {
//     console.log("wafa");
//      const programs = await SupportProgram.find()
//     .populate("orphanage", "name location")
//     .populate("createdBy", "firstName lastName email");

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     data: { programs },
//   });
// });


const getAllSupportPrograms = asyncWrapper(async (req, res, next) => {
    
  const userId = req.currentUser.id;

    console.log("User ID:", userId);

  const user = await User.findById(userId);
  if (!user) {
    return next(appError.create("User not found", 404, httpStatusText.FAIL));
  }

  const userRole = user.role;  

  
  if (userRole === "ORPHANAGE ADMIN") {
    const orphanage = await Orphanage.findOne({ admin: userId });
    if (!orphanage) {
      return next(appError.create("Orphanage not found for this admin", 404, httpStatusText.FAIL));
    }

    
    const programs = await SupportProgram.find({ orphanage: orphanage._id })
      .populate("orphanage", "name location")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { programs },
    });
  } else {
    // إذا كان المستخدم "Admin" فقط، يمكنه رؤية كل البرامج
    const programs = await SupportProgram.find()
      .populate("orphanage", "name location")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { programs },
    });
  }
});



const getSupportProgramById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.currentUser.id;
  const userRoles = req.currentUser.role;

  // البحث عن البرنامج
  const program = await SupportProgram.findById(id)
    .populate("orphanage", "name location")
    .populate("createdBy", "firstName lastName email");

  if (!program) {
    return next(appError.create("Support Program not found", 404, httpStatusText.FAIL));
  }

  // إذا كان المستخدم "Orphanage Admin"، تأكد أن البرنامج مرتبط بمؤسسته
  if (userRoles === "ORPHANAGE_ADMIN") {
    const orphanage = await Orphanage.findOne({ admin: userId });
    if (!orphanage || orphanage._id.toString() !== program.orphanage.toString()) {
      return next(appError.create("Unauthorized - You are not the admin of this orphanage", 403, httpStatusText.FAIL));
    }
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { program },
  });
});

const getSupportProgramByOrphanage = asyncWrapper(async (req, res, next) => {
  const { orphanageId } = req.params; // جلب الـ orphanageId من المعاملات
  const userId = req.currentUser.id; // استرجاع الـ userId من الـ currentUser

  // استرجاع بيانات المستخدم
  const user = await User.findById(userId);
  if (!user) {
    return next(appError.create("User not found", 404, httpStatusText.FAIL));
  }

  const userRole = user.role; // استرجاع الدور من بيانات المستخدم

  // إذا كان المستخدم هو "Orphanage Admin"
  if (userRole === "ORPHANAGE ADMIN") {
    const orphanage = await Orphanage.findById(orphanageId);
    if (!orphanage) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }

    // تحقق مما إذا كان الـ orphanage الخاص بالمستخدم يطابق الـ orphanage المطلوب
    if (!orphanage.admin.equals(userId)) {
      return next(appError.create("Unauthorized - You are not the admin of this orphanage", 403, httpStatusText.FAIL));
    }

    // جلب جميع البرامج المرتبطة بالمؤسسة
    const programs = await SupportProgram.find({ orphanage: orphanageId })
      .populate("orphanage", "name location")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { programs },
    });
  } 
  // إذا كان المستخدم "SUPPORT_PROGRAM_ADMIN"
   else if (userRole === "SUPPORT_PROGRAM_ADMIN") {
    // جلب البرامج التي تم إنشاؤها بواسطة الـ SUPPORT_PROGRAM_ADMIN لهذا الـ orphanage
    const programs = await SupportProgram.find({ orphanage: orphanageId, createdBy: userId })
      .populate("orphanage", "name location")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { programs },
    });
  }  
  // إذا كان المستخدم "Admin" فقط، يمكنه رؤية جميع البرامج من جميع المؤسسات
  else {
    const programs = await SupportProgram.find({ orphanage: orphanageId })
      .populate("orphanage", "name location")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { programs },
    });
  }
});


// Delete support program (by owner only)
// const deleteSupportProgram = asyncWrapper(async (req, res, next) => {
// const { id } = req.params;

// const program = await SupportProgram.findById(id);
// if (!program) {
// return next(appError.create("Support Program not found", 404, httpStatusText.FAIL));
// }

// if (!program.createdBy.equals(req.currentUser.id)) {
// return next(appError.create("Unauthorized - you didn't create this program", 403, httpStatusText.FAIL));
// }

// await SupportProgram.findByIdAndDelete(id);

// res.status(200).json({
// status: httpStatusText.SUCCESS,
// message: "Support Program deleted successfully"
// });
// });
const deleteSupportProgram = asyncWrapper(async (req, res, next) => {
const { id } = req.params;

const program = await SupportProgram.findById(id);
if (!program) {
return next(appError.create("Support Program not found", 404, httpStatusText.FAIL));
}

// تحقق من أن المستخدم هو من أنشأ البرنامج
if (!program.createdBy.equals(req.currentUser.id)) {
return next(appError.create("Unauthorized - you didn't create this program", 403, httpStatusText.FAIL));
}

// إذا كان مرتبط بـ orphanage، نحذفه من داخل orphanage
if (program.orphanage) {
await Orphanage.findByIdAndUpdate(program.orphanage, {
$pull: { supportPrograms: program._id }
});
}

await SupportProgram.findByIdAndDelete(id);

res.status(200).json({
status: httpStatusText.SUCCESS,
message: "Support Program deleted successfully"
});
});

module.exports = { 
     createSupportProgram,
     getAllSupportPrograms,
     getSupportProgramById,
     deleteSupportProgram,
     getSupportProgramByOrphanage

};