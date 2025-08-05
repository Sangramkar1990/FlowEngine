const express = require('express');
const Share = require('../models/Share');
//import share controller
const shareController = require('../controllers/shareController');
const verifyToken = require('../middleware/verifyToken');


const router = express.Router();

// POST /api/shares - create a new share
router.post('/', verifyToken, shareController.createShare);

// PUT /api/shares/:sequence_id - update share by sequence_id
router.put('/:share_id', verifyToken, shareController.updateShare);

// GET /api/shares/:sequence_id - get share by sequence_id
router.get('/:sequence_id', verifyToken, shareController.getShareBySequenceId);

module.exports = router;
