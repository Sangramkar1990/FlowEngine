const searchService = require('./searchService');

class OrganizationService {
  constructor() {
    this.indexName = 'organizations';
  }

  /**
   * Initialize the organizations index
   */
  async initIndex() {
    const organizationMapping = {
      properties: {
        name: { type: 'text' },
        owner_userId: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    };

    return searchService.createIndex(this.indexName, organizationMapping);
  }

  /**
   * Create a new organization
   * @param {object} organizationData - Organization data (name, owner_userId)
   */
  async create(organizationData) {
    const now = new Date().toISOString();
    const organization = {
      name: organizationData.organizationName,
      owner_userId: organizationData.userId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await searchService.indexDocument(this.indexName, organization);
    return {
      ...organization,
      id: result._id,
    };
  }

  /**
   * Find an organization by ID
   * @param {string} id - Organization ID
   */
  async findById(id) {
    return searchService.getDocument(this.indexName, id);
  }
}

module.exports = new OrganizationService();