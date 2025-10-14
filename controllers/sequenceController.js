const sequenceService = require('../services/sequenceService');
const cardService = require('../services/cardService');
// import Share model
const Share = require('../models/Share');
const Membership = require('../models/Membership');
const TeamMember = require('../models/TeamMember');
const Team = require('../models/Team');


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

    // console.log("result:", result);

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
exports.getSequenceTest = async (req, res) => {
  // return{test: true};
  try {
    const sequence = await sequenceService.getSequence(req.params.id);

    res.status(200).json({sequence: sequence});


    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    const card = await cardService.getBySequenceId(req.params.id);

  const response = {
    success: true,
    test: true,
    data: sequence,
    cardPresent: card != null,          // boolean flag
    ...(card ? { share: card.share } : {}) // add share only if card exists
  };

  res.status(200).json(response);

    // res.status(200).json({
    //   success: true,
    //   test: true,
    //   data: sequence
    // });
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

    // console.log("user:", {user: req.user.id});

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
    // console.log("return sequence:" , {sequence: sequence.cards[1]});

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
    // console.log("update sequence", {req : req.body.cards});
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
    console.log("sequences:", sequences);
    // get membership id by user_id
    const membership = await Membership.findByUserId(req.user.id);
    if (membership || membership.length !== 0) {
      let membershipId = membership[0].id;

      // get team Id from teamMember model using membershipId
      const teamMember = await TeamMember.findByMembershipId(membershipId);
      if (teamMember && teamMember.length > 0) {

        let teamId = teamMember[0].team_id;
        // get shares by team_id
        const shares = await Share.findByTeamId(teamId);
        if (shares && shares.length > 0) {
           console.log("shares:", shares);
        
        console.log("team id:", teamMember[0].team_id);
      // console.log("membership:", membership[0].id);
        }
      }

    }



    // console.log("memberships:", membership.id);

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
// @desc    Delete card
// @route   DELETE /api/sequences/card/:id
// @access  Private
exports.deleteCard = async (req, res) => {
  try {
    // console.log("user id:", {user: req.user.id});
    await cardService.deleteCard(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    if (error.message === 'Card not found') {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    if (error.message === 'Not authorized to delete this card') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this card' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get cards by user
// @route   GET /api/sequences/cards/user/me
// @access  Private
exports.getCardsByUser = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from token
        const cards = await cardService.getCardByUser(userId);
        res.status(200).json({
            success: true,
            data: cards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// 1. User Sequences API
exports.getUserSequencesAndShared = async (req, res) => {
  try{

      
  const userId = req.params.userId;
  // Get memberships for user
  const memberships = await Membership.findByUserId(userId);

  let sharedSequences = [];
  for (const membership of memberships) {
    const teamMemberships = await TeamMember.getTeamsForMembership(membership.id);
    for (const tm of teamMemberships) {
      const team_id = tm.team_id;
      const shares = await Share.findByTeamId(team_id);
      for (const share of shares) {
        const sequence = await sequenceService.getSequence(share.sequence_id);
        // Get team name if needed
        let groupName = team_id;
        if (Team && Team.getById) {
          const team = await Team.getById(team_id);
          groupName = team ? team.name : team_id;
        }
        sharedSequences.push({
          ...sequence,
          share: true,
          groupName
        });
      }
    }
  }
   // Sequences created by user
  const createdSequences = await sequenceService.getUserSequences(userId);
  const createdFormatted = createdSequences.map(seq => ({
    ...seq,
    share: false
  }));

  // Merge and deduplicate by sequence id
  const allSequences = [...createdFormatted, ...sharedSequences];
  const uniqueSequences = [];
  const seen = new Set();
  for (const seq of allSequences) {
    if (!seen.has(seq.id)) {
      uniqueSequences.push(seq);
      seen.add(seq.id);
    }
  }

  res.json(uniqueSequences);

  }
  catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
  
}
}
