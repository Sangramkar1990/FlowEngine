const InviteRequest = require('../models/inviteRequest');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const Role = require('../models/Role'); // Import the Role model
const User = require('../models/User'); // Import the User model
// @desc    Create an invite request
// @route   POST /api/invite-requests
// @access  Private
exports.createInviteRequest = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const  userId  = req.user.id;
    const inviteRequest = await InviteRequest.create(organizationId, userId);
    res.status(201).json({ success: true, data: inviteRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if user exists and has no membership
// @route   GET /api/invite-requests/check-user
// @access  Private
exports.checkUserAndMembership = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findUserByEmailAndCheckMembership(email);

    if (user) {
      res.status(200).json({ success: true, data: user });
    } else {
      res.status(200).json({ success: false, message: 'User not found or already has a membership' });
    }
  } catch (error) {
    console.error('Error checking user and membership:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update invite request status
// @route   PUT /api/invite-requests/:id/status
// @access  Private
exports.updateInviteRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const inviteRequest = await InviteRequest.findById(id);
    if (!inviteRequest) {
      return res.status(404).json({success: false, message: 'Invite request not found' });
    }

    const organization = await Organization.findById(inviteRequest.organization_id);
    if (!organization || organization.owner_user_id !== req.user.id) {
      return res.status(403).json({success: false, message: 'Unauthorized to update this invite request' });
    }

    const updatedRequest = await InviteRequest.updateStatus(id, status);

    const updatedRoleForUser = await Role.findByName('user', inviteRequest.organization_id);
    console.log("updatedRoleForUser", {updatedRoleForUser});


    if (status === 2) {
      // Create a membership if the invite request is approved
     const updatedmember =  await Membership.create(inviteRequest.user_id, inviteRequest.organization_id, 'user');
     await User.updateUserRole(inviteRequest.user_id, updatedRoleForUser.id);

     res.json({success: true, data: updatedmember}); 
    }

    
  } catch (error) {
    console.error('Error updating invite request status:', error);
    res.status(500).json({ success: false ,message: 'Server error' });
  }
};

// @desc    Get invite requests by organization ID
// @route   GET /api/invite-requests/organization/:organizationId
// @access  Private
exports.getInviteRequestsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const inviteRequests = await InviteRequest.findByOrganizationId(organizationId);
    res.status(200).json({ success: true, data: inviteRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invite requests by user ID
// @route   GET /api/invite-requests/user/:userId
// @access  Private
exports.getInviteRequestsByUser = async (req, res) => {
  try {
    const  userId  = req.user.id;
    const {user} = req;
    // console.log("user data", {user: user.organization_id});
    // check if user is owner of an organization
    let inviteRequests;
    if(user.organization_id){
        inviteRequests = await InviteRequest.findByOrganizationId(user.organization_id);
        // console.log("invites to org", {inviteRequests});
        res.status(200).json({ success: true, data: inviteRequests });
    }
    else {
        res.status(200).json({ success: true, data: false });
    }
   
   
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};