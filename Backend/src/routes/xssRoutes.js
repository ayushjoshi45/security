const express = require('express');
const { runXssTest } = require('../controllers/xssController');

const router = express.Router();

router.post('/test', runXssTest);

module.exports = router;
