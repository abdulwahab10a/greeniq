const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileImage: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    instagramLink: {
      type: String,
      default: '',
    },
    facebookLink: {
      type: String,
      default: '',
    },
    snapchatLink: {
      type: String,
      default: '',
    },
    telegramLink: {
      type: String,
      default: '',
    },
    twitterLink: {
      type: String,
      default: '',
    },
    treesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);