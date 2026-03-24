const authService = require('../services/auth.service');
const { validateLoginPayload, validateRegisterPayload } = require('../utils/validation');

const register = async (request, response, next) => {
  try {
    const payload = validateRegisterPayload(request.body);
    const authResult = await authService.register(payload);
    response.status(201).json({
      data: authResult,
      message: 'Account created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (request, response, next) => {
  try {
    const credentials = validateLoginPayload(request.body);
    const authResult = await authService.login(credentials);
    response.json({
      data: authResult,
      message: 'Login successful.',
    });
  } catch (error) {
    next(error);
  }
};

const me = async (request, response, next) => {
  try {
    const user = await authService.getUserById(request.user.sub);
    response.json({ data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  me,
  register,
};
