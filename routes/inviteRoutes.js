const express = require('express');
const { createInviteRequest, updateInviteRequestStatus, getInviteRequestsByOrganization, getInviteRequestsByUser } = require('../controllers/inviteRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createInviteRequest);
router.put('/:id/status', protect, updateInviteRequestStatus);
router.get('/organization/:organizationId', protect, getInviteRequestsByOrganization);
router.get('/user', protect, getInviteRequestsByUser);

module.exports = router;