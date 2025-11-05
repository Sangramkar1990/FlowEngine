const { Pool } = require('pg');
require('dotenv').config();

const nodeEnv = (process.env.NODE_ENV || '').trim();



const pool = new Pool({
  user: 'postgres',
  host: nodeEnv === 'development' ? 'localhost' : 'postgres',
  database: 'INSQV2',
  password: nodeEnv === 'development' ? 'qwerty' :'InFiniteSQ',
  port: nodeEnv === 'development' ? 5433 : 5432,
  // port: 5432,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

module.exports = pool;