const express = require('express');
const router = express.Router();
const {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionsForRecipe,
  updateRecipeCollections
} = require('../lib/collections');
const { getRecipeBySlug } = require('../lib/recipes');

// GET /api/collections - Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await getAllCollections();
    res.json({ data: collections, success: true });
  } catch (err) {
    console.error('Error getting collections:', err);
    res.status(500).json({ error: 'Failed to get collections', success: false });
  }
});

// POST /api/collections - Create new collection
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required', success: false });
    }
    
    const collection = await createCollection(name, description || '');
    res.json({ data: collection, success: true });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ error: 'Failed to create collection', success: false });
  }
});

// GET /api/collections/for-recipe/:slug - Get collections for a specific recipe
router.get('/for-recipe/:slug', async (req, res) => {
  try {
    const collections = await getCollectionsForRecipe(req.params.slug);
    res.json({ data: collections, success: true });
  } catch (err) {
    console.error('Error getting collections for recipe:', err);
    res.status(500).json({ error: 'Failed to get collections', success: false });
  }
});

// PUT /api/collections/for-recipe/:slug - Update recipe's collection memberships
router.put('/for-recipe/:slug', async (req, res) => {
  try {
    const { collectionIds } = req.body;
    
    if (!Array.isArray(collectionIds)) {
      return res.status(400).json({ error: 'collectionIds must be an array', success: false });
    }
    
    const collections = await updateRecipeCollections(req.params.slug, collectionIds);
    res.json({ data: collections, success: true });
  } catch (err) {
    console.error('Error updating recipe collections:', err);
    res.status(500).json({ error: 'Failed to update collections', success: false });
  }
});

// GET /api/collections/:id - Get single collection with recipe details
router.get('/:id', async (req, res) => {
  try {
    const collection = await getCollectionById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found', success: false });
    }
    
    // Fetch recipe details for each slug
    const recipes = [];
    for (const slug of collection.recipeSlugs) {
      const recipe = await getRecipeBySlug(slug);
      if (recipe) {
        recipes.push(recipe);
      }
    }
    
    res.json({ 
      data: { 
        ...collection, 
        recipes 
      }, 
      success: true 
    });
  } catch (err) {
    console.error('Error getting collection:', err);
    res.status(500).json({ error: 'Failed to get collection', success: false });
  }
});

// PUT /api/collections/:id - Update collection
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty', success: false });
    }
    
    const collection = await updateCollection(req.params.id, { name, description });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found', success: false });
    }
    
    res.json({ data: collection, success: true });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({ error: 'Failed to update collection', success: false });
  }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteCollection(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Collection not found', success: false });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ error: 'Failed to delete collection', success: false });
  }
});

// POST /api/collections/:id/recipes - Add recipe to collection
router.post('/:id/recipes', async (req, res) => {
  try {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: 'Recipe slug is required', success: false });
    }
    
    const collection = await addRecipeToCollection(req.params.id, slug);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found', success: false });
    }
    
    res.json({ data: collection, success: true });
  } catch (err) {
    console.error('Error adding recipe to collection:', err);
    res.status(500).json({ error: 'Failed to add recipe to collection', success: false });
  }
});

// DELETE /api/collections/:id/recipes/:slug - Remove recipe from collection
router.delete('/:id/recipes/:slug', async (req, res) => {
  try {
    const collection = await removeRecipeFromCollection(req.params.id, req.params.slug);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found', success: false });
    }
    
    res.json({ data: collection, success: true });
  } catch (err) {
    console.error('Error removing recipe from collection:', err);
    res.status(500).json({ error: 'Failed to remove recipe from collection', success: false });
  }
});

module.exports = router;
