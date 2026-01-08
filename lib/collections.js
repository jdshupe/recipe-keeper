const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { COLLECTIONS_DIR } = require('./config');
const { ensureDir } = require('./utils');

/**
 * Get all collections
 */
async function getAllCollections() {
  await ensureDir(COLLECTIONS_DIR);
  try {
    const files = await fs.readdir(COLLECTIONS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const collections = await Promise.all(jsonFiles.map(async (file) => {
      const content = await fs.readFile(path.join(COLLECTIONS_DIR, file), 'utf-8');
      return JSON.parse(content);
    }));
    
    // Sort by updatedAt descending
    return collections.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
  } catch (err) {
    console.error('Error reading collections:', err);
    return [];
  }
}

/**
 * Get a single collection by ID
 */
async function getCollectionById(id) {
  await ensureDir(COLLECTIONS_DIR);
  const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Create a new collection
 */
async function createCollection(name, description = '') {
  await ensureDir(COLLECTIONS_DIR);
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const collection = {
    id,
    name: name.trim(),
    description: description.trim(),
    recipeSlugs: [],
    createdAt: now,
    updatedAt: now
  };
  
  const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`Created collection: ${collection.name}`);
  
  return collection;
}

/**
 * Update a collection (name, description)
 */
async function updateCollection(id, updates) {
  const collection = await getCollectionById(id);
  if (!collection) return null;
  
  if (updates.name !== undefined) {
    collection.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    collection.description = updates.description.trim();
  }
  collection.updatedAt = new Date().toISOString();
  
  const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`Updated collection: ${collection.name}`);
  
  return collection;
}

/**
 * Delete a collection
 */
async function deleteCollection(id) {
  const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
  try {
    await fs.unlink(filePath);
    console.log(`Deleted collection: ${id}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * Add a recipe to a collection
 */
async function addRecipeToCollection(collectionId, recipeSlug) {
  const collection = await getCollectionById(collectionId);
  if (!collection) return null;
  
  // Don't add duplicates
  if (!collection.recipeSlugs.includes(recipeSlug)) {
    collection.recipeSlugs.push(recipeSlug);
    collection.updatedAt = new Date().toISOString();
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
    console.log(`Added recipe ${recipeSlug} to collection ${collection.name}`);
  }
  
  return collection;
}

/**
 * Remove a recipe from a collection
 */
async function removeRecipeFromCollection(collectionId, recipeSlug) {
  const collection = await getCollectionById(collectionId);
  if (!collection) return null;
  
  const index = collection.recipeSlugs.indexOf(recipeSlug);
  if (index > -1) {
    collection.recipeSlugs.splice(index, 1);
    collection.updatedAt = new Date().toISOString();
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf-8');
    console.log(`Removed recipe ${recipeSlug} from collection ${collection.name}`);
  }
  
  return collection;
}

/**
 * Get all collections that contain a specific recipe
 */
async function getCollectionsForRecipe(recipeSlug) {
  const collections = await getAllCollections();
  return collections.filter(c => c.recipeSlugs.includes(recipeSlug));
}

/**
 * Update recipe membership in multiple collections at once
 * @param {string} recipeSlug - The recipe slug
 * @param {string[]} collectionIds - Array of collection IDs the recipe should belong to
 */
async function updateRecipeCollections(recipeSlug, collectionIds) {
  const allCollections = await getAllCollections();
  
  for (const collection of allCollections) {
    const shouldBeMember = collectionIds.includes(collection.id);
    const isMember = collection.recipeSlugs.includes(recipeSlug);
    
    if (shouldBeMember && !isMember) {
      await addRecipeToCollection(collection.id, recipeSlug);
    } else if (!shouldBeMember && isMember) {
      await removeRecipeFromCollection(collection.id, recipeSlug);
    }
  }
  
  return await getCollectionsForRecipe(recipeSlug);
}

module.exports = {
  COLLECTIONS_DIR,
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionsForRecipe,
  updateRecipeCollections
};
