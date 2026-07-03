const express = require('express');
const router  = express.Router();
const { getRecommendation, getCities } = require('../controllers/recommendationController');

router.get('/cities', getCities);
router.get('/', getRecommendation);

module.exports = router;
