const app = require('./app');
const { port } = require('./config');
const { pool } = require('./db/pool');

const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connection established.');
  } catch (error) {
    console.warn('PostgreSQL connection failed. The API will start, but database requests will fail until the database is reachable.');
    console.warn(error.message);
  }

  app.listen(port, () => {
    console.log(`Print-IT API listening on http://localhost:${port}`);
  });
};

startServer();
