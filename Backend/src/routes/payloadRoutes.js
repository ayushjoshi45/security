const express = require('express');
const {
  listPayloadTypes,
  listPayloads,
  buildInjectedPayload
} = require('../controllers/payloadController');

const router = express.Router();

router.get('/types', listPayloadTypes);
router.get('/', listPayloads);
router.post('/inject', buildInjectedPayload);

module.exports = router;
