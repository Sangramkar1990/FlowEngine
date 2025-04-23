const searchService = require('./searchService');
const userService = require('./userService');

class SequenceService {
  constructor() {
    this.indexName = 'sequences';
  }

  /**
   * Initialize the sequences index
   */
  async initIndex() {
    const sequenceMapping = {
      properties: {
        name: { type: 'text' },
        description: { type: 'text' },
        videoLink: { type: 'keyword' },
        type: { type: 'keyword' },
        effective: { type: 'text' },
        user: { type: 'keyword' },
        userName: { type: 'text' },
        createdAt: { type: 'date' }
      }
    };

    return searchService.createIndex(this.indexName, sequenceMapping);
  }

  /**
   * Get all sequences with filtering and pagination
   * @param {object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   */
  async getSequences(filters = {}, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    
    // Build query
    const must = [];
    
    if (filters.type) {
      must.push({
        term: { type: filters.type }
      });
    }
    
    if (filters.effective) {
      must.push({
        match: { effective: filters.effective }
      });
    }
    
    if (filters.user) {
      must.push({
        term: { user: filters.user }
      });
    }
    
    const query = must.length > 0 
      ? { bool: { must } } 
      : { match_all: {} };
    
    // Get sequences
    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      [{ createdAt: { order: 'desc' } }]
    );
    
    // Get total count for pagination
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

  /**
   * Get a single sequence by ID
   * @param {string} id - Sequence ID
   */
  async getSequence(id) {
    return searchService.getDocument(this.indexName, id);
  }

  /**
   * Create a new sequence
   * @param {object} sequenceData - Sequence data
   * @param {string} userId - User ID
   */
  async createSequence(sequenceData, userId) {
    // Get user name
    const user = await userService.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const sequence = {
      name: sequenceData.name,
      description: sequenceData.description,
      videoLink: sequenceData.videoLink,
      type: sequenceData.type || 'other',
      effective: sequenceData.effective,
      user: userId,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    
    const result = await searchService.indexDocument(this.indexName, sequence);
    
    return { ...sequence, id: result._id };
  }

  /**
   * Update a sequence
   * @param {string} id - Sequence ID
   * @param {object} sequenceData - Updated sequence data
   * @param {string} userId - User ID
   */
  async updateSequence(id, sequenceData, userId) {
    // Check if sequence exists and belongs to user
    const sequence = await this.getSequence(id);
    
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    
    if (sequence.user !== userId) {
      throw new Error('Not authorized to update this sequence');
    }
    
    // Update sequence
    const updatedSequence = {
      ...sequence,
      ...sequenceData,
      updatedAt: new Date().toISOString()
    };
    
    await searchService.updateDocument(this.indexName, id, updatedSequence);
    
    return { ...updatedSequence, id };
  }

  /**
   * Delete a sequence
   * @param {string} id - Sequence ID
   * @param {string} userId - User ID
   */
  async deleteSequence(id, userId) {
    // Check if sequence exists and belongs to user
    const sequence = await this.getSequence(id);
    
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    
    if (sequence.user !== userId) {
      throw new Error('Not authorized to delete this sequence');
    }
    
    // Delete sequence
    return searchService.deleteDocument(this.indexName, id);
  }

  /**
   * Search sequences
   * @param {string} query - Search query
   * @param {number} from - Starting offset
   * @param {number} size - Number of results
   */
  async searchSequences(query, from = 0, size = 10) {
    return searchService.multiFieldSearch(
      this.indexName,
      ['name', 'description', 'effective'],
      query,
      from,
      size
    );
  }

  /**
   * Get sequences by user
   * @param {string} userId - User ID
   */
  async getUserSequences(userId) {
    const result = await searchService.findDocuments(
      this.indexName,
      {
        term: { user: userId }
      },
      0,
      100,
      [{ createdAt: { order: 'desc' } }]
    );
    
    return result.hits;
  }
}

module.exports = new SequenceService();
