const searchService = require("./searchService");
const User = require("../models/User");
const moment = require('moment'); // Import moment for date calculations

const oneWeekAgoISO = () => moment().subtract(7, 'days').toISOString();

class CardService {
  constructor() {
    this.indexName = "cards";
  }

  async initIndex() {
    const cardMapping = {
      properties: {
        name: { type: "text" },
        description: { type: "text" },
        type: { type: "keyword" },
        effect: { type: "text" },
        user: { type: "keyword" },
        organization_id: { type: "keyword" },
        userName: { type: "text" },
        url: { type: "keyword" },
        createdAt: { type: "date" },
      },
    };

    return searchService.createIndex(this.indexName, cardMapping);
  }

  async getCards(filters = {}, page = 1, limit = 10, userId = null) {
    const from = (page - 1) * limit;
    const must = [];

    if (userId) {
      must.push({ term: { user: userId } });
    } else if (filters.user) {
      must.push({ term: { user: filters.user } });
    }

    if (filters.type) {
      must.push({ term: { type: filters.type } });
    }

    if (filters.organization_id) {
      must.push({ term: { organization_id: filters.organization_id } });
    }

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const result = await searchService.findDocuments(
      this.indexName,
      query,
      from,
      limit,
      { createdAt: { order: "desc" } }
    );

    const total = await searchService.countDocuments(this.indexName, query);

    return {
      cards: result.hits,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCard(id) {
    const card = await searchService.getDocument(this.indexName, id);
    if (!card) return null;
    return { card: { ...card, id } };
  }

  async createCard(cardData, organization_id, userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const card = {
      name: cardData.name,
      description: cardData.description,
      type: cardData.type,
      effect: cardData.effect,
      user: userId,
      organization_id: organization_id,
      userName: user.name,
      url: cardData.url,
      createdAt: new Date().toISOString(),
    };

    const result = await searchService.indexDocument(this.indexName, card);
    return { ...card, id: result._id };
  }

  async updateCard(id, cardData, userId) {
    const card = await this.getCard(id);

    if (!card) {
      throw new Error("Card not found");
    }

    // if (card.user !== userId) {
    //   throw new Error("Not authorized to update this card");
    // }

    const updatedCard = {
      ...card.card,
      ...cardData,
      updatedAt: new Date().toISOString(),
    };

    await searchService.updateDocument(this.indexName, id, updatedCard);
    return { ...updatedCard, id };
  }

  async deleteCard(id, userId) {
    const card = await this.getCard(id);

    if (!card) {
      throw new Error("Card not found");
    }

    if (card.card.user !== userId) {
      throw new Error("Not authorized to delete this card");
    }

    return searchService.deleteDocument(this.indexName, id);
  }

  async getUserCards(userId) {
    const result = await searchService.findDocuments(
      this.indexName,
      { term: { user: userId } },
      0,
      100,
      [{ createdAt: { order: "desc" } }]
    );

    return result.hits;
  }

  async getFullCards(orgId) {
    const query = { term: { organization_id: orgId } };
    const result = await searchService.findDocuments(this.indexName, query);
    return result.hits;
  }

  async getTotalCardCount(organizationId) {
    const baseQuery = organizationId ? { term: { organization_id: organizationId } } : { match_all: {} };

    const totalQuery = {
      bool: {
        must: [baseQuery]
      }
    };

    const weeklyQuery = {
      bool: {
        must: [
          baseQuery,
          { range: { createdAt: { gte: oneWeekAgoISO() } } }
        ]
      }
    };

    const mostUsedTypeAggregation = {
      "most_used_type": {
        "terms": {
          "field": "type",
          "size": 1
        }
      }
    };

    const [total, addedLastWeek, aggregationResult] = await Promise.all([
      searchService.countDocuments('cards', totalQuery),
      searchService.countDocuments('cards', weeklyQuery),
      searchService.aggregateDocuments('cards', baseQuery, mostUsedTypeAggregation)
    ]);

    const techniques = aggregationResult.aggregations.most_used_type.buckets.length > 0
      ? aggregationResult.aggregations.most_used_type.buckets[0].key
      : null;

    return { total, addedLastWeek, techniques };
  }

  async techniquebreakdown(organizationId, userId) {
    const baseQuery = organizationId ? { term: { organization_id: organizationId } } : { term: { user: userId } };

    const typeBreakdownAggregation = {
      "type_counts": {
        "terms": {
          "field": "type",
          "size": 10000 // Get all unique types
        }
      }
    };

    const aggregationResult = await searchService.aggregateDocuments('cards', baseQuery, typeBreakdownAggregation);

    const typeCounts = {};
    aggregationResult.aggregations.type_counts.buckets.forEach(bucket => {
      typeCounts[bucket.key] = bucket.doc_count;
    });

    return typeCounts;
  }
}

module.exports = new CardService();