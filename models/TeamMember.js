const db = require('../config/database');

const TeamMember = {
  async add(team_id, membership_id) {
    const result = await db.query(
      'INSERT INTO team_members (team_id, membership_id) VALUES ($1, $2) ON CONFLICT (team_id, membership_id) DO NOTHING RETURNING *',
      [team_id, membership_id]
    );
    return result.rows[0];
  },

  async remove(team_id, membership_id) {
    await db.query(
      'DELETE FROM team_members WHERE team_id = $1 AND membership_id = $2',
      [team_id, membership_id]
    );
    return true;
  },

  async getMembers(team_id) {
    const result = await db.query(
      `SELECT tm.*, m.user_id, m.role, u.name, u.email
       FROM team_members tm
       JOIN memberships m ON tm.membership_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE tm.team_id = $1`,
      [team_id]
    );
    return result.rows;
  },

  // get team membership by membership_id
  async findByMembershipId(membership_id) {
    const result = await db.query(
      'SELECT * FROM memberships WHERE id = $1',
      [membership_id]
    );
    return result.rows[0];
  },

  async getTeamsForMembership(membership_id) {
    const result = await db.query(
      'SELECT * FROM team_members WHERE membership_id = $1',
      [membership_id]
    );
    return result.rows;
  },
};

module.exports = TeamMember;
