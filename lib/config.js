const path = require('path');

// Content storage paths
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const RECIPES_DIR = path.join(CONTENT_DIR, 'recipes');
const LISTS_DIR = path.join(CONTENT_DIR, 'shopping-lists');
const COLLECTIONS_DIR = path.join(CONTENT_DIR, 'collections');

module.exports = {
  CONTENT_DIR,
  RECIPES_DIR,
  LISTS_DIR,
  COLLECTIONS_DIR
};
