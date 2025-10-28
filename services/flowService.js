const searchService = require("./searchService"); // Import searchService
const sequenceService = require("./sequenceService"); 

class FlowService {
  constructor() {
    this.flowIndexName = "flow_engine_v2";
    
  }

  async initIndex() {
    const flowMapping = {
      properties: {
        sequenceId: { type: "keyword" },
        nodes: { type: "object", enabled: true }, // Store as object, do not index its internal fields
        edges: { type: "object", enabled: true }, // Store as object, do not index its internal fields
      },
    };

    await searchService.createIndex(this.flowIndexName, flowMapping);
  }

  /**
   * Stores a collection of nodes and edges with a given sequenceId in OpenSearch.
   * @param {string} sequenceId - The unique identifier for the flow.
   * @param {Array} nodes - An array of node objects.
   * @param {Array} edges - An array of edge objects.
   */
  async storeFlow({ sequenceId, nodes, edges }) {
    if (!sequenceId || !Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error("Invalid input: sequenceId, nodes, and edges are required.");
    }
    // console.log("nodes", {nodes, edges})

    const flowDocument = {
      sequenceId,
      nodes,
      edges,
    };
    console.log("flowDocument", flowDocument);

    await searchService.indexDocument(this.flowIndexName, flowDocument);

    return { success: true, message: `Flow with sequenceId ${sequenceId} stored successfully in OpenSearch.`, data: flowDocument };
  }

  /**
   * Retrieves a collection of nodes and edges based on a sequenceId from OpenSearch.
   * @param {string} sequenceId - The unique identifier for the flow to retrieve.
   * @returns {object|null} An object containing nodes and edges, or null if not found.
   */
  async getFlow(sequenceId) {
    if (!sequenceId) {
      throw new Error("Invalid input: sequenceId is required.");
    }
    const sequence = await sequenceService.getSequence(sequenceId);

    const flowQuery = { term: { sequenceId: sequenceId } };
    const flowResult = await searchService.findDocuments(this.flowIndexName, flowQuery, 0, 1); // Expecting only one flow document per sequenceId

    let nodes = [];
    let edges = [];

    if (flowResult.hits.length > 0) {
      const flowDocument = flowResult.hits[0];
      nodes = flowDocument.nodes || [];
      edges = flowDocument.edges || [];
    }

    if (nodes && nodes.length > 0 && Array.isArray(nodes)) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.data && node.data.id) {
          const cardQuery = { term: { _id: node.data.id } };
          const cardResult = await searchService.findDocuments("cards", cardQuery, 0, 1);
          if (cardResult.hits.length > 0) {
            node.data = cardResult.hits[0];
          }
        }
      }
    }

    return {
      success: true,
      data: {
        sequence: sequence || {},
        // result: flowResult
        nodes: nodes,
        edges: edges
      }
    }
  }

  /**
   * Updates a flow document in OpenSearch.
   * @param {string} sequenceId - The unique identifier for the flow.
   * @param {Array} nodes - An array of node objects.
   * @param {Array} edges - An array of edge objects.
   */
  async updateFlow({ sequenceId, nodes, edges }) {
    if (!sequenceId || !Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error("Invalid input: sequenceId, nodes, and edges are required.");
    }

    // Ensure the index is refreshed to get the latest document state
    // await searchService.refreshIndex(this.flowIndexName);

    const flowQuery = { term: { sequenceId: sequenceId } };
    const flowResult = await searchService.findDocuments(this.flowIndexName, flowQuery, 0, 1);
    const flowDocument = {
      sequenceId,
      nodes,
      edges,
    };
    let documentId = null; 

    if (flowResult.hits.length === 0) {
      // throw new Error(`Flow with sequenceId ${sequenceId} not found.`);
      await searchService.indexDocument(this.flowIndexName, flowDocument);
    }
    else {
      documentId = flowResult.hits[0].id; 
    }

    // Get the actual _id from OpenSearch

    

    const flowEmptyDocument = {
      sequenceId,
      nodes: [],
      edges: [],
    };

    console.log("Updating flowDocument", {flowDocument, indexname: this.flowIndexName});
    // await searchService.indexDocument(this.flowIndexName, flowEmptyDocument,  documentId);
    // await searchService.refreshIndex(this.flowIndexName);
    await searchService.indexDocument(this.flowIndexName, flowDocument,  documentId);
    const flowResult2 = await searchService.findDocuments(this.flowIndexName, flowQuery, 0, 1);


    return { success: true, message: `Flow with sequenceId ${sequenceId} updated successfully in OpenSearch.`, data: flowResult2 };
  }
}

module.exports = new FlowService();