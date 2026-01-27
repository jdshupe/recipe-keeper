const path = require('path');

// Content storage paths
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const RECIPES_DIR = path.join(CONTENT_DIR, 'recipes');
const LISTS_DIR = path.join(CONTENT_DIR, 'shopping-lists');
const COLLECTIONS_DIR = path.join(CONTENT_DIR, 'collections');
const INGREDIENTS_DIR = path.join(CONTENT_DIR, 'ingredients');
const SETTINGS_FILE = path.join(CONTENT_DIR, 'settings.json');

module.exports = {
  CONTENT_DIR,
  RECIPES_DIR,
  LISTS_DIR,
  COLLECTIONS_DIR,
  INGREDIENTS_DIR,
  SETTINGS_FILE
};
