const express = require('express');
const {
  runCommandInjectionTest
} = require('../controllers/commandInjectionController');

const router = express.Router();

router.post('/test', runCommandInjectionTest);

module.exports = router;
