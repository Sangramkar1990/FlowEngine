const express = require('express');
const {
  getSequences,
  getSequence,
  createSequence,
  updateSequence,
  deleteSequence,
  searchSequences,
  getUserSequences,
  createCard,
  searchCards // Add this import
} = require('../controllers/sequenceController');

const { protect } = require('../middleware/auth');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Search route
router.get('/search', searchSequences);

// User sequences route
router.get('/user/me', verifyToken, getUserSequences);

// Main routes
router.route('/')
  .get(getSequences)
  .post(protect, createSequence);

router.route('/:id')
  .get(getSequence)
  .put(protect, updateSequence)
  .delete(protect, deleteSequence);

// Card creation route
router.post('/create-card', verifyToken, createCard);

// Card search route
router.get('/search/cards', searchCards);

module.exports = router;
