const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Membership = require('../models/Membership'); // Import Membership model
const ErrorResponse = require('../utils/errorResponse');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    req.user = user;
    req.user.membershipId = decoded.membershipId; // Attach membershipId to req.user

    // Fetch membership details and attach organization_id
    if (decoded.membershipId) {
      const membership = await Membership.findById(decoded.membershipId);
      if (membership) {
        req.membership = membership; // Attach full membership object
        req.organizationId = membership.organization_id; // Attach organization_id directly
      } else {
        // Handle case where membership is not found (e.g., deleted)
        return next(new ErrorResponse('Membership not found', 401));
      }
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};