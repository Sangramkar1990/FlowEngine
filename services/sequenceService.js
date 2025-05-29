const searchService = require('./searchService');
const userService = require('./userService');

class SequenceService {
  constructor() {
    this.indexName = 'sequences';
  }

  async initIndex() {
    const sequenceMapping = {
      properties: {
        name: { type: 'text' },
        description: { type: 'text' },
        user: { type: 'keyword' },
        userName: { type: 'text' },
        createdAt: { type: 'date' }
      }
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
      { createdAt: { order: 'desc' } }  // Remove the array wrapper
    );
    
    const total = await searchService.countDocuments(this.indexName, query);
    
    return {
      sequences: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getSequence(id) {
    const sequence = await searchService.getDocument(this.indexName, id);
    if (!sequence) return null;

    // If no cards exist, return sequence as is
    if (!sequence.cards) {
      sequence.cards = [];
      return sequence;
    }

    // Return sequence with cards in linked list format
    return {
      ...sequence,
      cards: sequence.cards.map(card => ({
        name: card.name,
        type: card.type,
        effect: card.effect,
        description: card.description,
        url: card.url,
        next: card.next
      }))
    };
  }

  async createSequence(sequenceData, userId) {
    const user = await userService.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const sequence = {
      name: sequenceData.name,
      description: sequenceData.description,
      user: userId,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    
    const result = await searchService.indexDocument(this.indexName, sequence);
    return { ...sequence, id: result._id };
  }

  async updateSequence(id, sequenceData, userId) {
    const sequence = await this.getSequence(id);
    
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    
    if (sequence.user !== userId) {
      throw new Error('Not authorized to update this sequence');
    }
    
    const updatedSequence = {
      ...sequence,
      ...sequenceData,
      updatedAt: new Date().toISOString()
    };
    
    await searchService.updateDocument(this.indexName, id, updatedSequence);
    return { ...updatedSequence, id };
  }

  async deleteSequence(id, userId) {
    const sequence = await this.getSequence(id);
    
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    
    if (sequence.user !== userId) {
      throw new Error('Not authorized to delete this sequence');
    }
    
    return searchService.deleteDocument(this.indexName, id);
  }

  async getUserSequences(userId) {
    const result = await searchService.findDocuments(
      this.indexName,
      { term: { user: userId } },
      0,
      100,
      [{ createdAt: { order: 'desc' } }]
    );
    
    // Fetch cards for each sequence
    const sequencesWithCards = await Promise.all(result.hits.map(async (sequence) => {
      const sequenceData = await this.getSequence(sequence.id);
      return {
        ...sequence,
        cards: sequenceData.cards || []
      };
    }));
    
    return sequencesWithCards;
  }
}

module.exports = new SequenceService();
