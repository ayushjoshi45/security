const express = require('express');
const { runFileUploadTest } = require('../controllers/fileUploadController');

const router = express.Router();

router.post('/test', runFileUploadTest);

module.exports = router;
