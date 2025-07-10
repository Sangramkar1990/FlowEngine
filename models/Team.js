const db = require('../config/database');

const Team = {
  async create({ name, organization_id }) {
    const result = await db.query(
      'INSERT INTO teams (name, organization_id) VALUES ($1, $2) RETURNING *',
      [name, organization_id]
    );
    return result.rows[0];
  },

  async update(id, { name }) {
    const result = await db.query(
      'UPDATE teams SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  },

  async getById(id) {
    const result = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0];
  },

  async getByOrganization(organization_id) {
    const result = await db.query('SELECT * FROM teams WHERE organization_id = $1', [organization_id]);
    return result.rows;
  },
};

module.exports = Team;
