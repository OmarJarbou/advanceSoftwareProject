const Review = require('../models/review.model.js');
const Orphanage = require('../models/orphanage.model.js');
const appError = require('../utilities/appError.js');
const httpStatusText = require('../utilities/httpStatusText.js');
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const sendEmail = require('../utilities/sendEmail.js'); 

// أضف تقييم جديد
const addReview = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;
  const { orphanageId, rating, comment } = req.body;

  if (!orphanageId || !rating) {
    return next(appError.create('Orphanage and rating are required', 400, httpStatusText.FAIL));
  }

  if (rating < 1 || rating > 5) {
    return next(appError.create('Rating must be between 1 and 5', 400, httpStatusText.FAIL));
  }

  const orphanage = await Orphanage.findById(orphanageId);
  if (!orphanage) {
    return next(appError.create('Orphanage not found', 404, httpStatusText.FAIL));
  }

  // تحقق إذا كان التقييم موجود مسبقًا
  const existingReview = await Review.findOne({ donor: donorId, orphanage: orphanageId });
  if (existingReview) {
    return next(appError.create('You have already reviewed this orphanage', 400, httpStatusText.FAIL));
  }

  const review = await Review.create({ donor: donorId, orphanage: orphanageId, rating, comment });

  // إرسال رسالة شكر للمتبرع (مثال)
  await sendEmail({
    to: req.currentUser.email,
    subject: 'شكراً لتقييمك',
    text: `شكراً لتقييمك لمؤسسة ${orphanage.name} بدرجة ${rating} نجوم!`
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: 'Review added successfully',
    data: { review }
  });
});

// عرض تقييمات مؤسسة مع خيارات فرز
const getReviewsForOrphanage = asyncWrapper(async (req, res, next) => {
  const { orphanageId } = req.params;
  const { sortBy = 'createdAt', order = 'desc' } = req.query; // ترتيب: createdAt أو rating

  if (!['createdAt', 'rating'].includes(sortBy)) {
    return next(appError.create('Invalid sort field', 400, httpStatusText.FAIL));
  }
  if (!['asc', 'desc'].includes(order)) {
    return next(appError.create('Invalid order', 400, httpStatusText.FAIL));
  }

  const orphanage = await Orphanage.findById(orphanageId);
  if (!orphanage) {
    return next(appError.create('Orphanage not found', 404, httpStatusText.FAIL));
  }

  const reviews = await Review.find({ orphanage: orphanageId })
    .populate('donor', 'firstName lastName')
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

  // حساب متوسط التقييم وعدد التقييمات
  const agg = await Review.aggregate([
    { $match: { orphanage: orphanage._id } },
    {
      $group: {
        _id: '$orphanage',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = agg[0] || { averageRating: 0, count: 0 };

  res.json({
    status: httpStatusText.SUCCESS,
    data: { reviews, averageRating: summary.averageRating, totalReviews: summary.count }
  });
});

// تحديث تقييم متبرع
const updateReview = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findOne({ _id: reviewId, donor: donorId });
  if (!review) return next(appError.create('Review not found or unauthorized', 404, httpStatusText.FAIL));

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) return next(appError.create('Rating must be between 1 and 5', 400, httpStatusText.FAIL));
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();

  res.json({
    status: httpStatusText.SUCCESS,
    message: 'Review updated successfully',
    data: { review }
  });
});

// حذف تقييم
const deleteReview = asyncWrapper(async (req, res, next) => {
  const donorId = req.currentUser.id;
  const { reviewId } = req.params;

  const review = await Review.findOneAndDelete({ _id: reviewId, donor: donorId });
  if (!review) return next(appError.create('Review not found or unauthorized', 404, httpStatusText.FAIL));

  res.json({
    status: httpStatusText.SUCCESS,
    message: 'Review deleted successfully'
  });
});

const replyToReview = asyncWrapper(async (req, res, next) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const adminId = req.currentUser.id;

  const orphanage = await Orphanage.findOne({ admin: adminId });
  if (!orphanage) {
    return next(appError.create("Orphanage not found", 404, httpStatusText.FAIL));
  }

  const review = await Review.findOne({ _id: reviewId, orphanage: orphanage._id });
  if (!review) {
    return next(appError.create("Review not found or not related to your orphanage", 404, httpStatusText.FAIL));
  }

  review.reply = reply;
  await review.save();

  res.json({
    status: httpStatusText.SUCCESS,
    message: "Reply added successfully",
    data: { review }
  });
});


module.exports = {
  addReview,
  getReviewsForOrphanage,
  updateReview,
  deleteReview,
  replyToReview
};
