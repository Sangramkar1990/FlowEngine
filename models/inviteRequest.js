const pool = require('../config/database');

class InviteRequest {
  static async create(organizationId, userId, ) {
    const query = `
      INSERT INTO invite_requests (organization_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [organizationId, userId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM invite_requests WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByOrganizationId(organizationId) {
    const query = `
      SELECT
        ir.*,
        o.name AS organization_name,
        u.email AS user_email
      FROM invite_requests ir
      JOIN organizations o ON ir.organization_id = o.id
      JOIN users u ON ir.user_id = u.id
      WHERE ir.organization_id = $1
      AND ir.status = 1
    `;
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE invite_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT ir.*, o.name AS organization_name
      FROM invite_requests ir
      JOIN organizations o ON ir.organization_id = o.id
      WHERE ir.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = InviteRequest;