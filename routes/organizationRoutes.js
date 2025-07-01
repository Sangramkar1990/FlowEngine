const express = require('express');
const { createOrganization, getUserOrganizationStatus, getOrganizationInfo, checkOrganizationName } = require('../controllers/authController'); // Modified: Import checkOrganizationName
const { protect } = require('../middleware/auth');

const router = express.Router();


router.post('/create', createOrganization); 

// New route to get user's organization status (protected)
router.get('/status', protect, getOrganizationInfo); // Added: New route

// New route to check organization name uniqueness (not protected)
router.get('/check-name', checkOrganizationName); // Added: New route

module.exports = router;