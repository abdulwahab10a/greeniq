const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { uploadToImgBB } = require('../services/imgbbService');
const { containsProfanity } = require('../services/profanityService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const USER_ID_REGEX = /^[a-zA-Z0-9_]+$/;
const URL_REGEX = /^https?:\/\/.+\..+/;

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { userId, displayName, password, instagramLink } = req.body;

    if (!userId || !displayName || !password) {
      return res.status(400).json({ message: 'الرجاء تعبئة جميع الحقول المطلوبة' });
    }

    if (userId.length < 3 || userId.length > 20) {
      return res.status(400).json({ message: 'المعرف يجب أن يكون بين 3 و 20 حرفاً' });
    }
    if (!USER_ID_REGEX.test(userId)) {
      return res.status(400).json({ message: 'المعرف يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط' });
    }
    if (displayName.length < 2 || displayName.length > 30) {
      return res.status(400).json({ message: 'الاسم الظاهر يجب أن يكون بين 2 و 30 حرفاً' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }
    if (instagramLink && !URL_REGEX.test(instagramLink)) {
      return res.status(400).json({ message: 'رابط التواصل الاجتماعي غير صالح' });
    }

    if (containsProfanity(displayName) || containsProfanity(userId)) {
      return res.status(400).json({ message: 'يحتوي النص على كلمات غير لائقة، يرجى تعديله' });
    }

    const existingUser = await User.findOne({ userId: userId.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'هذا المعرف مستخدم مسبقاً' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profileImage = '';
    if (req.file) {
      profileImage = await uploadToImgBB(req.file.path);
    }

    const isAdmin = userId.toLowerCase() === 'admin';

    const user = await User.create({
      userId: userId.toLowerCase(),
      displayName,
      password: hashedPassword,
      profileImage,
      instagramLink: instagramLink || '',
      role: isAdmin ? 'admin' : 'user',
    });

    res.status(201).json({
      _id: user._id,
      userId: user.userId,
      displayName: user.displayName,
      profileImage: user.profileImage,
      instagramLink: user.instagramLink,
      facebookLink: user.facebookLink,
      snapchatLink: user.snapchatLink,
      telegramLink: user.telegramLink,
      twitterLink: user.twitterLink,
      phone: user.phone,
      treesCount: user.treesCount,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال المعرف وكلمة المرور' });
    }
    if (typeof userId !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'بيانات غير صالحة' });
    }

    const user = await User.findOne({ userId: userId.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'المعرف أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'المعرف أو كلمة المرور غير صحيحة' });
    }

    res.json({
      _id: user._id,
      userId: user.userId,
      displayName: user.displayName,
      profileImage: user.profileImage,
      phone: user.phone,
      instagramLink: user.instagramLink,
      facebookLink: user.facebookLink,
      snapchatLink: user.snapchatLink,
      telegramLink: user.telegramLink,
      twitterLink: user.twitterLink,
      treesCount: user.treesCount,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };