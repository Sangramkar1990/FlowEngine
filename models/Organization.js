const pool = require('../config/database');

class Organization {
  static async create(organizationData) {
    const query = `
      INSERT INTO organizations (name, owner_user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [
      organizationData.organizationName,
      organizationData.userId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM organizations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

module.exports = Organization;