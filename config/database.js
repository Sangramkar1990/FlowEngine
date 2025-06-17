const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'INSQ',
  password: '',
  port: 5432,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

module.exports = pool;