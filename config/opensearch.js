const { Client } = require('@opensearch-project/opensearch');

require('dotenv').config();

const createOpenSearchClient = () => {
  const client = new Client({
    node: "http://opensearch:9200",
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
