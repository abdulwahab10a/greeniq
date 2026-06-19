const express = require('express');
const router  = express.Router();
const { chat } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth: يخصّص رد نبتة للمستخدم المسجّل، ويبقى متاحاً للضيوف
router.post('/', optionalAuth, chat);

module.exports = router;
