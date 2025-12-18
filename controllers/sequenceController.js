const sequenceService = require("../services/sequenceService");
const cardService = require("../services/cardService");
const flowService = require("../services/flowService"); // Import flowService
// import Share model
const Share = require("../models/Share");
const Membership = require("../models/Membership");
const TeamMember = require("../models/TeamMember");
const Team = require("../models/Team");

// @desc    Get all sequences
// @route   GET /api/sequences
// @access  Public
// exports.getSequences = async (req, res) => {
//   // return { test: true } ;
//   try {
//     // Add query parameters for filtering
//     const userId = req.user.id;
//     return userId;
//     const { type, effective, user } = req.query;
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;

//     // Build filters
//     const filters = {};

//     if (type) {
//       filters.type = type;
//     }

//     if (effective) {
//       filters.effective = effective;
//     }

//     if (user) {
//       filters.user = user;
//     }

//     // Get sequences with pagination
//     const result = await sequenceService.getSequences(filters, page, limit, userId);

//     return res.status(200).json({result});

//     // console.log("result:", result);

//     // res.status(200).json({
//     //   success: true,
//     //   count: result.sequences.length,
//     //   pagination: result.pagination,
//     //   data: result.sequences,
//     // });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// @desc    Get single sequence
// @route   GET /api/sequences/:id
// @access  Public
exports.getSequenceTest = async (req, res) => {
  // return{test: true};
  try {
    const sequence = await sequenceService.getSequence(req.params.id);

    res.status(200).json({ sequence: sequence });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: "Sequence not found",
      });
    }

    const card = await cardService.getBySequenceId(req.params.id);

    const response = {
      success: true,
      test: true,
      data: sequence,
      cardPresent: card != null, // boolean flag
      ...(card ? { share: card.share } : {}), // add share only if card exists
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
      message: error.message,
    });
  }
};

// @desc    Create new sequence
// @route   POST /api/sequences
// @access  Private
exports.createSequence = async (req, res) => {
  try {
    const userId = req.user.id;

    const membership = await Membership.findByUserId(userId);

    console.log("membership create sequence:", membership);

    let organization_id = null;

    if (membership && membership.length !== 0) {
      organization_id = membership[0].organization_id;
    }
    const sequence = await sequenceService.createSequence(
      req.body,
      organization_id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: sequence,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all sequences
// @route   GET /api/sequences
// @access  Public
exports.getSequences_old = async (req, res) => {
  try {
    const { user } = req.query;
    const userId = req.user.id;
    // return res.status(200).json({user: req.user.id});
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filters = {};
    if (user) filters.user = user;

    // console.log("user:", {user: req.user.id});

    const result = await sequenceService.getSequences(
      filters,
      page,
      limit,
      userId
    );

    //  return res.status(200).json({user: result});

    res.status(200).json({
      success: true,
      count: result.sequences.length,
      pagination: result.pagination,
      data: result.sequences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Sequence not found",
      });
    }

    // Get all cards for this sequence
    // const cards = await cardService.getSequenceCards(req.params.id);
    // console.log("return sequence:" , {sequence: sequence.cards[1]});

    res.status(200).json({
      success: true,

      data: {
        ...sequence,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      data: sequence_get,
    });
  } catch (error) {
    if (error.message === "Sequence not found") {
      return res.status(404).json({
        success: false,
        message: "Sequence not found",
      });
    }

    if (error.message === "Not authorized to update this sequence") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this sequence",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
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
      data: {},
    });
  } catch (error) {
    if (error.message === "Sequence not found") {
      return res.status(404).json({
        success: false,
        message: "Sequence not found",
      });
    }

    if (error.message === "Not authorized to delete this sequence") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this sequence",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
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
        message: "Search query is required",
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
      data: results.hits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      data: sequences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
    const { video, name, type, effect, description, sequence_id, difficulty } =
      req.body;
      console.log("req.body:", req.user.membershipId);

    const userId = req.user.id;
    const userMembershipId = req.user.membershipId;

    const membership = await Membership.findById(userMembershipId);
    if(membership){

      console.log("membership found:", membership);
       let organization_id = membership.organization_id;
       if (!name || !type || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, type and description",
      });
    }

    const card = await cardService.createCard(
      {
        video,
        name,
        type,
        effect,
        description,
        sequence_id,
        organization_id,
        difficulty,
      },
      organization_id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: card,
    });


    }

   

    // if (membership && membership.length !== 0) {
    //   organization_id = membership[0].organization_id;
    // }

    // return res.status(200).json({organization_id}) ;

    // Validate required fields
    

    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
        message: "Search query is required",
      });
    }

    const result = await cardService.searchCardsByName(query, page, limit);

    res.status(200).json({
      success: true,
      count: result.cards.length,
      pagination: result.pagination,
      data: result.cards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Card not found",
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
    if (error.message === "Card not found") {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }
    if (error.message === "Not authorized to delete this card") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this card",
      });
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
    const cards = await cardService.getUserCards(userId);
    res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// 1. User Sequences API
