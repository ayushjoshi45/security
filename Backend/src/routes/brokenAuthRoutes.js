const express = require('express');
const { runBrokenAuthTest } = require('../controllers/brokenAuthController');

const router = express.Router();

router.post('/test', runBrokenAuthTest);

module.exports = router;
