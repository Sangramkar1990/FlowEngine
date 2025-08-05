const pool = require('../config/database');

class Share {
  static async create({ sequence_id, name, entire_org = true, organization_id, team_ids = [] }) {
    const query = `
      INSERT INTO shares (sequence_id, name, entire_org, organization_id, team_ids)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [sequence_id, name, entire_org, organization_id, team_ids]);
    return result.rows[0];
  }

  static async findBySequenceId(sequence_id) {
    const query = 'SELECT * FROM shares WHERE sequence_id = $1';
    const result = await pool.query(query, [sequence_id]);
    return result.rows[0];
  }

  // get share by team_id
  static async findByTeamId(team_id) {
    const query = 'SELECT * FROM shares WHERE team_ids @> $1';
    const result = await pool.query(query, [[team_id]]);
    return result.rows;
  }

  static async updateByShareId(sequence_id, data) {
    const { name, entire_org, team_ids } = data;
    const query = `
      UPDATE shares
      SET name = $1, entire_org = $2, team_ids = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [name, entire_org, team_ids, sequence_id]);
    return result.rows[0];
  }
}

module.exports = Share;
