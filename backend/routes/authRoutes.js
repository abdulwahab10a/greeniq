const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const upload = require('../services/uploadService');

router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);

module.exports = router;