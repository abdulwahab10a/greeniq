const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getUsers, getStats } = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/users', getUsers);
router.get('/stats', getStats);

module.exports = router;
