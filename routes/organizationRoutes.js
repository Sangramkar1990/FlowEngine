const express = require('express');
const { createOrganization, getUserOrganizationStatus } = require('../controllers/authController'); // Modified: Import getUserOrganizationStatus
const { protect } = require('../middleware/auth');

const router = express.Router();

// Organization creation route (protected)
router.post('/create', createOrganization); // Assuming this should be protected if it's not already

// New route to get user's organization status (protected)
router.get('/status', protect, getUserOrganizationStatus); // Added: New route

module.exports = router;