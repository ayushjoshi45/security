const express = require('express');
const {
  runSecurityHeadersTest
} = require('../controllers/securityHeadersController');

const router = express.Router();

router.get('/test', runSecurityHeadersTest);
router.post('/test', runSecurityHeadersTest);

module.exports = router;
