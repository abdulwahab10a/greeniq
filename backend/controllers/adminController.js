const User = require('../models/User');

// GET /api/admin/users?search=&page=&limit=
const getUsers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = (req.query.search || '').trim();

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
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUsers, getStats };
