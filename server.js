const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectOpenSearch } = require('./config/opensearch');
const userService = require('./services/userService');
const sequenceService = require('./services/sequenceService');

// Load env vars
dotenv.config();

// Connect to OpenSearch and initialize indices
connectOpenSearch().then(async client => {
  if (client) {
    console.log('OpenSearch client initialized');

    try {
      // Initialize indices
      await userService.initIndex();
      console.log('Users index initialized');

      await sequenceService.initIndex();
      console.log('Sequences index initialized');
    } catch (error) {
      console.error('Error initializing indices:', error.message);
    }
  }
});

// Route files
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sequenceRoutes = require('./routes/sequenceRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sequences', sequenceRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FlowEngine API' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
