const express = require('express');
const {
	createScan,
	createTrackedScanJob,
	getTrackedScanStatus,
	listRealtimeLogs
} = require('../controllers/scanController');

const router = express.Router();

router.post('/', createScan);
router.get('/', createScan);
router.post('/track', createTrackedScanJob);
router.get('/status/:scanId', getTrackedScanStatus);
router.get('/logs', listRealtimeLogs);

module.exports = router;
