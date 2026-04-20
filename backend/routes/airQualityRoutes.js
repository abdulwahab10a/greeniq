const express    = require('express');
const router     = express.Router();
const { getAirQuality } = require('../controllers/airQualityController');

router.get('/', getAirQuality);

module.exports = router;
