const express = require('express');
const {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
  searchSequences,
  getUserSequences
} = require('../controllers/sequenceController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Search route
router.get('/search', searchSequences);

// User sequences route
router.get('/user/:userId', getUserSequences);

// Main routes
router.route('/')
  .get(getSequences)
  .post(protect, createSequence);

router.route('/:id')
  .get(getSequence)
  .put(protect, updateSequence)
  .delete(protect, deleteSequence);

module.exports = router;
