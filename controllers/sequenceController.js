const sequenceService = require('../services/sequenceService');
const cardService = require('../services/cardService');

// @desc    Get all sequences
// @route   GET /api/sequences
// @access  Public
exports.getSequences = async (req, res) => {
  // return { test: true } ;
  try {

    // Add query parameters for filtering
    const { type, effective, user } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Build filters
    const filters = {};

    if (type) {
      filters.type = type;
    }

    if (effective) {
      filters.effective = effective;
    }

    if (user) {
      filters.user = user;
    }

    // Get sequences with pagination
    const result = await sequenceService.getSequences(filters, page, limit);

    res.status(200).json({
      success: true,
      count: result.sequences.length,
      pagination: result.pagination,
      data: result.sequences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single sequence
// @route   GET /api/sequences/:id
// @access  Public
exports.getSequence = async (req, res) => {
  // return{test: true};
  try {
    const sequence = await sequenceService.getSequence(req.params.id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    res.status(200).json({
      success: true,
      test: true,
      data: sequence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new sequence
// @route   POST /api/sequences
// @access  Private
exports.createSequence = async (req, res) => {
  try {
    const sequence = await sequenceService.createSequence(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: sequence
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all sequences
// @route   GET /api/sequences
// @access  Public
exports.getSequences = async (req, res) => {
  try {
    const { user } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filters = {};
    if (user) filters.user = user;

    const result = await sequenceService.getSequences(filters, page, limit);

    res.status(200).json({
      success: true,
      count: result.sequences.length,
      pagination: result.pagination,
      data: result.sequences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sequence by ID
// @route   GET /api/sequences/:id
// @access  Public
exports.getSequence = async (req, res) => {

  try {
    const sequence = await sequenceService.getSequence(req.params.id);
    // return false;

    
    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    // Get all cards for this sequence
    // const cards = await cardService.getSequenceCards(req.params.id);
    console.log("return sequence:" , {sequence: sequence.cards[1]});

    res.status(200).json({
      success: true,
      
      data: {
        ...sequence
        
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update sequence
// @route   PUT /api/sequences/:id
// @access  Private
exports.updateSequence = async (req, res) => {
  try {
    console.log("update sequence", {req : req.body.cards[0]});
    // Update sequence
    const sequence = await sequenceService.updateSequence(
      req.params.id,
      req.body,
      req.user.id
    );
    const sequence_get = await sequenceService.getSequence(req.params.id);

    res.status(200).json({
      success: true,
      data: sequence_get
    });
  } catch (error) {
    if (error.message === 'Sequence not found') {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    if (error.message === 'Not authorized to update this sequence') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this sequence'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete sequence
// @route   DELETE /api/sequences/:id
// @access  Private
exports.deleteSequence = async (req, res) => {
  try {
    // Delete sequence
    await sequenceService.deleteSequence(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (error.message === 'Sequence not found') {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    if (error.message === 'Not authorized to delete this sequence') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this sequence'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search sequences
// @route   GET /api/sequences/search
// @access  Public
exports.searchSequences = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search using OpenSearch
    const results = await sequenceService.searchSequences(
      query,
      parseInt(req.query.from) || 0,
      parseInt(req.query.size) || 10
    );

    res.status(200).json({
      success: true,
      count: results.hits.length,
      data: results.hits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sequences by user
// @route   GET /api/sequences/user/me
// @access  Private
exports.getUserSequences = async (req, res) => {
  try {
    // res.status(200).json({
    //   success: true,
    //   test: "test"
    // });
    const sequences = await sequenceService.getUserSequences(req.user.id);

    res.status(200).json({
      success: true,
      count: sequences.length,
      data: sequences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Get sequences by user
// @route   GET /api/sequences/user/:userId
// @access  Public
// exports.getUserSequences = async (req, res) => {
//   try {
//     const sequences = await sequenceService.getUserSequences(req.params.userId);

//     res.status(200).json({
//       success: true,
//       count: sequences.length,
//       data: sequences
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// @desc    Create new card
// @route   POST /api/sequences/create-card
// @access  Private
exports.createCard = async (req, res) => {
  try {
    const { video, name, type, effect, description, sequence_id } = req.body;

    // Validate required fields
    if (!name || !type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, type and description'
      });
    }

    const card = await cardService.createCard(
      {
        video,
        name,
        type,
        effect,
        description,
        sequence_id
      },
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: card
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search cards by name
// @route   GET /api/sequences/search/cards
// @access  Public
exports.searchCards = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await cardService.searchCardsByName(query, page, limit);

    res.status(200).json({
      success: true,
      count: result.cards.length,
      pagination: result.pagination,
      data: result.cards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Get card by ID
// @route   GET /api/sequences/card/:id
// @access  Public
exports.getCardById = async (req, res) => {
  try {
    const card = await cardService.getCard(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};