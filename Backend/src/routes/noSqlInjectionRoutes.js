const express = require('express');
const {
  runNoSqlInjectionTest
} = require('../controllers/noSqlInjectionController');

const router = express.Router();

router.post('/test', runNoSqlInjectionTest);

module.exports = router;
