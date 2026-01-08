const fs = require('fs').promises;

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to ensure exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

module.exports = { ensureDir };
