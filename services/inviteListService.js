const searchService = require('./searchService');

class InviteListService {
  constructor() {
    this.indexName = 'invitelists';
  }

  /**
   * Initialize the invitelists index
   */
  async initIndex() {
    const inviteListMapping = {
      properties: {
        organization_id: { type: 'keyword' },
        emails: { type: 'keyword' }, // Storing emails as an array of keywords
        createdAt: { type: 'date' },
      },
    };
    return searchService.createIndex(this.indexName, inviteListMapping);
  }

  /**
   * Create a new invite list entry
   * @param {string} organization_id - The ID of the organization
   * @param {string[]} emails - An array of email addresses to invite
   */
  async create(organization_id, emails) {
    const inviteEntry = {
      organization_id,
      emails,
      createdAt: new Date().toISOString(),
    };

    const result = await searchService.indexDocument(this.indexName, inviteEntry);
    return {
      ...inviteEntry,
      id: result._id,
    };
  }

  /**
   * Find invite lists by organization ID
   * @param {string} organization_id - Organization ID
   */
  async findByOrganizationId(organization_id) {
    const result = await searchService.findDocuments(
      this.indexName,
      {
        term: {
          organization_id: organization_id,
        },
      },
      0,
      100 // Assuming a max of 100 invite lists per org for now
    );
    return result.hits;
  }
}

module.exports = new InviteListService();