const express = require('express');
const { runXxeTest } = require('../controllers/xxeController');

const router = express.Router();

router.post('/test', runXxeTest);

module.exports = router;
