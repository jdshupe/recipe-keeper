/**
 * Ingredients API Routes
 * 
 * Provides REST API endpoints for:
 * - Ingredient CRUD operations
 * - Pantry management
 * - Recipe-ingredient matching
 * - Price tracking
 */

const express = require('express');
const router = express.Router();
const ingredients = require('../lib/ingredients');

// =====================
// Ingredient Routes
// =====================

/**
 * GET /api/ingredients
 * Get all ingredients with optional search
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (q) {
      const results = await ingredients.searchIngredients(q, parseInt(limit));
      res.json(results);
    } else {
      const all = await ingredients.getAllIngredients();
      res.json(all.slice(0, parseInt(limit)));
    }
  } catch (err) {
    console.error('Error getting ingredients:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/categories
 * Get all ingredient categories
 */
router.get('/categories', (req, res) => {
  res.json(ingredients.INGREDIENT_CATEGORIES);
});

/**
 * GET /api/ingredients/allergens
 * Get all allergen definitions
 */
router.get('/allergens', (req, res) => {
  res.json({
    allergens: ingredients.ALLERGENS,
    keywords: ingredients.ALLERGEN_KEYWORDS
  });
});

/**
 * GET /api/ingredients/dietary-flags
 * Get all dietary flag definitions
 */
router.get('/dietary-flags', (req, res) => {
  res.json(ingredients.DIETARY_FLAGS);
});

/**
 * GET /api/ingredients/units
 * Get all unit definitions
 */
router.get('/units', (req, res) => {
  res.json(ingredients.UNITS);
});

/**
 * GET /api/ingredients/:id
 * Get ingredient by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const ingredient = await ingredients.getIngredientById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(ingredient);
  } catch (err) {
    console.error('Error getting ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients
 * Create a new ingredient
 */
router.post('/', async (req, res) => {
  try {
    const { name, aliases, category, subcategory, allergens: ingredientAllergens, 
            dietaryFlags, nutrition, defaultUnit, storageLocation, 
            shelfLife, substitutes, notes, imageUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if ingredient already exists
    const existing = await ingredients.findIngredientByName(name);
    if (existing) {
      return res.status(409).json({ 
        error: 'Ingredient already exists',
        existing
      });
    }
    
    const ingredient = await ingredients.createIngredient({
      name,
      aliases,
      category,
      subcategory,
      allergens: ingredientAllergens,
      dietaryFlags,
      nutrition,
      defaultUnit,
      storageLocation,
      shelfLife,
      substitutes,
      notes,
      imageUrl
    });
    
    res.status(201).json(ingredient);
  } catch (err) {
    console.error('Error creating ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/ingredients/:id
 * Update an ingredient
 */
router.put('/:id', async (req, res) => {
  try {
    const ingredient = await ingredients.updateIngredient(req.params.id, req.body);
    res.json(ingredient);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error updating ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ingredients/:id
 * Delete an ingredient
 */
router.delete('/:id', async (req, res) => {
  try {
    await ingredients.deleteIngredient(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients/:id/price
 * Add a price record to an ingredient
 */
router.post('/:id/price', async (req, res) => {
  try {
    const { price, quantity, unit, store, date } = req.body;
    
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    const record = await ingredients.addPriceRecord(req.params.id, {
      price,
      quantity,
      unit,
      store,
      date
    });
    
    res.status(201).json(record);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error adding price record:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients/parse
 * Parse an ingredient string into structured data
 */
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const parsed = ingredients.parseIngredientString(text);
    
    // Try to find matching ingredient in database
    const match = await ingredients.findIngredientByName(parsed.name);
    
    res.json({
      ...parsed,
      matchedIngredient: match
    });
  } catch (err) {
    console.error('Error parsing ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients/parse-bulk
 * Parse multiple ingredient strings
 */
router.post('/parse-bulk', async (req, res) => {
  try {
    const { ingredients: ingredientStrings } = req.body;
    
    if (!Array.isArray(ingredientStrings)) {
      return res.status(400).json({ error: 'Array of ingredients is required' });
    }
    
    const results = await Promise.all(
      ingredientStrings.map(async (text) => {
        const parsed = ingredients.parseIngredientString(text);
        const match = await ingredients.findIngredientByName(parsed.name);
        return {
          ...parsed,
          matchedIngredient: match
        };
      })
    );
    
    res.json(results);
  } catch (err) {
    console.error('Error parsing ingredients:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients/find-or-create
 * Find an ingredient by name or create it
 */
router.post('/find-or-create', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const ingredient = await ingredients.getOrCreateIngredient(name);
    res.json(ingredient);
  } catch (err) {
    console.error('Error finding/creating ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================
// Pantry Routes
// =====================

/**
 * GET /api/ingredients/pantry
 * Get all pantry items
 */
router.get('/pantry/items', async (req, res) => {
  try {
    const items = await ingredients.getPantryItems();
    res.json(items);
  } catch (err) {
    console.error('Error getting pantry items:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/expiring
 * Get pantry items expiring within N days
 */
router.get('/pantry/expiring', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const items = await ingredients.getExpiringItems(parseInt(days));
    res.json(items);
  } catch (err) {
    console.error('Error getting expiring items:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/expired
 * Get expired pantry items
 */
router.get('/pantry/expired', async (req, res) => {
  try {
    const items = await ingredients.getExpiredItems();
    res.json(items);
  } catch (err) {
    console.error('Error getting expired items:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ingredients/pantry
 * Add item to pantry
 */
router.post('/pantry', async (req, res) => {
  try {
    const { ingredientName, name, quantity, unit, location, 
            purchaseDate, expirationDate, opened, notes } = req.body;
    
    const itemName = ingredientName || name;
    if (!itemName) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }
    
    const item = await ingredients.addToPantry({
      ingredientName: itemName,
      quantity,
      unit,
      location,
      purchaseDate,
      expirationDate,
      opened,
      notes
    });
    
    res.status(201).json(item);
  } catch (err) {
    console.error('Error adding to pantry:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/ingredients/pantry/:id
 * Update pantry item
 */
router.put('/pantry/:id', async (req, res) => {
  try {
    const item = await ingredients.updatePantryItem(req.params.id, req.body);
    res.json(item);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error updating pantry item:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ingredients/pantry/:id
 * Remove item from pantry
 */
router.delete('/pantry/:id', async (req, res) => {
  try {
    await ingredients.removeFromPantry(req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error removing pantry item:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/check/:name
 * Check if an ingredient is in pantry
 */
router.get('/pantry/check/:name', async (req, res) => {
  try {
    const inPantry = await ingredients.isInPantry(req.params.name);
    res.json({ inPantry });
  } catch (err) {
    console.error('Error checking pantry:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
