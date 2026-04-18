const express = require('express');
const router = express.Router();
const { getMe, updateMe, getLeaderboard, getUserById, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../services/uploadService');

router.get('/leaderboard', getLeaderboard);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profileImage'), updateMe);
router.put('/change-password', protect, changePassword);
router.get('/:id', getUserById);

module.exports = router;