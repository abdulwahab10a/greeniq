const User = require('../models/User');

// Escape special regex chars to prevent ReDoS from user-supplied search strings
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/users?search=&page=&limit=
const getUsers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const raw   = (req.query.search || '').trim().slice(0, 50);
    const search = raw ? escapeRegex(raw) : '';

    const filter = search
      ? {
          $or: [
            { userId:      { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await User.countDocuments({ createdAt: { $gte: today } });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({ total, todayCount, weekCount });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' });
  }
};

module.exports = { getUsers, getStats };
