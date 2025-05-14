const userService = require('../services/userService');
const organizationService = require('../services/organizationService');
const inviteListService = require('../services/inviteListService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, rank, userType, organizationName } = req.body;

    // Check if user already exists
    const userExists = await userService.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await userService.create({
      name,
      email,
      password,
      dateOfBirth,
      rank,
      userType,
      organizationName
    });
// Simulating user type check
if (userType === "organization") {
  return res.json({ redirectTo: "create-organization", userId: user.id });
}

    sendTokenResponse(user.id, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await userService.matchPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    

    sendTokenResponse(user.id, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't return password
    const { password, ...userData } = user;

    res.status(200).json({
      success: true,
      data: { ...userData, id: req.user.id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (userId, statusCode, res) => {
  // Create token
  const token = userService.getSignedJwtToken(userId);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Use secure flag in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
    });
};

// @desc    Create organization and invite users
// @route   POST /api/organization/create
// @access  Private (should be protected in routes)
exports.createOrganization = async (req, res) => {
  try {
    const { organizationName, emails, userId } = req.body;

    // Validate input
    if (!organizationName || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Organization name and userId are required.'
      });
    }

    // Split emails into array and trim whitespace
    const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

    // 1. Create the organization
    const organization = await organizationService.create({
      organizationName,
      userId // This userId is the owner
    });

    if (!organization || !organization.id) {
      throw new Error('Failed to create organization.');
    }

    // 2. Update the user (owner) with the organization_id
    await userService.updateUserWithOrganization(userId, organization.id);

    // 3. Create the invite list if emails are provided
    let invitedEmailsList;
    if (emailList.length > 0) {
      invitedEmailsList = await inviteListService.create(organization.id, emailList);
    }

    res.status(201).json({
      success: true,
      message: 'Organization created successfully. Invitations processed.',
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        ownerUserId: organization.owner_userId,
        invitedEmails: emailList, // or invitedEmailsList.emails if you prefer data from DB
        inviteListId: invitedEmailsList ? invitedEmailsList.id : null
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error); // Log the error
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during organization creation.'
    });
  }
};

// Added: New function to get user organization status
exports.getUserOrganizationStatus = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) { // If you use cookies for tokens
       token = req.cookies.token;
    }


    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // userService should already be imported at the top of the file
    const result = await userService.getOrganizationInfoFromToken(token);

    if (result && result.name) {
      res.status(200).json({ success: true, data: { organizationName: result.name } });
    } else {
      // Send success true but with organizationName as false for "Individual"
      res.status(200).json({ success: true, data: { organizationName: false } });
    }
  } catch (error) {
    console.error('Controller error getting organization status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
