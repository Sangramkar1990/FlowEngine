const Membership = require('../models/Membership');
const User = require('../models/User'); // Import the User model
const Role = require('../models/Role'); // Import the Role model

// @desc    Get memberships for the current user
// @route   GET /api/memberships/me
// @access  Private
exports.getMemberships = async (req, res) => {
    // console.log("req.user", req.user);
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const memberships = await Membership.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    console.error('Error fetching memberships:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Search memberships by user name or email
// @route   GET /api/memberships/search
// @access  Private
exports.searchMemberships = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const memberships = await Membership.searchByUserNameOrEmail(query);
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get memberships by organization ID
// @route   GET /api/memberships/organization/:organizationId
// @access  Private (requires authorization)
exports.getMembershipsByOrganizationId = async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    let memberships = await Membership.findByOrganizationId(organizationId);

    // Fetch user data for each membership
    const membershipsWithUsers = await Promise.all(memberships.map(async (membership) => {
      const user = await User.findById(membership.user_id);
      return { ...membership, user: user ? { id: user.id, name: user.name, email: user.email } : null };
    }));

    res.status(200).json({ success: true, data: membershipsWithUsers });
  } catch (error) {
    console.error('Error fetching memberships by organization ID:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all memberships for a given organization from req.user
// @route   GET /api/memberships/organization/all
// @access  Private (requires authorization)
exports.getAllMembershipByOrganization = async (req, res) => {
  try {
    let organizationId = null;
    // if user is admin
    organizationId = req.user.organization_id;
    
   
      // return res.status(400).json({ success: false, message:  membership[0].organization_id });
    

    if (!organizationId) {
       const membership = await Membership.findByUserId(req.user.id);
      if(!membership || !membership[0].organization_id ){
        return res.status(403).json({ success: false, message: 'Unauthorized to view all memberships' });
      }
      else{
        organizationId = membership[0].organization_id;
      }
    }
    // return res.status(400).json({ success: false, message: organizationId });

    const memberships = await Membership.findAllMembershipsWithUserData(organizationId);
    // return res.status(300).json({ success: true, data: memberships});
    console.log("memberships:", memberships);
    const roles = await Role.findAll(organizationId);
    console.log("roles:", roles);
    const membershipsWithUsersAndRoles = await Promise.all(memberships.map(async (membership) => {
      const user = await User.findById(membership.user_id);
      console.log("user:", user);
      const role = roles.find(r => r.id === membership.role);
      console.log("filtered role:", role);
      return { ...membership, user: user ? { id: user.id, name: user.name, email: user.email, role: role ? { id: role.id, name: role.name } : null } : null };
    }));


    res.status(200).json({ success: true, data: membershipsWithUsersAndRoles, roles });
  } catch (error) {
    console.error('Error fetching all memberships by organization:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new membership
// @route   POST /api/memberships
// @access  Private
exports.createMembership = async (req, res) => {
  try {
    let { organizationId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!organizationId) {
      const userMemberships = await Membership.findByUserId(req.user.id);
      if (userMemberships && userMemberships.length > 0) {
        organizationId = userMemberships[0].organization_id;
      } else {
        return res.status(400).json({ success: false, message: 'Organization ID not provided and could not be determined from user memberships.' });
      }
    }

    const userRole = await Role.findByName('user', organizationId);

    if (!userRole) {
      return res.status(404).json({ success: false, message: 'User role not found for this organization' });
    }

    const newMembership = await Membership.create(userId, organizationId, userRole.id);

    res.status(201).json({ success: true, data: newMembership });
  } catch (error) {
    console.error('Error creating membership:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};