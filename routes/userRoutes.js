const express = require('express');
const { protect } = require('../middleware/auth');
const verifyToken = require('../middleware/verifyToken');
const {getUserStatistics , getAllTechniqueBreakdown} = require('../controllers/userController');

const router = express.Router();


router.get('/statistics', protect, getUserStatistics);
router.get('/techniques/breakdown', protect, getAllTechniqueBreakdown)
module.exports = router;