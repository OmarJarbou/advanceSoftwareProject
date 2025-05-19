const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orphanage: { type: mongoose.Schema.Types.ObjectId, ref: 'Orphanage', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
   reply: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

//اضمن انه المتبرع بقيم مرة وحدة للمؤسسة
ReviewSchema.index({ donor: 1, orphanage: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
