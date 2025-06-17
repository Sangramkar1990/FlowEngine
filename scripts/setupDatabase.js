const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
  try {
    console.log('Setting up PostgreSQL database...');
    
    // Read and execute SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'createTables.sql'), 'utf8');
    await pool.query(sqlFile);
    
    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
};

setupDatabase();