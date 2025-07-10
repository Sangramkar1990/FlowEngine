const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');

const teamController = {
  async createTeam(req, res) {
    try {
      const { name, organization_id, memberIds } = req.body;
      const team = await Team.create({ name, organization_id });
      if (memberIds && Array.isArray(memberIds)) {
        for (const membership_id of memberIds) {
          await TeamMember.add(team.id, membership_id);
        }
      }
      res.status(201).json(team);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateTeam(req, res) {
    try {
      const { id } = req.params;
      const { name, memberIds } = req.body;
      const team = await Team.update(id, { name });
      if (memberIds && Array.isArray(memberIds)) {
        // Remove all current members, then add new ones
        const currentMembers = await TeamMember.getMembers(id);
        for (const member of currentMembers) {
          await TeamMember.remove(id, member.membership_id);
        }
        for (const membership_id of memberIds) {
          await TeamMember.add(id, membership_id);
        }
      }
      res.json(team);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTeam(req, res) {
    try {
      const { id } = req.params;
      const team = await Team.getById(id);
      const members = await TeamMember.getMembers(id);
      res.json({ ...team, members });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTeamsByOrganization(req, res) {
    try {
      const { organization_id } = req.params;
      const teams = await Team.getByOrganization(organization_id);
      res.json(teams);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = teamController;
