const ControllingDonation = require("../models/controllingDonation.model.js");
const Donation = require("../models/donation.model.js");
const User = require("../models/user.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const Orphan = require("../models/orphan.model.js");
const userRoles = require('../utilities/userRoles');

const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");

// إنشاء سجل تحكم جديد (Control Donation)
const mongoose = require("mongoose");

const Orphanage = require("../models/orphanage.model.js"); // تأكد الاستيراد في أعلى الملف

const createControlDonation = asyncWrapper(async (req, res, next) => {
  const { donationId } = req.params;

  // 1. البحث عن التبرع
  const donation = await Donation.findById(donationId);
  if (!donation) {
    return next(appError.create("Donation not found", 404, httpStatusText.FAIL));
  }
  if (donation.status !== "Completed") {
    return next(appError.create("Donation must be completed before controlling", 400, httpStatusText.FAIL));
  }

  const userId = req.currentUser.id;
  const userRole = req.currentUser.role;

  // --- طباعة بيانات للتتبع ---
  console.log("User ID:", userId);
  console.log("User role:", userRole);
  console.log("Donation orphanage ID:", donation.orphanage);

  // 2. تحقق الصلاحيات اعتمادًا على دور المستخدم وربطه بمؤسسة التبرع
  if (donation.orphanage) {
    const orphanage = await Orphanage.findById(donation.orphanage);

    console.log("Orphanage admin ID:", orphanage ? orphanage.admin : "No orphanage found");

    if (!orphanage) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }

    if (userRole === "ORPHANAGE ADMIN") {
      if (!orphanage.admin.equals(userId)) {
        return next(appError.create("Unauthorized - you are not admin of this orphanage", 403, httpStatusText.FAIL));
      }
    } else if (userRole !== "ADMIN") {
      return next(appError.create("Unauthorized", 403, httpStatusText.FAIL));
    }
  } else {
    // حالة التبرع بدون orphanage مرتبط - فقط Admin يسمح له
    if (userRole !== "ADMIN") {
      return next(appError.create("Unauthorized", 403, httpStatusText.FAIL));
    }
  }

  const { usageSummary, orphansImpacted, photos, notes } = req.body;
  

   // تحويل أسماء ملفات الصور إلى روابط كاملة
  let photosUrls = [];
  if (Array.isArray(photos) && photos.length > 0) {
    photosUrls = photos.map(filename => `http://localhost:5000/uploads/${filename}`);
  }

  // 3. تحقق إن سجل التحكم ما موجود مسبقاً (لمنع التعديل)
  const existingRecord = await ControllingDonation.findOne({ donation: donationId });
  if (existingRecord) {
    return next(appError.create("Control record already exists", 400, httpStatusText.FAIL));
  }

  // 4. إنشاء سجل التحكم الجديد
  const controllingRecord = new ControllingDonation({
    donation: donationId,
    orphanage: donation.orphanage || null,
    controlledBy: userId,
    usageSummary,
    orphansImpacted: orphansImpacted || [],
    photos: photosUrls,
    notes: notes || ""
  });

  await controllingRecord.save();

  donation.status =  "Controlled";
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Donation control record created successfully",
    data: { controllingRecord }
  });
});

module.exports = {
  createControlDonation,
};


const getControlDonationById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const record = await ControllingDonation.findById(id)
    .populate("donation")
    .populate("orphanage")
    .populate("controlledBy", "name email")
    .populate("orphansImpacted", "name age");

  if (!record) {
    return next(appError.create("Control donation record not found", 404, httpStatusText.FAIL));
  }

  const userId = req.currentUser.id;
  const userRole = req.currentUser.role;

  if (record.orphanage) {
    const orphanage = await Orphanage.findById(record.orphanage);
    if (!orphanage) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }

    if (userRole === "ORPHANAGE ADMIN") {
      if (!orphanage.admin.equals(userId)) {
        return next(appError.create("Unauthorized - you are not admin of this orphanage", 403, httpStatusText.FAIL));
      }
    } else if (userRole !== "ADMIN") {
      return next(appError.create("Unauthorized", 403, httpStatusText.FAIL));
    }
  } else {
    // حالة سجل التحكم بدون orphanage مرتبط - فقط Admin يسمح له
    if (userRole !== "ADMIN") {
      return next(appError.create("Unauthorized", 403, httpStatusText.FAIL));
    }
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { record }
  });
});

const getControlDonations = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const userRole = req.currentUser.role;

  let records;

  if (userRole === "ADMIN") {
    // المدير يشوف كل السجلات
    records = await ControllingDonation.find()
      .populate("donation")
      .populate("orphanage")
      .populate("controlledBy", "name email")
      .populate("orphansImpacted", "name age");
  } else if (userRole === "ORPHANAGE ADMIN") {
    // مشرف المؤسسة يشوف السجلات الخاصة بمؤسسته فقط
    const orphanages = await Orphanage.find({ admin: userId });
    const orphanageIds = orphanages.map(o => o._id);

    records = await ControllingDonation.find({ orphanage: { $in: orphanageIds } })
      .populate("donation")
      .populate("orphanage")
      .populate("controlledBy", "name email")
      .populate("orphansImpacted", "name age");
  } else {
    return next(appError.create("Unauthorized", 403, httpStatusText.FAIL));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: records.length,
    data: { records }
  });
});

const updateControlDonation = asyncWrapper(async (req, res, next) => {
  const { id } = req.params; // معرف سجل التحكم المراد تحديثه
  const userId = req.currentUser.id;
  const userRole = req.currentUser.role;
  const updateData = req.body; // البيانات اللي حابب تحدثها

  // 1. جلب سجل التحكم
  const record = await ControllingDonation.findById(id);
  if (!record) {
    return next(appError.create("Control donation record not found", 404, httpStatusText.FAIL));
  }

  // 2. تحقق الصلاحيات بناءً على الدور والارتباط بالـ orphanage
  if (record.orphanage) {
    const orphanage = await Orphanage.findById(record.orphanage);
    if (!orphanage) {
      return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
    }

    if (userRole === "ORPHANAGE ADMIN" && !orphanage.admin.equals(userId)) {
      return next(appError.create("Unauthorized - you are not admin of this orphanage", 403, httpStatusText.FAIL));
    
  } 

  // 3. تحديث الحقول المسموح بها فقط (لتجنب التحديثات غير المرغوبة)
  const allowedUpdates = ["usageSummary", "orphansImpacted", "photos", "notes"];
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      record[field] = updateData[field];
    }
  });

  // 4. حفظ التحديثات
  await record.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Control donation record updated successfully",
    data: { record }
  });
}});




module.exports = {
  createControlDonation,
  getControlDonationById,
  getControlDonations,
  updateControlDonation,
};
