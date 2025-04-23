const searchService = require('../services/searchService');

// @desc    Search in a specific index
// @route   GET /api/search/:index
// @access  Public
exports.search = async (req, res) => {
  try {
    const { index } = req.params;
    const { query, fields, from, size } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    let results;
    
    // If fields are provided, perform a multi-field search
    if (fields) {
      const fieldArray = fields.split(',');
      results = await searchService.multiFieldSearch(
        index,
        fieldArray,
        query,
        parseInt(from) || 0,
        parseInt(size) || 10
      );
    } else {
      // Default to searching all fields
      results = await searchService.search(
        index,
        {
          query_string: {
            query: query
          }
        },
        parseInt(from) || 0,
        parseInt(size) || 10
      );
    }

    res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Index a document
// @route   POST /api/search/:index
// @access  Private
exports.indexDocument = async (req, res) => {
  try {
    const { index } = req.params;
    const { id } = req.query;
    const document = req.body;

    if (!document || Object.keys(document).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document body is required'
      });
    }

    const result = await searchService.indexDocument(index, document, id);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Index document error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a document
// @route   PUT /api/search/:index/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    const { index, id } = req.params;
    const document = req.body;

    if (!document || Object.keys(document).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document body is required'
      });
    }

    const result = await searchService.updateDocument(index, id, document);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Update document error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a document
// @route   DELETE /api/search/:index/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const { index, id } = req.params;

    const result = await searchService.deleteDocument(index, id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Delete document error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create an index
// @route   POST /api/search/index/:index
// @access  Private
exports.createIndex = async (req, res) => {
  try {
    const { index } = req.params;
    const mappings = req.body;

    const result = await searchService.createIndex(index, mappings);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Create index error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
