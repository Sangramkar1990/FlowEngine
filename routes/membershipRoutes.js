const express = require('express');
const membershipController = require('../controllers/membershipController');
const { getMemberships } = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');
const membershipRoleController = require('../controllers/membershipRoleController');

const router = express.Router();

router.get('/me', protect, getMemberships);
router.get('/search', protect, membershipController.searchMemberships); // Added protect middleware
router.get('/organization/:organizationId', protect, membershipController.getMembershipsByOrganizationId); // New route
// router.post('/role', protect, membershipRoleController.updateRole);
router.post('/role/:userId', protect, membershipRoleController.updateUserMembershipRole);
router.get('/', protect, membershipRoleController.getAllMemberships);
router.get('/getMembershipOrg', protect, membershipController.getAllMembershipByOrganization);

module.exports = router;