const express = require('express');
const { runPipelineScan } = require('../controllers/pipelineController');

const router = express.Router();

router.get('/scan', runPipelineScan);
router.post('/scan', runPipelineScan);

module.exports = router;
