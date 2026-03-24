const express = require('express');
const {
  getLinks,
  getForms,
  crawlSinglePage,
  crawlSite
} = require('../controllers/crawlController');

const router = express.Router();

router.get('/links', getLinks);
router.get('/forms', getForms);
router.get('/site', crawlSite);
router.post('/', crawlSinglePage);
router.post('/site', crawlSite);

module.exports = router;
