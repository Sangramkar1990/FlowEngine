const User = require("../models/User");
const Organization = require("../models/Organization");
const InviteList = require("../models/InviteList");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      rank,
      userType,
      organizationName,
    } = req.body;
    console.log("body or register", { ...req.body });

    // Check if user already exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    console.log("test user register");

    // Check if email exists in any invite list
    const invitedOrgId = await InviteList.findOrganizationByEmail(email);
    let finalUserType = userType;
    let organization_id = undefined;

    console.log("got if org id");

    if (invitedOrgId) {
      finalUserType = "organization";
      organization_id = invitedOrgId;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      dateOfBirth,
      rank,
      userType: finalUserType,
      organizationName,
      organization_id,
    });
    console.log("user created");

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

    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide an email and password",
        });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await User.matchPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
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
    if (!req.user.id)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const organization = await Organization.findById(req.user.organization_id);

    const { password, ...userData } = req.user;
    userData.organization_name = organization?.name ? organization.name : null;
    const dobObj = new Date(userData.date_of_birth);
    userData.dateOfBirth = dobObj.toLocaleDateString("en-US");
    // Get components in UTC
    const year = dobObj.getUTCFullYear();
    const month = String(dobObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dobObj.getUTCDate()).padStart(2, "0");

    userData.DOB = `${year}-${month}-${day}`;
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
  res.cookie("token", "none", {
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
  const token = User.getSignedJwtToken(userId);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

// @desc    Create organization and invite users
// @route   POST /api/organization/create
// @access  Private
exports.createOrganization = async (req, res) => {
  try {
    const { organizationName, emails, userId } = req.body;

    if (!organizationName || !userId) {
      return res.status(400).json({
        success: false,
        message: "Organization name and userId are required.",
      });
    }

    const emailList = emails
      ? emails
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email)
      : [];

    // 1. Create the organization
    const organization = await Organization.create({
      organizationName,
      userId,
    });

    if (!organization || !organization.id) {
      throw new Error("Failed to create organization.");
    }

    // 2. Update the user with the organization_id
    await User.updateUserWithOrganization(userId, organization.id);

    // 3. Filter out emails that exist in invite lists or are already registered users
    let filteredEmailList = [];
    if (emailList.length > 0) {
      filteredEmailList = await Promise.all(
        emailList.map(async (email) => {
          const invitedOrgId = await InviteList.findOrganizationByEmail(email);
          if (invitedOrgId) {
            return null;
          }

          const existingUser = await User.findByEmail(email);
          if (existingUser) {
            return null;
          }

          return email;
        })
      );
      filteredEmailList = filteredEmailList.filter((email) => email !== null);
    }

    // 4. Create invite list if there are valid emails
    let invitedEmailsList = null;
    if (filteredEmailList.length > 0) {
      invitedEmailsList = await InviteList.create(
        organization.id,
        filteredEmailList
      );
    }

    res.status(201).json({
      success: true,
      data: {
        organization,
        invitedEmails: invitedEmailsList ? invitedEmailsList.emails : [],
        skippedEmails: emailList.length - (filteredEmailList?.length || 0),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get organization info
// @route   GET /api/organization/info
// @access  Private
exports.getOrganizationInfo = async (req, res) => {
  try {
    const result = await User.getOrganizationInfoFromUserId(req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No organization found for this user",
      });
    }

    const inviteList = await InviteList.findByOrganizationId(result.id);

    res.status(200).json({
      success: true,
      data: {
        organization: result,
        inviteList: inviteList,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await User.matchPassword(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const updatedUser = await User.updatePassword(userId, newPassword);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, dateOfBirth, rank } = req.body;

    const updatedUser = await User.updateProfile(userId, {
      name,
      dateOfBirth,
      rank,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
