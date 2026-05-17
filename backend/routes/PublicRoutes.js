const express = require('express');
const router = express.Router();
const { getPublicSiteConfig } = require('../controller/PublicSiteController');

router.get('/site-config', getPublicSiteConfig);

module.exports = router;
