const searchService = require('./searchService');
const userService = require('./userService');
const { createOpenSearchClient } = require('../config/opensearch');
const { v4: uuidv4 } = require('uuid');
const oneWeekAgoISO = require('../helper/dateHelper').oneWeekAgoISO;

class CardService {
  constructor() {
    this.indexName = 'cards';
    this.client = createOpenSearchClient();
  }

   async initIndex() {
    const cardMapping = {
      properties: {
        name: { type: 'text' },
        description: { type: 'text' },
        videoLink: { type: 'keyword' },
        type: { type: 'keyword' },
        difficulty: { type: 'keyword' },
        effective: { type: 'text' },
        user: { type: 'keyword' },
        userName: { type: 'text' },
        sequence_id: { type: 'keyword' },
        createdAt: { type: 'date' }
      }
    };

    return searchService.createIndex(this.indexName, cardMapping);
  }
  

  async getCards(filters = {}, page = 1, limit = 100) {
    const from = (page - 1) * limit;
    const must = [];
    
    if (filters.type) must.push({ term: { type: filters.type } });
    if (filters.effective) must.push({ match: { effective: filters.effective } });
    if (filters.user) must.push({ term: { user: filters.user } });
    if (filters.sequence_id) must.push({ term: { sequence_id: filters.sequence_id } });
    
    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };
    
    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      [{ createdAt: { order: 'desc' } }]
    );
    
    const total = await searchService.countDocuments(this.indexName, query);
    
    return {
      cards: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getCard(id) {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id
      });
      // console.log('response', response);

      return {card: response.body._source, id: id};
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`Error getting document: ${error.message}`);
      throw error;
    }
    // return searchService.getDocument(this.indexName, id);
  }

  async createCard(cardData, userId) {
    // console.log('cardData', cardData);
    const card = {
      name: cardData.name,
      description: cardData.description,
      url: cardData.video,
      difficulty: cardData.difficulty,
      type: cardData.type,
      effect: cardData.effect,
      user: userId,
      sequence_id: cardData.sequence_id || null,
      userName: cardData.userName || null,
      effective: cardData.effective || null,
      createdAt: new Date().toISOString()
    };
    
    const result = await searchService.indexDocument(this.indexName, card);
    return { ...card, id: result._id };
  }

  async updateCard(id, cardData, userId) {
    const card = await this.getCard(id);
    
    if (!card) {
      throw new Error('Card not found');
    }
    
    if (card.user !== userId) {
      throw new Error('Not authorized to update this card');
    }
    
    const updatedCard = {
      ...card,
      ...cardData,
      updatedAt: new Date().toISOString()
    };
    
    await searchService.updateDocument(this.indexName, id, updatedCard);
    return { ...updatedCard, id };
  }

  async deleteCard(id, userId) {
    const card = await this.getCard(id);
    
    if (!card) {
      throw new Error('Card not found');
    }
    // console.log("id :", {id});
    // console.log("card : ", {card:card.card});
    // console.log("card user :", {user:card.card.user});
    // console.log("both id :", {IS_EQUAL:card.card.user === userId})


    
    if (card.card.user !== userId) {
      throw new Error('Not authorized to delete this card');
    }
    
    return searchService.deleteDocument(this.indexName, id);
  }

  async searchCards(query, from = 0, size = 10) {
    return searchService.multiFieldSearch(
      this.indexName,
      ['name', 'description', 'effective'],
      query,
      from,
      size
    );
  }

  async searchCardsByName(searchQuery, page = 1, limit = 100) {
    const from = (page - 1) * limit;
    const query = {
      match: {
        name: {
          query: searchQuery,
          fuzziness: 'AUTO'
        }
      }
    };
    
    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      [{ createdAt: { order: 'desc' } }]
    );
    
    const total = await searchService.countDocuments(this.indexName, query);
    
    return {
      cards: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getSequenceCards(sequenceId) {
    const result = await searchService.findDocuments(
      this.indexName,
      {
        term: { sequence_id: sequenceId }
      },
      0,
      100,
      [{ createdAt: { order: 'desc' } }]
    );
    
    return result.hits;
  }
    async getCardByUser(userId) {
     
    // const query = { term: { user: userId } };
    const query = { match_all: {} };
    const result = await searchService.findDocuments(this.indexName, query);
    return result.hits;
}

  async getAllCards(page = 1, limit = 100) {
    const from = (page - 1) * limit;
    const query = { match_all: {} };
    
    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      [{ createdAt: { order: 'desc' } }]
    );
    
    const total = await searchService.countDocuments(this.indexName, query);
    
    return {
      cards: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTotalCardCount() {
   const totalQuery = { match_all: {} };
    const weeklyQuery = { range: { createdAt: { gte: oneWeekAgoISO() } } };
     const [total, addedLastWeek] = await Promise.all([
    searchService.countDocuments('cards', totalQuery),
    searchService.countDocuments('cards', weeklyQuery)
  ]);
    return { total, addedLastWeek };
  }

  async techniquebreakdown() {
    const query = { match_all: {} };
    const result = await searchService.findDocuments(this.indexName, query, 0, 1000);
    return result.hits;
  }
}

module.exports = new CardService();