const Membership = require('../models/Membership');
const TeamMember = require('../models/TeamMember');
const Share = require('../models/Share');
const sequenceService = require('../services/sequenceService');
const Team = require('../models/Team'); 
const cardService = require('../services/cardService');


exports.getUserStatistics = async (req, res) => {
const userId = req.user.id; 

  const memberships = await Membership.findByUserId(userId);

  try {
    let sequenceIds = new Set();
  let totalCards = 0;

  for (const membership of memberships) {
    const teamMemberships = await TeamMember.getTeamsForMembership(membership.id);
    for (const tm of teamMemberships) {
      const team_id = tm.team_id;
    //   return res.json({team_id});
      const shares = await Share.findByTeamId(team_id);
      
      for (const share of shares) {
        sequenceIds.add(share.sequence_id);
      }
    }
  }

  // Sequences created by user
//   const createdSequences = await sequenceService.getUserSequences(userId);
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
    const createdSequences = await sequenceService.getSequences(filters, page, limit);
    // return res.json({createdSequences});
  
  for (const seq of createdSequences.sequences) {
    sequenceIds.add(seq.id);
  }

  // Count cards in all sequences
  
    const cards = await cardService.getTotalCardCount();
    
    totalCards = cards;

    const allCards = await cardService.techniquebreakdown();
    const typeCounts = allCards.reduce((acc, card) => {
      const type = card.type;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});

    let mostUsedTechnique = null;
    let maxCount = 0;

    for (const type in typeCounts) {
      if (typeCounts[type] > maxCount) {
        mostUsedTechnique = type;
        maxCount = typeCounts[type];
      }
    }
  

  res.json({
    totalSequences: sequenceIds.size,
    totalCards,
    mostUsedTechnique
    // Add more stats here later
  });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ 
        error: 'Internal server error' , 
        success: false,
        message: error.message});
  }
}

exports.getAllTechniqueBreakdown = async (req, res) => {
  try {
    const cards = await cardService.techniquebreakdown();
    const typeCounts = cards.reduce((acc, card) => {
      const type = card.type;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});
    res.json(typeCounts);
  } catch (error) {
    console.error('Error fetching all technique breakdown:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
      message: error.message
    });
  }
};