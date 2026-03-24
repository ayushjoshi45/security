const express = require('express');
const {
  runPathTraversalTest
} = require('../controllers/pathTraversalController');

const router = express.Router();

router.post('/test', runPathTraversalTest);

module.exports = router;
