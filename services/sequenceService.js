const searchService = require("./searchService");
const userService = require("./userService");
const cardService = require("./cardService");
const User = require('../models/User.js');

class SequenceService {
  constructor() {
    this.indexName = "sequences";
  }

  async initIndex() {
    const sequenceMapping = {
      properties: {
        name: { type: "text" },
        description: { type: "text" },
        user: { type: "keyword" },
        userName: { type: "text" },
        createdAt: { type: "date" },
      },
    };

    return searchService.createIndex(this.indexName, sequenceMapping);
  }

  async getSequences(filters = {}, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const must = [];

    if (filters.user) {
      must.push({ term: { user: filters.user } });
    }

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      { createdAt: { order: "desc" } } // Remove the array wrapper
    );

    const total = await searchService.countDocuments(this.indexName, query);

    return {
      sequences: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSequence(id) {
    // return false;
    const sequence = await searchService.getDocument(this.indexName, id);
    if (!sequence) return null;
    sequence.id = id;
    console.log("get sequence :", {sequence: sequence.cards});

    // If no cards exist, return sequence as is
    if (!sequence.cards) {
      sequence.cards = [];
      return sequence;
    } else {
      // Fetch cards for each cards
      const cards = await Promise.all(
        sequence.cards.map(async(card) =>{ return  { id: card.id, next: card.next, position: card.position, node_id : card.node_id ? card.node_id : null, reverse: card.reverse ? card.reverse : false, bidirection: card.bidirection ? card.bidirection : false,
          data: await cardService.getCard(card.id)}})
      );
     
    return {
      ...sequence,
      cards: cards.map((card) => ({
        name: card.data ? card.data.card.name : null,
        type: card.data ? card.data.card.type : null,
        effect: card.data ? card.data.card.effect : null,
        description: card.data ? card.data.card.description : null,
        url: card.data ? card.data.card.url : null,
        card_data_present: card.data ? true : false,
        id: card.id,
        position: card.position,
        next: card.next,
        node_id: card.node_id,
        reverse: card.reverse ? card.reverse : false,
        bidirection: card.bidirection ? card.bidirection : false,
      })),
    };
      // console.log("cards", cards);
    }
    

    
  }

  async createSequence(sequenceData, userId) {
    console.log("test create sequence", userId);

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const sequence = {
      name: sequenceData.name,
      description: sequenceData.description,
      user: userId,
      userName: user.name,
      createdAt: new Date().toISOString(),
    };

    const result = await searchService.indexDocument(this.indexName, sequence);
    return { ...sequence, id: result._id };
    // return false;
  }

  async updateSequence(id, sequenceData, userId) {
    const sequence = await this.getSequence(id);
    console.log("recieved sequence data",{data:sequenceData.cards})

    if (!sequence) {
      throw new Error("Sequence not found");
    }

    if (sequence.user !== userId) {
      throw new Error("Not authorized to update this sequence");
    }

    const updatedSequence = {
      ...sequence,
      ...sequenceData,
      updatedAt: new Date().toISOString(),
    };
    // console.log("sequence data in update :", {card: updatedSequence.cards[1]});

    const updatedData = await searchService.updateDocument(
      this.indexName,
      id,
      updatedSequence
    );
    const sequence_updated = await this.getSequence(id);
    console.log("updatedData", updatedData);
    return { ...updatedSequence, id };
  }

  async deleteSequence(id, userId) {
    const sequence = await this.getSequence(id);

    if (!sequence) {
      throw new Error("Sequence not found");
    }

    if (sequence.user !== userId) {
      throw new Error("Not authorized to delete this sequence");
    }

    return searchService.deleteDocument(this.indexName, id);
  }


  async getUserSequences(userId) {
    const result = await searchService.findDocuments(
      this.indexName,
      { term: { user: userId } },
      0,
      100,
      [{ createdAt: { order: "desc" } }]
    );

    if (!Array.isArray(result.hits)) {
      throw new Error("Expected result.hits to be an array");
    }
    // console.log("sequence result", result.hits[2].cards);

    // Fetch cards for each sequence
    const sequencesWithCards = await Promise.all(
      result.hits.map(async (sequence) => {
        const cardIds = sequence.cards || [];
        // console.log("sequence new", sequence);
        // console.log("cardIds", cardIds);
        // return {cardId: cardIds};

        // Fetch each card using cardService.getCard
        const cards = await Promise.all(
          cardIds.map((cardId) => cardId.id ? cardService.getCard(cardId.id): null)
        );

        // console.log("sequenceData", {
        //   ...sequence,
        //   cards: cards.filter(Boolean), // Remove any null/undefined results
        // });

        return {
          ...sequence,
          cards: cards.filter(Boolean), // Remove any null/undefined results
        };
      })
    );

    // console.log("sequencesWithCards", sequencesWithCards);

    return sequencesWithCards;
  }
}

module.exports = new SequenceService();
