const { Pool } = require('pg');
const { pgConfig } = require('../config');

const pool = new Pool(pgConfig);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
