const express = require('express');
const { runCsrfTest } = require('../controllers/csrfController');

const router = express.Router();

router.get('/test', runCsrfTest);
router.post('/test', runCsrfTest);

module.exports = router;
