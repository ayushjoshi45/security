const express = require('express');
const { runLdapInjectionTest } = require('../controllers/ldapInjectionController');

const router = express.Router();

router.post('/test', runLdapInjectionTest);

module.exports = router;
