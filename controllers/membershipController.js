const Membership = require('../models/Membership');

// @desc    Get memberships for the current user
// @route   GET /api/memberships/me
// @access  Private
exports.getMemberships = async (req, res) => {
    console.log("req.user", req.user);
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