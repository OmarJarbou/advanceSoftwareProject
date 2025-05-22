const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken.js');
const allowedTo = require('../middlewares/allowedTo.js');
const userRoles = require('../utilities/userRoles.js');
const reviewController = require('../controllers/review.controller.js');

// إضافة تقييم جديد (متبرع فقط)
router.post(
  '/',
  verifyToken,
  allowedTo(userRoles.DONOR),
  reviewController.addReview
);

// جلب تقييمات مؤسسة معينة (عام)
router.get(
  '/orphanage/:orphanageId',
  reviewController.getReviewsForOrphanage
);

// تحديث تقييم (متبرع فقط)
router.patch(
  '/:reviewId',
  verifyToken,
  allowedTo(userRoles.DONOR),
  reviewController.updateReview
);

// حذف تقييم (متبرع فقط)
router.delete(
  '/:reviewId',
  verifyToken,
  allowedTo(userRoles.DONOR),
  reviewController.deleteReview
);

router.patch(
  "/:reviewId/reply",
  verifyToken,
  allowedTo(userRoles.ORPHANAGE_ADMIN),
  reviewController.replyToReview
);

module.exports = router;
