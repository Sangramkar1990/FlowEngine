const { Client } = require('@opensearch-project/opensearch');
require('dotenv').config();

const createOpenSearchClient = () => {
  const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'https://localhost:9200',
    ssl: {
      rejectUnauthorized: false // Set to true in production with proper certificates
    },
    auth: {
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || 'admin'
    }
  });

  return client;
};

const connectOpenSearch = async () => {
  try {
    const client = createOpenSearchClient();
    const response = await client.cluster.health({});
    console.log(`OpenSearch Connected: cluster status is ${response.body.status}`);
    return client;
  } catch (error) {
    console.error(`OpenSearch Connection Error: ${error.message}`);
    return null;
  }
};

module.exports = {
  createOpenSearchClient,
  connectOpenSearch
};
