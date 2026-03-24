const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { adminEmail, adminPassword } = require('../src/config');
const { pool } = require('../src/db/pool');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      executed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
};

const getMigrationFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

const runPendingMigrations = async (client) => {
  await ensureMigrationsTable(client);

  const appliedResult = await client.query('SELECT filename FROM schema_migrations');
  const appliedFiles = new Set(appliedResult.rows.map((row) => row.filename));
  const migrationFiles = getMigrationFiles();

  for (const fileName of migrationFiles) {
    if (appliedFiles.has(fileName)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf8');
    console.log(`Running migration ${fileName}...`);

    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [fileName]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
};

const seedAdminUser = async (client) => {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await client.query(
    `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ('Print-IT Admin', $1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE
      SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        role = 'admin'
    `,
    [adminEmail, passwordHash],
  );
};

const init = async () => {
  const client = await pool.connect();

  try {
    await runPendingMigrations(client);
    await seedAdminUser(client);
    console.log('Database migrations and seeds completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
};

init().catch((error) => {
  console.error('Database initialization failed.');
  console.error(error);
  process.exit(1);
});