exports.getUserSequencesAndShared = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Get memberships for user
    const memberships = await Membership.findByUserId(userId);

    let sharedSequences = [];
    for (const membership of memberships) {
      const teamMemberships = await TeamMember.getTeamsForMembership(
        membership.id
      );
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
            groupName,
          });
        }
      }
    }
    // Sequences created by user
    const createdSequences = await sequenceService.getUserSequences(userId);
    let uniqueSequences = [];
    if (createdSequences && createdSequences.length !== 0) {
      const createdFormatted = createdSequences.map((seq) => ({
        ...seq,
        share: false,
      }));

      // Merge and deduplicate by sequence id
      const allSequences = [...createdFormatted, ...sharedSequences];
      // const uniqueSequences = [];
      const seen = new Set();
      for (const seq of allSequences) {
        if (!seen.has(seq.id)) {
          uniqueSequences.push(seq);
          seen.add(seq.id);
        }
      }
    }

    res.json(uniqueSequences);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFullSequences = async (req, res) => {
  try {
    const userId = req.user.id;
    const membershipId = req.user.membershipId;

    const membership = await Membership.findById(membershipId);
    console.log("membership: admin test ---- >  ", membership);

    let organization_id = null;

    if (membership && membership.length !== 0) {
      organization_id = membership.organization_id;
    }

    const sequences = await sequenceService.getFullSequences(organization_id, userId);
    res.status(200).json({
      success: true,
      count: sequences.length,
      data: sequences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Store flow data (nodes and edges)
// @route   POST /api/flows
// @access  Private (or Public, depending on your auth strategy)
exports.storeFlowData = async (req, res) => {
  try {
    const { sequenceId, cleanedNodes, edges } = req.body;

    if (!sequenceId || !nodes || !edges) {
      return res.status(400).json({
        success: false,
        message: "sequenceId, nodes, and edges are required.",
      });
    }

    const result = await flowService.storeFlow({
      sequenceId,
      cleanedNodes,
      edges,
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get flow data (nodes and edges) by sequenceId
// @route   GET /api/flows/:sequenceId
// @access  Public (or Private, depending on your auth strategy)
exports.getFlowData = async (req, res) => {
  try {
    const { sequenceId } = req.params;
    // return res.status(200).json({test: true});

    if (!sequenceId) {
      return res.status(400).json({
        success: false,
        message: "sequenceId is required.",
      });
    }

    const result = await flowService.getFlow(sequenceId);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update flow data (nodes and edges) by sequenceId
// @route   PUT /api/flows/:sequenceId
// @access  Private (or Public, depending on your auth strategy)
exports.updateFlowData = async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const { nodes, edges } = req.body;
    console.log("data received", { sequenceId, edges, nodes });

    if (!sequenceId || !nodes || !edges) {
      return res.status(400).json({
        success: false,
        message: "sequenceId, nodes, and edges are required.",
      });
    }
    // return res.status(200).json({test: nodes});

    // The storeFlow method can be used for updates as it overwrites existing data for a given sequenceId
    const result = await flowService.updateFlow({ sequenceId, nodes, edges });

    console.log("result ---> ", { result });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Flow with sequenceId ${sequenceId} updated successfully.`,
        result: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all cards
// @route   GET /api/sequences/cards/all
// @access  Public
exports.getAllCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;

    const result = await cardService.getUserCards(req.user.id);

    // const result = await cardService.getAllCards(page, limit);

    res.status(200).json({
      // success: true,
      // count: result.cards.length,
      // pagination: result.pagination,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Partially update a card
// @route   PATCH /api/sequences/card/:id
// @access  Private
exports.patchCard = async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;
    // return res.status(400).json({
    //   success: false,
    //   message: {cardId, userId}
    // });

    // Get the existing card to check ownership
    const existingCard = await cardService.getCard(cardId);
    //  return res.status(400).json({
    //   success: false,
    //   message: {userid :existingCard.card.user}
    // });

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    // Check if the requesting user is the owner of the card
    if (existingCard.card.user !== userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this card",
      });
    }

    const updatedCard = await cardService.patchCard(cardId, req.body, userId);

    res.status(200).json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    if (error.message === "Card not found") {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }
    if (error.message === "Not authorized to update this card") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this card",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all sequences
// @route   GET /api/sequences
// @access  Public
exports.getSequences = async (req, res) => {
  try {
    const { user } = req.query;
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filters = {};
    if (user) filters.user = user;

    // Get sequences created by the user (fetch all to combine before pagination)
    const createdSequencesResult = await sequenceService.getSequences(
      filters,
      1,
      10000,
      userId
    ); // Fetch a large number to get all
    let allSequences = createdSequencesResult.sequences.map((seq) => ({
      ...seq,
      isShared: false,
    }));

    // Get memberships and teams for the user
    const membershipsAndTeams = await Membership.findMembershipAndTeamByUserId(
      userId
    );

    let sharedSequences = [];
    for (const membershipTeam of membershipsAndTeams) {
      const team_id = membershipTeam.team_id;
      const shares = await Share.findByTeamId(team_id);
      for (const share of shares) {
        const sharedSequence = await sequenceService.getSequence(
          share.sequence_id
        );
        if (sharedSequence) {
          sharedSequences.push({
            ...sharedSequence,
            isShared: true,
            sharedByTeam: team_id,
          });
        }
      }
    }

    // Add organization-wide shared sequences
    if (
      membershipsAndTeams.length > 0 &&
      membershipsAndTeams[0].organization_id
    ) {
      const organizationId = membershipsAndTeams[0].organization_id;
      const orgShares = await Share.findByOrganizationIdAndEntireOrg(
        organizationId
      );
      for (const orgShare of orgShares) {
        const sharedSequence = await sequenceService.getSequence(
          orgShare.sequence_id
        );
        if (sharedSequence) {
          sharedSequences.push({
            ...sharedSequence,
            isShared: true,
            groupName: "Organization Shared",
            membership: membershipsAndTeams[0], // Associate with the first membership for context
          });
        }
      }
    }
    allSequences = [...allSequences, ...sharedSequences];

    // Combine and deduplicate sequences
    const uniqueSequencesMap = new Map();
    allSequences.forEach((seq) => uniqueSequencesMap.set(seq.id, seq));
    sharedSequences.forEach((seq) => {
      if (!uniqueSequencesMap.has(seq.id)) {
        uniqueSequencesMap.set(seq.id, seq);
      }
    });

    const finalSequences = Array.from(uniqueSequencesMap.values());

    // Apply pagination to the combined, deduplicated list
    const total = finalSequences.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedSequences = finalSequences.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedSequences.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: paginatedSequences,
      membership: membershipsAndTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Get all sequences for the authenticated user
// @route   GET /api/sequences/my-sequences
// @access  Private
exports.mySequences = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await sequenceService.getSequences({}, page, limit, userId);

    res.status(200).json({
      success: true,
      count: result.sequences.length,
      pagination: result.pagination,
      data: result.sequences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
