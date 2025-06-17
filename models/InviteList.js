const pool = require('../config/database');

class InviteList {
  static async create(organizationId, emails) {
    const query = `
      INSERT INTO invite_lists (organization_id, emails)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [organizationId, emails]);
    return result.rows[0];
  }

  static async findByOrganizationId(organizationId) {
    const query = 'SELECT * FROM invite_lists WHERE organization_id = $1';
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  static async findOrganizationByEmail(email) {
    const query = 'SELECT organization_id FROM invite_lists WHERE $1 = ANY(emails)';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0].organization_id : false;
  }
}

module.exports = InviteList;