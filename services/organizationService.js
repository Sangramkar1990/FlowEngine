const searchService = require('./searchService');
const Organization = require('../models/Organization'); // Import the Organization model

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

  /**
   * Check if an organization name already exists
   * @param {string} name - The organization name to check
   * @returns {boolean} - True if the name exists, false otherwise
   */
  async checkUnique(name) {
    // console.log("data in organization name unique", {name});
    const organization = await Organization.findByName(name);
    // console.log("org data returned", {organization});
    // console.log("return response", {org: !!organization});
    return !!organization;
  }
}

module.exports = new OrganizationService();