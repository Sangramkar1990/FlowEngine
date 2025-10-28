const Membership = require('../models/Membership');
const User = require('../models/User'); // Import the User model

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