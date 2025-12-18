const express = require('express');
const { createInviteRequest, updateInviteRequestStatus, getInviteRequestsByOrganization, getInviteRequestsByUser, checkUserAndMembership, joinUserToOrganization } = require('../controllers/inviteRequestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createInviteRequest);
router.put('/:id/status', protect, updateInviteRequestStatus);
router.get('/organization/:organizationId', protect, getInviteRequestsByOrganization);
router.get('/user', protect, getInviteRequestsByUser);
router.get('/check-user', protect, checkUserAndMembership);
router.post('/join/:id', protect, joinUserToOrganization);

module.exports = router;