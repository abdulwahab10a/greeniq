const User = require('../models/User');
const Tree = require('../models/Tree');
const { calculateImpact } = require('../services/impactService');
const { uploadToImgBB } = require('../services/imgbbService');
const { containsProfanity } = require('../services/profanityService');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const URL_REGEX = /^https?:\/\/.+\..+/;

const updateMe = async (req, res) => {
  try {
    const { displayName, phone, instagramLink, facebookLink, snapchatLink, telegramLink, twitterLink } = req.body;

    if (displayName !== undefined) {
      if (displayName.length < 2 || displayName.length > 30) {
        return res.status(400).json({ message: 'الاسم الظاهر يجب أن يكون بين 2 و 30 حرفاً' });
      }
      if (containsProfanity(displayName)) {
        return res.status(400).json({ message: 'يحتوي النص على كلمات غير لائقة، يرجى تعديله' });
      }
    }
    if (phone && phone.length > 20) {
      return res.status(400).json({ message: 'رقم الهاتف غير صالح' });
    }

    const socialLinks = { instagramLink, facebookLink, snapchatLink, telegramLink, twitterLink };
    for (const [key, val] of Object.entries(socialLinks)) {
      if (val && val.trim() !== '' && !URL_REGEX.test(val)) {
        return res.status(400).json({ message: 'صيغة الرابط غير صالحة، يجب أن يبدأ بـ http أو https' });
      }
    }

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (instagramLink !== undefined) updateData.instagramLink = instagramLink;
    if (facebookLink !== undefined) updateData.facebookLink = facebookLink;
    if (snapchatLink !== undefined) updateData.snapchatLink = snapchatLink;
    if (telegramLink !== undefined) updateData.telegramLink = telegramLink;
    if (twitterLink !== undefined) updateData.twitterLink = twitterLink;

    if (req.file) {
      updateData.profileImage = await uploadToImgBB(req.file.path);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ treesCount: { $gt: 0 } })
      .sort({ treesCount: -1 })
      .limit(100)
      .select('displayName profileImage treesCount');

    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const trees = await Tree.find({ userId: user._id });
        let totalCO2 = 0;
        let totalO2 = 0;
        trees.forEach((tree) => {
          const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
          totalCO2 += co2Absorbed;
          totalO2 += o2Produced;
        });
        return {
          _id: user._id,
          displayName: user.displayName,
          profileImage: user.profileImage,
          treesCount: user.treesCount,
          totalCO2: parseFloat(totalCO2.toFixed(2)),
          totalO2: parseFloat(totalO2.toFixed(2)),
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const trees = await Tree.find({ userId: user._id });
    let totalCO2 = 0;
    let totalO2 = 0;
    trees.forEach((tree) => {
      const { co2Absorbed, o2Produced } = calculateImpact(tree.createdAt);
      totalCO2 += co2Absorbed;
      totalO2 += o2Produced;
    });

    res.json({
      ...user.toObject(),
      totalCO2: parseFloat(totalCO2.toFixed(2)),
      totalO2: parseFloat(totalO2.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'يرجى تعبئة جميع الحقول' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await require('bcryptjs').compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const salt = await require('bcryptjs').genSalt(10);
    user.password = await require('bcryptjs').hash(newPassword, salt);
    await user.save();

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMe, updateMe, getLeaderboard, getUserById, changePassword };