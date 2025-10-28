const User = require("../models/User");
const Organization = require("../models/Organization");
const InviteList = require("../models/InviteList");
const organizationService = require("../services/organizationService");
const InviteRequest = require("../models/inviteRequest");
const Role = require("../models/Role");
const Permission = require("../models/Permission"); // Added this line
const RolePermission = require("../models/RolePermission"); // Added this line
const Membership = require("../models/Membership");
// Helper function to generate a unique alphanumeric string
const generatePublicId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 24; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

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
    // console.log("body or register", { ...req.body });

    // Check if user already exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(409).json({
        success: false,
        created: false,
        message: "User already exists",
        errorType: "validation",
        field: "email",
      });
    }
    // console.log("test user register");

    if (userType === "organization") {
      //check if organization name unique.

      const isOrgNameNotUnique = await organizationService.checkUnique(
        organizationName
      );
      // console.log("is org name :", {isOrgNameUnique})
      if (isOrgNameNotUnique) {
        return res.status(409).json({
          success: false,
          created: false,
          message: "Organization name already exists",
          errorType: "validation",
          field: "organizationName",
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      dateOfBirth,
      rank,
      userType: "admin",
      organizationName,
      role_id: 1,
    });
    // console.log("user created, id :", { id: user.id });

    if (userType === "organization") {
      const publicId = generatePublicId(); // Generate unique publicId
      const organization = await Organization.create({
        organizationName,
        userId: user.id,
        publicId, // Pass publicId to Organization.create
      });
      await User.updateUserWithOrganization(user.id, organization.id);
    }

    res.status(201).json({
      success: true,
      created: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationName: user.organizationName,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorType: "server",
      field: null,
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
      return res.status(400).json({
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
    // return res.status(200).json({ success: true, data: req.user });
    if (!req.user.id)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const { password, ...userData } = req.user;
    const dobObj = new Date(userData.date_of_birth);
    userData.dateOfBirth = dobObj.toLocaleDateString("en-US");
    // Get components in UTC
    const year = dobObj.getUTCFullYear();
    const month = String(dobObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dobObj.getUTCDate()).padStart(2, "0");
    userData.DOB = `${year}-${month}-${day}`;
    const role = await Role.findById(req.user.role_id);
    const permission = await RolePermission.getPermissionsForRole(req.user.role_id);
    const membership = await Membership.findByUserId(req.user.id);

    userData.role = role?.name ? role.name : null;
    if (!req.user.organization_id) {
      res.status(200).json({
        success: true,
        data: {
          ...userData,
          id: req.user.id,
          role: role.name ? role.name : null,
          permissions: permission,
          membership: membership,
        },
      });
    } else {
      const organization = await Organization.findById(
        req.user.organization_id
      );

      userData.organization_name = organization?.name
        ? organization.name
        : null;
      userData.organization_public_id = organization?.public_id
        ? organization.public_id
        : null;

      res.status(200).json({
        success: true,
        data: {
          ...userData,
          id: req.user.id,
          role: role.name ? role.name : null,
          permissions: permission
        },
      });
    }
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
    authenticated: true,
    token,
  });
};

// @desc    Create organization and invite users
// @route   POST /api/organization/create
// @access  Private
exports.createOrganization = async (req, res) => {
  try {
    const { organizationName, emails } = req.body;
    const userId = req.user.id;
    // return res.status(200).json({ req: req.user.id});

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
    const publicId = generatePublicId(); // Generate unique publicId for createOrganization as well
    const organization = await Organization.create({
      organizationName,
      userId,
      publicId,
    });

    if (!organization || !organization.id) {
      throw new Error("Failed to create organization.");
    }

    // Fetch all permissions to map names to IDs
    const allPermissions = await Permission.findAll();
    const getPermissionId = (name) =>
      allPermissions.find((p) => p.name === name)?.id;

    const viewSequencePermId = getPermissionId("view_sequence");
    const manageSequencePermId = getPermissionId("manage_sequence");
    const shareSequencePermId = getPermissionId("share_sequence");
    const viewTeamsPermId = getPermissionId("view_teams");
    const manageTeamsPermId = getPermissionId("manage_teams");
    const viewTechniquesPermId = getPermissionId("view_techniques");
    const manageTechniquesPermId = getPermissionId("manage_techniques");
    const viewOrganizationPermId = getPermissionId("view_organization");
    const manageOrganizationPermId = getPermissionId("manage_organization");

    // Define permission arrays
    const userPermissions = [
      viewSequencePermId,
      viewTechniquesPermId,
      viewTeamsPermId,
      viewOrganizationPermId,
    ].filter(Boolean);
    const teamLeadPermissions = [
      viewSequencePermId,
      viewTechniquesPermId,
      viewTeamsPermId,
      viewOrganizationPermId,
      manageSequencePermId,
      manageTeamsPermId,
      shareSequencePermId,
    ].filter(Boolean);
    const adminPermissions = [
      viewSequencePermId,
      manageSequencePermId,
      shareSequencePermId,
      viewTeamsPermId,
      manageTeamsPermId,
      viewTechniquesPermId,
      manageTechniquesPermId,
      viewOrganizationPermId,
      manageOrganizationPermId,
    ].filter(Boolean);

    // Create roles for the organization
    const userRole = await Role.create({
      name: "user",
      organizationId: organization.id,
    });
    const teamLeadRole = await Role.create({
      name: "team lead",
      organizationId: organization.id,
    });
    const adminRole = await Role.create({
      name: "admin",
      organizationId: organization.id,
    });

    // Create role_permissions for the organization-specific roles
    if (userRole) {
      await RolePermission.create({
        role_id: userRole.id,
        permission_ids: userPermissions,
      });
    }
    if (teamLeadRole) {
      await RolePermission.create({
        role_id: teamLeadRole.id,
        permission_ids: teamLeadPermissions,
      });
    }
    if (adminRole) {
      await RolePermission.create({
        role_id: adminRole.id,
        permission_ids: adminPermissions,
      });
    }

    // 2. Update the user with the organization_id and the admin role_id
    await User.updateUserWithOrganization(
      userId,
      organization.id,
      organization.name,
      adminRole.id
    );

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

    

    let isoUTCDOB;

    if (dateOfBirth) {
      const updatedDOB = new Date(dateOfBirth);
      isoUTCDOB = updatedDOB.toISOString();
    }

    // const profile = await User.findById(userId);
    // return res.status(200).json({ success: true, data: profile });

    const updatedUser = await User.updateProfile(userId, {
      name,
      dateOfBirth,
      rank,
    });

    // return res.status(200).json({ success: true, data: updatedUser, inputDate : isoUTCDOB });

    const dobObj = new Date(updatedUser.date_of_birth);
    updatedUser.dateOfBirth = dobObj.toLocaleDateString("en-US");
    // Get components in UTC
    const year = dobObj.getUTCFullYear();
    const month = String(dobObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dobObj.getUTCDate()).padStart(2, "0");

    updatedUser.DOB = `${year}-${month}-${day}`;

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

// @desc    Check if organization name is unique
// @route   GET /api/organization/check-name
// @access  Public
exports.checkOrganizationName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    const isUnique = !(await organizationService.checkUnique(name));

    res.status(200).json({
      success: true,
      isUnique,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search organizations by name or public_id
// @route   GET /api/organization/search
// @access  Public
exports.searchOrganizations = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const userId = req.user.id;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required for search",
      });
    }

    const userRequests = await InviteRequest.findByUserId(userId);
    // console.log("user requests :", {userRequests})

    const organizations = await Organization.searchByNameOrPublicId(searchTerm);

    if (userRequests.length > 0 && organizations.length > 0) {
      const organizationsWithRequests = organizations.map((org) => {
        const matchingRequest = userRequests.find(
          (req) => req.organization_id === org.id
        );
        if (matchingRequest) {
          return { ...org, inviteRequest: matchingRequest };
        }
        return org;
      });
      return res.status(200).json({
        success: true,
        count: organizationsWithRequests.length,
        data: organizationsWithRequests,
      });
    }

    // console.log("org list", {organizations});

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
