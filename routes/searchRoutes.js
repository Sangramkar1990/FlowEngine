const express = require('express');
const { 
  search, 
  indexDocument, 
  updateDocument, 
  deleteDocument, 
  createIndex 
} = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:index', search);

// Protected routes
router.post('/index/:index', protect, createIndex);
router.post('/:index', protect, indexDocument);
router.put('/:index/:id', protect, updateDocument);
router.delete('/:index/:id', protect, deleteDocument);

module.exports = router;
