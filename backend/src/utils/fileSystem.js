const fs = require('node:fs');

const ensureDirectory = (directoryPath) => {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
};

module.exports = {
  ensureDirectory,
};
