const express = require('express');
const router  = express.Router();
const { chat, chatStream } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth: يخصّص رد نبتة للمستخدم المسجّل، ويبقى متاحاً للضيوف
router.post('/', optionalAuth, chat);             // رد كامل (احتياطي)
router.post('/stream', optionalAuth, chatStream); // بثّ كلمة-كلمة (SSE)

module.exports = router;
