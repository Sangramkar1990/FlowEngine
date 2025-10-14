const express = require('express');
const { protect } = require('../middleware/auth');
const verifyToken = require('../middleware/verifyToken');
const {getUserStatistics , getAllTechniqueBreakdown} = require('../controllers/userController');

const router = express.Router();


router.get('/statistics', verifyToken, getUserStatistics);
router.get('/techniques/breakdown', verifyToken, getAllTechniqueBreakdown)
module.exports = router;