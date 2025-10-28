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
  searchCards, // Add this import
  getCardById ,
  deleteCard, // Add this import
  getCardsByUser ,// Add this import
  getUserSequencesAndShared,
  getFullSequences,
  storeFlowData, // Import new controller function
  getFlowData,    // Import new controller function
  updateFlowData  // Import new controller function
} = require('../controllers/sequenceController');

const { protect } = require('../middleware/auth');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// const testSequences = () => { 
// console.log('test sequences-------------1');
// }; 

// const testSequencesWithId = () => { 
//   console.log('test sequences ID-------------2');
//   }; 

// Search route
router.get('/search', searchSequences);

// User sequences route
router.get('/user', verifyToken, getUserSequences);

router.get('/full', getFullSequences);
// Flow data routes
router.route('/flows')
  .post(protect, storeFlowData); // Use protect middleware if authentication is required

router.route('/flows/:sequenceId')
  .get(getFlowData)
  .put(protect, updateFlowData); // Use protect middleware if authentication is required


// Main routes
router.route('/')
  .get( getSequences)
  .post(protect, createSequence);

router.route('/:id')
  .get(getSequence)
  .put(protect, updateSequence)
  .delete(protect, deleteSequence);

// Card creation route
router.post('/create-card', verifyToken, createCard);

// Card search route
router.get('/search/cards', searchCards);

// Get card by ID route
router.get('/card/:id', getCardById);

// Add this route for deleting a card
router.delete('/card/:id', verifyToken, deleteCard);

// Add this route to fetch cards by user ID
router.get('/cards/user', verifyToken, getCardsByUser);

// Full sequences route
// router.get('/full', getFullSequences);



// Main routes
router.route('/')
  .get( getSequences)
  .post(protect, createSequence);

router.route('/:id')
  .get(getSequence)
  .put(protect, updateSequence)
  .delete(protect, deleteSequence);

// Card creation route
router.post('/create-card', verifyToken, createCard);

// Card search route
router.get('/search/cards', searchCards);

// Get card by ID route
router.get('/card/:id', getCardById);

// Add this route for deleting a card
router.delete('/card/:id', verifyToken, deleteCard);

// Add this route to fetch cards by user ID
router.get('/cards/user', verifyToken, getCardsByUser);


router.get('user/test', verifyToken,getUserSequencesAndShared);
// ...existing code...

module.exports = router;