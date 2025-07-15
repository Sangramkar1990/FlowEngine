const express = require('express');
const membershipController = require('../controllers/membershipController');
const { getMemberships } = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');
const membershipRoleController = require('../controllers/membershipRoleController');

const router = express.Router();

router.get('/me', protect, getMemberships);
router.get('/search', membershipController.searchMemberships);
router.post('/role', protect, membershipRoleController.updateRole);
router.get('/', protect, membershipRoleController.getAllMemberships);

module.exports = router;