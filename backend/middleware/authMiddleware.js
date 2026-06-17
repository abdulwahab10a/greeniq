const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح، لا يوجد رمز دخول' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'لم يتم العثور على المستخدم' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'غير مصرح، رمز الدخول غير صالح' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'غير مصرح، هذه الصفحة للمسؤول فقط' });
};

module.exports = { protect, adminOnly };