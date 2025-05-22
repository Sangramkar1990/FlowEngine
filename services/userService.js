const searchService = require('./searchService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const organizationService = require('./organizationService'); // Added: Make sure this path is correct

class UserService {
  constructor() {
    this.indexName = 'users';
  }

  /**
   * Initialize the users index
   */
  async initIndex() {
    const userMapping = {
      properties: {
        name: { type: 'text' },
        email: { type: 'keyword' },
        password: { type: 'keyword' },
        dateOfBirth: { type: 'date' },
        rank: { type: 'keyword' },
        userType: { type: 'keyword' },
        organizationName: { type: 'text' },
        organization_id: { type: 'keyword' }, // Added organization_id
        createdAt: { type: 'date' }
      }
    };

    return searchService.createIndex(this.indexName, userMapping);
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   */
  async findById(id) {
    return searchService.getDocument(this.indexName, id);
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   */
  async findByEmail(email) {
    const result = await searchService.findDocuments(
      this.indexName,
      {
        term: {
          email: email
        }
      },
      0,
      1
    );

    return result.hits.length > 0 ? result.hits[0] : null;
  }

  /**
   * Create a new user
   * @param {object} userData - User data
   */
  async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString() : undefined,
      rank: userData.rank ? userData.rank.toLowerCase() : undefined,
      userType: userData.userType,
      organizationName: userData.userType === 'organization' ? userData.organizationName : undefined,
      organization_id: userData.organization_id ? userData.organization_id : undefined, // Added organization_id
      createdAt: new Date().toISOString()
    };

    const result = await searchService.indexDocument(this.indexName, user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: result._id
    };
  }

  /**
   * Update a user with an organization ID
   * @param {string} userId - User ID
   * @param {string} organization_id - Organization ID
   */
  async updateUserWithOrganization(userId, organization_id) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUserData = {
      organization_id: organization_id,
      // organizationName will be set if userType is 'organization' during creation
      // or could be updated here if needed based on the organization details
    };

    // If the user is the owner, their userType might already be 'organization'
    // or you might want to ensure it's set correctly.
    // For now, just updating the organization_id.
    // if (user.userType !== 'organization' && organization_id) {
    //   updatedUserData.userType = 'organization_member'; // Or some other relevant type
    // }


    return searchService.updateDocument(this.indexName, userId, updatedUserData);
  }

  /**
   * Decrypts token, finds user, and returns organization name or false.
   * @param {string} token - JWT token
   */
  async getOrganizationInfoFromUserId(userId) {
    // if (!token) {
    //   console.error('Token not provided for organization info');
    //   return false;
    // }

    try {
      // Verify token - Ensure JWT_SECRET is available in your environment variables
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // const userId = decoded.id;

      const user = await this.findById(userId);
      if (!user) {
        console.error('User not found from token for organization details check');
        return false;
      }
      // console.log('user', user);
      // return user;

      if (user.organization_id) {
        const organization = await organizationService.findById(user.organization_id);
        if (organization && organization.name) {
          return { name: organization.name, id: user.organization_id };
        }
        console.warn(`Organization not found for ID: ${user.organization_id} or name is missing (from token)`);
        return false; // Org ID present but org not found or name missing
      }
      return false; // No organization_id
    } catch (error) {
      console.error('Error processing token for organization info:', error.message);
      // Handles invalid token, expired token, etc.
      return false;
    }
  }

  /**
   * Match password
   * @param {string} enteredPassword - Password to check
   * @param {string} hashedPassword - Stored hashed password
   */
  async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   */
  getSignedJwtToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }
}

module.exports = new UserService();
