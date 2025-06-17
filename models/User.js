const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static async create(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const query = `
      INSERT INTO users (name, email, password, date_of_birth, rank, user_type, organization_name, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, date_of_birth, rank, user_type, organization_name, organization_id, created_at
    `;
    
    const values = [
      userData.name,
      userData.email,
      hashedPassword,
      userData.dateOfBirth || null,
      userData.rank?.toLowerCase() || null,
      userData.userType,
      userData.userType === 'organization' ? userData.organizationName : null,
      userData.organization_id || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async updateUserWithOrganization(userId, organizationId) {
    const query = `
      UPDATE users 
      SET organization_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, userId]);
    return result.rows[0];
  }

  static async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  static getSignedJwtToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  static async getOrganizationInfoFromUserId(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        console.error('User not found for organization details check');
        return false;
      }

      if (user.organization_id) {
        const Organization = require('./Organization');
        const organization = await Organization.findById(user.organization_id);
        if (organization && organization.name) {
          return { name: organization.name, id: user.organization_id };
        }
        console.warn(`Organization not found for ID: ${user.organization_id}`);
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error processing user for organization info:', error.message);
      return false;
    }
  }
}

module.exports = User;