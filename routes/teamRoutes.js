const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.get('/:id', teamController.getTeam);
router.get('/organization/:organization_id', teamController.getTeamsByOrganization);

module.exports = router;
