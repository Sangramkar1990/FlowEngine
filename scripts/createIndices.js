const { connectOpenSearch } = require('../config/opensearch');
const userService = require('../services/userService');
const sequenceService = require('../services/sequenceService');

// Create the indices
const createIndices = async () => {
  try {
    // Connect to OpenSearch
    const client = await connectOpenSearch();
    
    if (!client) {
      console.error('Failed to connect to OpenSearch');
      process.exit(1);
    }
    
    // Create the indices
    const userResult = await userService.initIndex();
    // console.log('Users index created:', userResult);
    
    const sequenceResult = await sequenceService.initIndex();
    // console.log('Sequences index created:', sequenceResult);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating indices:', error.message);
    process.exit(1);
  }
};

// Run the function
createIndices();
