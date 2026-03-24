const express = require('express');
const {
  runSensitiveDataExposureTest
} = require('../controllers/sensitiveDataExposureController');

const router = express.Router();

router.get('/test', runSensitiveDataExposureTest);
router.post('/test', runSensitiveDataExposureTest);

module.exports = router;
