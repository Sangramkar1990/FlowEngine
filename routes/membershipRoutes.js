const express = require('express');
const membershipController = require('../controllers/membershipController');
const { getMemberships } = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMemberships);
router.get('/search', membershipController.searchMemberships);

module.exports = router;