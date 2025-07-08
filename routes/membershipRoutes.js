const express = require('express');
const { getMemberships } = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMemberships);

module.exports = router;