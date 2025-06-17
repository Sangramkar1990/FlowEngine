const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./config/database');
const organizationRoutes = require('./routes/organizationRoutes');
const { connectOpenSearch } = require('./config/opensearch');
const User = require('./models/User');

// Load env vars
dotenv.config();
connectOpenSearch().then(async client => {
  if (client) {
    console.log('OpenSearch client initialized');

    try {
      // Initialize indices
      // await userService.initIndex();
      // console.log('Users index initialized');

      await sequenceService.initIndex();
      console.log('Sequences index initialized');
    } catch (error) {
    }
  }
});

// Test database connection
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('Error connecting to PostgreSQL:', err);
//   } else {
//     console.log('Connected to PostgreSQL database');
//     release();
//     // Automatically create test user if not exists
//     (async () => {
//       try {
//         const existing = await User.findByEmail('test123@gmail.com');
//         if (!existing) {
//           await User.create({
//             name: 'Test User',
//             email: 'test123@gmail.com',
//             password: 'qwerty123',
//             userType: 'individual'
//           });
//           console.log('Test user created');
//         } else {
//           console.log('Test user already exists');
//         }
//       } catch (e) {
//         console.error('Error creating test user:', e);
//       }
//     })();
//   }
// });

// Route files
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sequenceRoutes = require('./routes/sequenceRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS with credentials and explicit origin
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/organization', organizationRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FlowEngine API' });
});

app.get('/check-cors', (req, res) => {
  res.json({
      message: 'CORS is enabled',
      allowedOrigins: req.headers.origin || 'No origin provided',
      methods: 'GET, POST, PUT, DELETE',
      credentials: 'true or false (depending on your setup)'
  });
});

const PORT = (process.env.NODE_ENV || "").trim() === "development" ? process.env.DEV_PORT || 5001 : 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
