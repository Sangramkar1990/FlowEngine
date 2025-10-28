const express = require('express');
const { createOrganization, getUserOrganizationStatus, getOrganizationInfo, checkOrganizationName, searchOrganizations } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/create', verifyToken,createOrganization);
router.get('/status', protect, getOrganizationInfo);
router.get('/check-name', checkOrganizationName);
router.get('/search',protect, searchOrganizations); // Added search route

module.exports = router;