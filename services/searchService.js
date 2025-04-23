const { createOpenSearchClient } = require('../config/opensearch');
const { v4: uuidv4 } = require('uuid');

class SearchService {
  constructor() {
    this.client = createOpenSearchClient();
  }

  /**
   * Get a document by ID
   * @param {string} indexName - Name of the index
   * @param {string} id - Document ID
   */
  async getDocument(indexName, id) {
    try {
      const response = await this.client.get({
        index: indexName,
        id
      });

      return response.body._source;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`Error getting document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find documents by query
   * @param {string} indexName - Name of the index
   * @param {object} query - Query object
   * @param {number} from - Starting offset (pagination)
   * @param {number} size - Number of results to return
   * @param {object} sort - Sort options
   */
  async findDocuments(indexName, query = { match_all: {} }, from = 0, size = 10, sort = null) {
    try {
      const searchParams = {
        index: indexName,
        body: {
          from,
          size,
          query
        }
      };

      if (sort) {
        searchParams.body.sort = sort;
      }

      const response = await this.client.search(searchParams);

      return {
        hits: response.body.hits.hits.map(hit => ({
          ...hit._source,
          id: hit._id
        })),
        total: response.body.hits.total.value,
        took: response.body.took
      };
    } catch (error) {
      console.error(`Error finding documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count documents by query
   * @param {string} indexName - Name of the index
   * @param {object} query - Query object
   */
  async countDocuments(indexName, query = { match_all: {} }) {
    try {
      const response = await this.client.count({
        index: indexName,
        body: {
          query
        }
      });

      return response.body.count;
    } catch (error) {
      console.error(`Error counting documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create an index if it doesn't exist
   * @param {string} indexName - Name of the index
   * @param {object} mappings - Index mappings
   */
  async createIndex(indexName, mappings = {}) {
    try {
      const indexExists = await this.client.indices.exists({ index: indexName });

      if (!indexExists.body) {
        const response = await this.client.indices.create({
          index: indexName,
          body: {
            mappings
          }
        });

        console.log(`Index created: ${indexName}`);
        return response.body;
      }

      console.log(`Index already exists: ${indexName}`);
      return { acknowledged: true, index: indexName };
    } catch (error) {
      console.error(`Error creating index ${indexName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Index a document
   * @param {string} indexName - Name of the index
   * @param {object} document - Document to index
   * @param {string} id - Optional document ID
   */
  async indexDocument(indexName, document, id = null) {
    try {
      const docId = id || uuidv4();
      const params = {
        index: indexName,
        id: docId,
        body: document,
        refresh: true // Make the document immediately available for search
      };

      const response = await this.client.index(params);
      return { ...response.body, _id: docId };
    } catch (error) {
      console.error(`Error indexing document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} indexName - Name of the index
   * @param {string} id - Document ID
   * @param {object} document - Document fields to update
   */
  async updateDocument(indexName, id, document) {
    try {
      const response = await this.client.update({
        index: indexName,
        id,
        body: {
          doc: document
        },
        refresh: true
      });

      return response.body;
    } catch (error) {
      console.error(`Error updating document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} indexName - Name of the index
   * @param {string} id - Document ID
   */
  async deleteDocument(indexName, id) {
    try {
      const response = await this.client.delete({
        index: indexName,
        id,
        refresh: true
      });

      return response.body;
    } catch (error) {
      console.error(`Error deleting document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search documents
   * @param {string} indexName - Name of the index
   * @param {object} query - Search query
   * @param {number} from - Starting offset (pagination)
   * @param {number} size - Number of results to return
   */
  async search(indexName, query, from = 0, size = 10) {
    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          from,
          size,
          query
        }
      });

      return {
        hits: response.body.hits.hits,
        total: response.body.hits.total.value,
        took: response.body.took
      };
    } catch (error) {
      console.error(`Error searching documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform a simple text search
   * @param {string} indexName - Name of the index
   * @param {string} field - Field to search in
   * @param {string} text - Text to search for
   * @param {number} from - Starting offset (pagination)
   * @param {number} size - Number of results to return
   */
  async textSearch(indexName, field, text, from = 0, size = 10) {
    const query = {
      match: {
        [field]: {
          query: text,
          operator: 'and'
        }
      }
    };

    return this.search(indexName, query, from, size);
  }

  /**
   * Perform a multi-field search
   * @param {string} indexName - Name of the index
   * @param {array} fields - Fields to search in
   * @param {string} text - Text to search for
   * @param {number} from - Starting offset (pagination)
   * @param {number} size - Number of results to return
   */
  async multiFieldSearch(indexName, fields, text, from = 0, size = 10) {
    const query = {
      multi_match: {
        query: text,
        fields,
        operator: 'and'
      }
    };

    return this.search(indexName, query, from, size);
  }
}

module.exports = new SearchService();
