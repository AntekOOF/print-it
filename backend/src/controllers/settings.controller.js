const settingsService = require('../services/settings.service');
const { validateSettingsPayload } = require('../utils/validation');

const getSettings = async (_request, response, next) => {
  try {
    const settings = await settingsService.getSettings();
    response.json({ data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (request, response, next) => {
  try {
    const payload = validateSettingsPayload(request.body);
    const settings = await settingsService.updateSettings(payload);
    response.json({
      data: settings,
      message: 'Settings updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
