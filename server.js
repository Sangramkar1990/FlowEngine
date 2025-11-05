const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./config/database');
const organizationRoutes = require('./routes/organizationRoutes');
const { connectOpenSearch } = require('./config/opensearch');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');
const flowService = require('./services/flowService');
const sequenceService = require('./services/sequenceService');
const cardService = require('./services/cardService');
const seedRoles = require('./scripts/seedRoles')
const seedPermissions = require('./scripts/seedPermissions');
const seedRolePermissions = require('./scripts/seedRolePermissions');



// Load env vars
dotenv.config();
console.log("node env :", {test: (process.env.NODE_ENV || "").trim() === "development" ? process.env.OPNESEARCH_DEV_NODE  :"http://opensearch:9200"})
connectOpenSearch().then(async client => {
  // console.log( process.env.NODE_ENV.length )
  // console.log('development'.length )
  if (client) {
    console.log('OpenSearch client initialized');

    try {
      // Initialize indices
      // await userService.initIndex();
      // console.log('Users index initialized');
      console.log('Initializing Flow indices...');

      await sequenceService.initIndex();
      await cardService.initIndex();
        await flowService.initIndex(); // Initialize flowService indices
      
    } catch (error) {
    }
  }
});



// Route files
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sequenceRoutes = require('./routes/sequenceRoutes');
const inviteRoutes = require('./routes/inviteRoutes'); 
const membershipRoutes = require('./routes/membershipRoutes');
const teamRoutes = require('./routes/teamRoutes');
const shareRoutes = require('./routes/shareRoutes');
const userRoutes = require('./routes/userRoutes');
const rbacRoutes = require('./routes/rbacRoutes');



const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS with credentials and explicit origin
// app.use(cors({
//   origin: [
//     'http://localhost:5173',
//     'http://192.168.0.8:5173'       
//   ],
//   credentials: true
// }));

// 1.1 Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5173/',
  'http://192.168.0.9:5173',
  'http://192.168.121.120:5173',
  'http://192.168.173.120:5173'
]

// 1.2 CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (curl, mobile apps, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS denied for ${origin}`))
  },
  credentials: true,
  // some older browsers choke on 204
  optionsSuccessStatus: 200
}

// 1.3 Apply CORS globally
app.use(cors(corsOptions))

// 1.4 Explicitly handle preflight for all routes
// app.options('/:all(*)', cors(corsOptions))
app.options(/.*/, cors(corsOptions));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/invites', inviteRoutes); 
app.use('/api/teams', teamRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rbac', rbacRoutes);

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
  // console.log("satarting...")
  console.log(`Server running on port2 ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
(async () => {
  try {
    // const superAdminUser = await User.findByEmail('adminNew@sequence.com');
    // Run role seeding
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    let roles = await Role.findAll();
    let permissions = await Permission.findAll();
    let rolePermissions = await RolePermission.findAll();
    console.log("roles", {roles});
    console.log("permissions", {permissions});
    console.log("rolePermissions", {rolePermissions});
    // if (roles.length === 0) {
    //   // Create default roles
    //   const defaultRoles = [ 'user', 'team', 'manager', 'super admin' ];
    //   for (const roleName of defaultRoles) {
    //     await Role.create({ name: roleName });
    //     console.log(`Role '${roleName}' created`);
    //   }
    
    // if (!superAdminUser) {
    //   await User.create({
    //     name: 'super admin',
    //     email: 'adminNew@sequence.com',
    //     password: 'sequenceAdmin123',
    //     role_id: 4
    //   });
    //   console.log('Super admin user created');
    // } else {
    //   console.log('Super admin user already exists');
    // }
  } catch (e) {
    console.error('Error checking/creating super admin user:', e);
  }
})();
