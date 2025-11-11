const Membership = require('../models/Membership');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Role = require('../models/Role');



// POST /api/memberships/role
exports.updateRole = async (req, res) => {
  try {
     
    const userId = req.user && req.user.id;
    const { organizationId, updates } = req.body;
    if (!userId || !organizationId || !Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    // Check if user is admin
    const user = await User.findById(userId);
    // return res.status(403).json({ success: false, message: user });
    if (!user || user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized (not admin)' });
    }
    // Check if user is owner of the organization
    const org = await Organization.findById(organizationId);
    // return res.status(403).json({ success: false, message: org});
    if (!org || String(org.owner_user_id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized (not org owner)' });
    }
    // Update all memberships
    const results = [];
    for (const item of updates) {
      const { memberId, role } = item;
    //   return res.status(400).json({ success: false, mermberId:!memberId, role: !['user', 'teamLeader'].includes(role) });
       
      if (!memberId || !['user', 'teamleader'].includes(role)) {
        results.push({ memberId, success: false, message: 'Invalid data' });
        continue;
      }
       
      try {
       
        const updated = await Membership.updateRole(memberId, role);
        // console.log("Updating role for member:", { memberId, role, updated });
        
        if (updated) {
          results.push({ memberId, success: true, role });
        } else {
          results.push({ memberId, success: false, message: 'Membership not found' });
        }
        return res.json({ success: true, updated });
      } catch (err) {
        results.push({ memberId, success: false, message: err.message });
      }
    }
    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/memberships
exports.getAllMemberships = async (req, res) => {
  try {
    // Optionally, you can restrict this to admins/org owners
    const memberships = await Membership.findAllWithUser();
    return res.json({ success: true, memberships });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Update a user's role in an organization
// @route   PUT /api/memberships/user-role/:userId
// @access  Private (requires authorization and admin/owner)
exports.updateUserMembershipRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const requestingUserId = req.user.id;

    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'User ID and Role ID are required' });
    }

    // Verify requesting user is authorized (e.g., admin or organization owner)
    // const requestingUser = await User.findById(requestingUserId);
    // if (!requestingUser || requestingUser.user_type !== 'admin') { // Assuming 'admin' can change roles
    //   return res.status(403).json({ success: false, message: 'Not authorized to change user roles' });
    // }

    // Optionally, check if the requesting user is the owner of the organization the target user belongs to
    const targetUser = await User.findById(userId);
    const membership = await Membership.findByUserId(userId);
    // return res.status(403).json({ success: false, membership:membership , user: targetUser});
    if (!targetUser || !membership[0].organization_id) {
      return res.status(404).json({ success: false, message: 'Target user or their organization not found' });
    }

    const organization = await Organization.findById(targetUser.organization_id);
    // if (!organization || String(organization.owner_user_id) !== String(requestingUserId)) {
    //   return res.status(403).json({ success: false, message: 'Not authorized to change roles in this organization' });
    // }

    const updatedUser = await User.updateUserRole(userId, roleId);

    if (updatedUser) {
      return res.status(200).json({ success: true, data: updatedUser, message: 'User role updated successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'User not found or role not updated' });
    }
  } catch (error) {
    console.error('Error updating user role:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
