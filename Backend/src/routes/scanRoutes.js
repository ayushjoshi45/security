const express = require('express');
const { createScan } = require('../controllers/scanController');

const router = express.Router();

router.post('/', createScan);
router.get('/', createScan);

module.exports = router;
