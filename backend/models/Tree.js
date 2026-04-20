const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ageAtPlanting: {
      type: Number,
      default: 0, // بالأيام
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
treeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Tree', treeSchema);