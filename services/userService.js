const searchService = require('./searchService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
