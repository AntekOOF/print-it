const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const { jwtExpiresIn, jwtSecret } = require('../config');
const { createHttpError } = require('../utils/httpError');

const mapUserRow = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

const getUserById = async (userId) => {
  const { rows } = await db.query(
    `
      SELECT id, full_name, email, role, created_at
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  return rows[0] ? mapUserRow(rows[0]) : null;
};

const login = async ({ email, password }) => {
  const { rows } = await db.query(
    `
      SELECT id, full_name, email, role, created_at, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  const user = rows[0];

  if (!user) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');

  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    jwtSecret,
    {
      expiresIn: jwtExpiresIn,
    },
  );

  return {
    token,
    user: mapUserRow(user),
  };
};

module.exports = {
  getUserById,
  login,
};
