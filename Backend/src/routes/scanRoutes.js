const express = require('express');
const {
	createScan,
	createTrackedScanJob,
	getTrackedScanStatus
} = require('../controllers/scanController');

const router = express.Router();

router.post('/', createScan);
router.get('/', createScan);
router.post('/track', createTrackedScanJob);
router.get('/status/:scanId', getTrackedScanStatus);

module.exports = router;
