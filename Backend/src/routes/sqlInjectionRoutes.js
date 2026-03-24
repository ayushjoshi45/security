const express = require('express');
const { runSqlInjectionTest } = require('../controllers/sqlInjectionController');

const router = express.Router();

router.post('/test', runSqlInjectionTest);

module.exports = router;
