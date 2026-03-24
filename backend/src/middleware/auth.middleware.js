const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { createHttpError } = require('../utils/httpError');

const getBearerToken = (headerValue = '') => {
  const [scheme, token] = headerValue.split(' ');
  return scheme === 'Bearer' ? token : '';
};

const requireAuth = (request, _response, next) => {
  try {
    const token = getBearerToken(request.headers.authorization);

    if (!token) {
      throw createHttpError(401, 'Authentication is required.');
    }

    request.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    next(error.status ? error : createHttpError(401, 'Invalid or expired authentication token.'));
  }
};

const requireAdmin = (request, response, next) => {
  requireAuth(request, response, (error) => {
    if (error) {
      next(error);
      return;
    }

    if (request.user?.role !== 'admin') {
      next(createHttpError(403, 'Admin access is required.'));
      return;
    }

    next();
  });
};

module.exports = {
  requireAdmin,
  requireAuth,
};
