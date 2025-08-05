const pool = require('../config/database');

class Organization {
  static async create(organizationData) {
    const query = `
      INSERT INTO organizations (name, owner_user_id, public_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      organizationData.organizationName,
      organizationData.userId,
      organizationData.publicId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM organizations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    // const query = 'SELECT * FROM organizations WHERE name = $1';
    // const query = 'SELECT * FROM organizations';
    // const result = await pool.query(query, [name]);
    // console.log("response of organization", {result})
    // // return result.rows[0] || null;
    // return result;
//     const query = 'SELECT * FROM organizations';

//   try {
//     const { rows } = await pool.query(query);
//     console.log('response of organizations', rows);
//     return rows;
//   } catch (error) {
//     console.error('Error fetching organizations:', error);
//     throw error;
//   }
const query = 'SELECT * FROM organizations WHERE name = $1';
  
  try {
    const { rows } = await pool.query(query, [name]);
    // console.log('response of organization', rows);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching organization by name:', error);
    throw error;
  }
  }

 static async searchByNameOrPublicId(searchTerm) {
    const query = `
      SELECT * FROM organizations
      WHERE name ILIKE $1 OR public_id ILIKE $1
    `;
    const value = `%${searchTerm}%`;
    try {
      const { rows } = await pool.query(query, [value]);
      return rows;
    } catch (error) {
      console.error('Error searching organizations:', error);
      throw error;
    }
  }
}

module.exports = Organization;