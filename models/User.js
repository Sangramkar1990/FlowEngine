const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Role = require('./Role');
const RolePermission = require('./RolePermission');
const Permission = require('./Permission');
const Membership = require('./Membership');

class User {
  static async create(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Determine the role_id based on userType or a default 'user' role
    let roleId = userData.role_id;
    if (!roleId) {
      const defaultRole = await Role.findByName('user');
      roleId = defaultRole ? defaultRole.id : null;
    }

    const query = `
      INSERT INTO users (name, email, password, date_of_birth, rank, organization_name, organization_id, role_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, date_of_birth, rank, organization_name, organization_id, role_id, created_at
    `;
    
    const values = [
      userData.name,
      userData.email,
      hashedPassword,
      userData.dateOfBirth || null,
      userData.rank?.toLowerCase() || null,
      userData.userType === 'organization' ? userData.organizationName : null,
      userData.organization_id || null,
      roleId
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

  

  

  static async updateUserWithOrganization(userId, organizationId, organizationName, roleId = null) {
    const query = `
      UPDATE users 
      SET organization_id = $1, organization_name = $3, role_id = $4, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, userId, organizationName, roleId]);
    // console.log("user update result", {result})
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

  static async updateProfile(userId, profileData) {
    const { name, isoUTCDOB, rank} = profileData;
    const query = `
      UPDATE users
      SET name = $1, date_of_birth = $2, rank = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, date_of_birth, rank, user_type, organization_name, organization_id, role_id;
    `;
    const values = [name, isoUTCDOB || null, rank?.toLowerCase() || null, userId];
    // return values;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(userId, newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const query = `
          UPDATE users 
          SET password = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
          RETURNING id, name, email;
      `;
      const result = await pool.query(query, [hashedPassword, userId]);
      return result.rows[0];
  }

  static async getPermissionsForUser(userId) {
    const user = await this.findById(userId);
    if (!user || !user.role_id) {
      return [];
    }

    const rolePermissions = await RolePermission.findOne({
      where: { role_id: user.role_id }
    });

    if (!rolePermissions || !rolePermissions.permission_ids || rolePermissions.permission_ids.length === 0) {
      return [];
    }

    const permissions = await Permission.findAll({
      where: {
        id: rolePermissions.permission_ids
      }
    });

    return permissions.map(p => p.name);
  }
   static async updateUserRole(userId, newRoleId) {
    const query = `
      UPDATE users
      SET role_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role_id;
    `;
    const result = await pool.query(query, [newRoleId, userId]);
    return result.rows[0];
  }

  static async findUserByEmailAndCheckMembership(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null; // User not found
    }

    const memberships = await Membership.findByUserId(user.id);
    if (memberships && memberships.length > 0) {
      return null; // User has existing memberships
    }

    return user; // User found, no existing memberships
  }
}

module.exports = User;