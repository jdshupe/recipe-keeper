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
 * GET /api/ingredients/substitutes
 * Get all substitution rules
 */
router.get('/substitutes', (req, res) => {
  res.json({
    success: true,
    data: ingredients.getAllSubstitutions()
  });
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
 * GET /api/ingredients/substitute/:name
 * Get substitutes for a specific ingredient
 */
router.get('/substitute/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { checkPantry } = req.query;
    
    const result = ingredients.getSubstitutes(name);
    
    // Optionally filter to only substitutes available in pantry
    if (checkPantry === 'true') {
      const availableSubs = await ingredients.getAvailableSubstitutes(name);
      result.availableInPantry = availableSubs;
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error getting substitutes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ingredients/substitutes/bulk
 * Get substitutes for multiple ingredients (with pantry check)
 */
router.post('/substitutes/bulk', async (req, res) => {
  try {
    const { ingredients: ingredientNames, checkPantry = true } = req.body;
    
    if (!Array.isArray(ingredientNames)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Array of ingredient names is required' 
      });
    }
    
    const results = {};
    
    for (const name of ingredientNames) {
      const subs = ingredients.getSubstitutes(name);
      
      if (checkPantry) {
        const available = await ingredients.getAvailableSubstitutes(name);
        results[name] = {
          ...subs,
          availableInPantry: available
        };
      } else {
        results[name] = subs;
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Error getting bulk substitutes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// Open Food Facts Contribution API
// (Must be before /:id route to avoid conflicts)
// ============================================

const { SETTINGS_FILE } = require('../lib/config');

/**
 * Load settings from file
 */
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return {
    openFoodFacts: {
      enabled: false,
      username: null,
      password: null,
      autoContribute: false
    }
  };
}

/**
 * Save settings to file
 */
function saveSettings(settings) {
  const { CONTENT_DIR } = require('../lib/config');
  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/**
 * GET /api/ingredients/off-settings
 * Get Open Food Facts contribution settings (without password)
 */
router.get('/off-settings', (req, res) => {
  const settings = loadSettings();
  res.json({
    enabled: settings.openFoodFacts?.enabled || false,
    username: settings.openFoodFacts?.username || null,
    hasPassword: !!settings.openFoodFacts?.password,
    autoContribute: settings.openFoodFacts?.autoContribute || false
  });
});

/**
 * POST /api/ingredients/off-settings
 * Save Open Food Facts contribution settings
 */
router.post('/off-settings', (req, res) => {
  try {
    const { enabled, username, password, autoContribute } = req.body;
    console.log('Saving OFF settings for user:', username);
    
    const settings = loadSettings();
    
    settings.openFoodFacts = {
      enabled: !!enabled,
      username: username || null,
      password: password || settings.openFoodFacts?.password || null,
      autoContribute: !!autoContribute
    };
    
    saveSettings(settings);
    console.log('OFF settings saved successfully');
    
    res.json({
      success: true,
      enabled: settings.openFoodFacts.enabled,
      username: settings.openFoodFacts.username,
      hasPassword: !!settings.openFoodFacts.password,
      autoContribute: settings.openFoodFacts.autoContribute
    });
  } catch (err) {
    console.error('Error saving OFF settings:', err);
    res.status(500).json({ error: 'Failed to save settings', details: err.message });
  }
});

/**
 * POST /api/ingredients/off-test-login
 * Test Open Food Facts credentials
 */
router.post('/off-test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Test by getting user info via a simple authenticated request
    const response = await fetch('https://world.openfoodfacts.org/cgi/auth.pl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RecipeKeeper/1.4.0 (https://github.com/jdshupe/recipe-keeper)'
      },
      body: new URLSearchParams({
        user_id: username,
        password: password
      })
    });
    
    const text = await response.text();
    
    // If login successful, response contains user info
    if (text.includes('user_id') || response.ok) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error testing OFF login:', err);
    res.status(500).json({ error: 'Failed to test login' });
  }
});

/**
 * POST /api/ingredients/off-contribute
 * Contribute product data to Open Food Facts
 */
router.post('/off-contribute', async (req, res) => {
  try {
    const settings = loadSettings();
    
    if (!settings.openFoodFacts?.enabled || !settings.openFoodFacts?.username || !settings.openFoodFacts?.password) {
      return res.status(400).json({ 
        error: 'Open Food Facts contribution not configured',
        message: 'Please configure your Open Food Facts account in settings first.'
      });
    }
    
    const {
      barcode,
      productName,
      brand,
      quantity,
      categories,
      ingredients,
      labels,
      stores,
      origins,
      nutrition
    } = req.body;
    
    if (!barcode || !productName) {
      return res.status(400).json({ error: 'Barcode and product name are required' });
    }
    
    // Build the form data for Open Food Facts
    const formData = new URLSearchParams();
    
    // Authentication
    formData.append('user_id', settings.openFoodFacts.username);
    formData.append('password', settings.openFoodFacts.password);
    
    // App identification
    formData.append('app_name', 'RecipeKeeper');
    formData.append('app_version', '1.4.0');
    formData.append('comment', 'Contributed via Recipe Keeper app');
    
    // Product data
    formData.append('code', barcode);
    formData.append('product_name', productName);
    
    if (brand) formData.append('brands', brand);
    if (quantity) formData.append('quantity', quantity);
    if (categories) formData.append('categories', categories);
    if (ingredients) formData.append('ingredients_text', ingredients);
    if (labels) formData.append('labels', labels);
    if (stores) formData.append('stores', stores);
    if (origins) formData.append('origins', origins);
    
    // Nutrition data (per 100g)
    if (nutrition) {
      if (nutrition.calories) formData.append('nutriment_energy-kcal_100g', nutrition.calories);
      if (nutrition.fat) formData.append('nutriment_fat_100g', nutrition.fat);
      if (nutrition.saturatedFat) formData.append('nutriment_saturated-fat_100g', nutrition.saturatedFat);
      if (nutrition.carbohydrates) formData.append('nutriment_carbohydrates_100g', nutrition.carbohydrates);
      if (nutrition.sugars) formData.append('nutriment_sugars_100g', nutrition.sugars);
      if (nutrition.fiber) formData.append('nutriment_fiber_100g', nutrition.fiber);
      if (nutrition.protein) formData.append('nutriment_proteins_100g', nutrition.protein);
      if (nutrition.sodium) formData.append('nutriment_sodium_100g', nutrition.sodium);
      if (nutrition.salt) formData.append('nutriment_salt_100g', nutrition.salt);
    }
    
    // Submit to Open Food Facts
    const response = await fetch('https://world.openfoodfacts.org/cgi/product_jqm2.pl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RecipeKeeper/1.4.0 (https://github.com/jdshupe/recipe-keeper)'
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.status === 1 || result.status_verbose === 'fields saved') {
      res.json({
        success: true,
        message: 'Product contributed to Open Food Facts! Thank you for helping build the open food database.',
        productUrl: `https://world.openfoodfacts.org/product/${barcode}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to contribute product',
        details: result.status_verbose || result.error || 'Unknown error'
      });
    }
  } catch (err) {
    console.error('Error contributing to OFF:', err);
    res.status(500).json({ 
      error: 'Failed to contribute to Open Food Facts',
      message: err.message
    });
  }
});

/**
 * POST /api/ingredients/off-upload-image
 * Upload a product image to Open Food Facts
 */
router.post('/off-upload-image', async (req, res) => {
  try {
    const settings = loadSettings();
    
    if (!settings.openFoodFacts?.enabled || !settings.openFoodFacts?.username || !settings.openFoodFacts?.password) {
      return res.status(400).json({ error: 'Open Food Facts contribution not configured' });
    }
    
    const { barcode, imageType, imageData } = req.body;
    
    if (!barcode || !imageType || !imageData) {
      return res.status(400).json({ error: 'Barcode, image type, and image data are required' });
    }
    
    // Valid image types: front, ingredients, nutrition, packaging
    const validTypes = ['front', 'ingredients', 'nutrition', 'packaging'];
    if (!validTypes.includes(imageType)) {
      return res.status(400).json({ error: `Image type must be one of: ${validTypes.join(', ')}` });
    }
    
    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data for image upload
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('user_id', settings.openFoodFacts.username);
    formData.append('password', settings.openFoodFacts.password);
    formData.append('code', barcode);
    formData.append('imagefield', `${imageType}_en`);
    formData.append(`imgupload_${imageType}_en`, imageBuffer, {
      filename: `${barcode}_${imageType}.jpg`,
      contentType: 'image/jpeg'
    });
    
    const response = await fetch('https://world.openfoodfacts.org/cgi/product_image_upload.pl', {
      method: 'POST',
      headers: {
        'User-Agent': 'RecipeKeeper/1.4.0 (https://github.com/jdshupe/recipe-keeper)',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.status === 'status ok') {
      res.json({
        success: true,
        message: `${imageType} image uploaded successfully!`,
        imageUrl: result.image?.display_url || null
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to upload image',
        details: result.error || 'Unknown error'
      });
    }
  } catch (err) {
    console.error('Error uploading image to OFF:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
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
 * GET /api/ingredients/:id/price-history
 * Get full price history with statistics for an ingredient
 */
router.get('/:id/price-history', async (req, res) => {
  try {
    const priceHistory = await ingredients.getPriceHistory(req.params.id);
    res.json({
      success: true,
      data: priceHistory
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    console.error('Error getting price history:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ingredients/price-history/:name
 * Get price history by ingredient name
 */
router.get('/price-history/:name', async (req, res) => {
  try {
    const priceHistory = await ingredients.getPriceHistoryByName(req.params.name);
    res.json({
      success: true,
      data: priceHistory
    });
  } catch (err) {
    console.error('Error getting price history by name:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ingredients/shelf-life/:category/:location
 * Get default shelf life for a category and location
 */
router.get('/shelf-life/:category/:location', (req, res) => {
  try {
    const { category, location } = req.params;
    const shelfLife = ingredients.getShelfLifeInfo(category, location);
    res.json({
      success: true,
      data: shelfLife
    });
  } catch (err) {
    console.error('Error getting shelf life:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ingredients/shelf-life/suggest
 * Get suggested expiration date for an ingredient
 */
router.get('/shelf-life/suggest', (req, res) => {
  try {
    const { name, category, location } = req.query;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ingredient name is required' 
      });
    }
    
    const suggestion = ingredients.getDefaultExpirationDate(name, category, location);
    res.json({
      success: true,
      data: suggestion
    });
  } catch (err) {
    console.error('Error getting shelf life suggestion:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ingredients/shelf-life-defaults
 * Get all shelf life defaults
 */
router.get('/shelf-life-defaults', (req, res) => {
  res.json({
    success: true,
    data: {
      byCategory: ingredients.SHELF_LIFE_DEFAULTS,
      byIngredient: ingredients.INGREDIENT_SHELF_LIFE
    }
  });
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
 * POST /api/ingredients/pantry/bulk
 * Bulk add items to pantry
 */
router.post('/pantry/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Array of items is required' });
    }
    
    const results = await ingredients.bulkAddToPantry(items);
    
    res.status(201).json({
      success: true,
      added: results.success.length,
      failed: results.errors.length,
      items: results.success,
      errors: results.errors
    });
  } catch (err) {
    console.error('Error bulk adding to pantry:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/frequent
 * Get frequently added items (added 3+ times)
 */
router.get('/pantry/frequent', async (req, res) => {
  try {
    const { minCount = 3, limit = 15 } = req.query;
    const items = await ingredients.getFrequentlyAddedItems(
      parseInt(minCount),
      parseInt(limit)
    );
    res.json(items);
  } catch (err) {
    console.error('Error getting frequent items:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/insights
 * Get shopping frequency insights
 */
router.get('/pantry/insights', async (req, res) => {
  try {
    const insights = await ingredients.getShoppingFrequencyInsights();
    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    console.error('Error getting shopping insights:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ingredients/pantry/recent
 * Get recently added items
 */
router.get('/pantry/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const items = await ingredients.getRecentlyAddedItems(parseInt(limit));
    res.json(items);
  } catch (err) {
    console.error('Error getting recent items:', err);
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

// =====================
// Barcode Lookup Routes
// =====================

/**
 * Map Open Food Facts categories to our category system
 */
function mapOpenFoodFactsCategory(offCategories) {
  if (!offCategories) return 'other';
  
  const categoryText = offCategories.toLowerCase();
  
  // Check for specific category keywords
  const categoryMappings = {
    produce: ['fruit', 'vegetable', 'produce', 'fresh', 'salad', 'herb', 'lettuce', 'apple', 'banana', 'tomato', 'onion', 'potato', 'carrot'],
    dairy: ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
    meat: ['meat', 'poultry', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'salmon', 'tuna', 'shrimp', 'sausage', 'bacon', 'ham'],
    bakery: ['bread', 'bakery', 'baked', 'pastry', 'bun', 'roll', 'croissant', 'bagel', 'tortilla'],
    pantry: ['canned', 'pasta', 'rice', 'cereal', 'grain', 'bean', 'sauce', 'oil', 'vinegar', 'condiment', 'soup', 'broth', 'flour', 'sugar', 'honey', 'syrup', 'nut butter', 'jam', 'jelly'],
    spices: ['spice', 'seasoning', 'herb', 'pepper', 'salt', 'curry', 'cumin'],
    frozen: ['frozen', 'ice cream', 'sorbet', 'gelato'],
    beverages: ['beverage', 'drink', 'juice', 'soda', 'water', 'tea', 'coffee', 'wine', 'beer', 'milk']
  };
  
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => categoryText.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Extract allergens from Open Food Facts data
 */
function extractAllergens(product) {
  const allergens = [];
  const allergenTags = product.allergens_tags || [];
  const allergenText = (product.allergens || '').toLowerCase();
  
  const allergenMappings = {
    dairy: ['milk', 'dairy', 'lactose'],
    eggs: ['egg'],
    fish: ['fish'],
    shellfish: ['shellfish', 'crustacean', 'mollusc'],
    treeNuts: ['nuts', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia'],
    peanuts: ['peanut'],
    wheat: ['wheat', 'gluten'],
    soy: ['soy', 'soya'],
    sesame: ['sesame']
  };
  
  for (const [allergen, keywords] of Object.entries(allergenMappings)) {
    const inTags = allergenTags.some(tag => 
      keywords.some(kw => tag.toLowerCase().includes(kw))
    );
    const inText = keywords.some(kw => allergenText.includes(kw));
    
    if (inTags || inText) {
      allergens.push(allergen);
    }
  }
  
  return allergens;
}

/**
 * GET /api/ingredients/barcode/:barcode
 * Look up product information from Open Food Facts by barcode
 */
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    // Validate barcode format (should be numeric, typically 8-14 digits)
    if (!/^\d{8,14}$/.test(barcode)) {
      return res.status(400).json({ 
        error: 'Invalid barcode format',
        message: 'Barcode should be 8-14 digits'
      });
    }
    
    // Fetch from Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    // Handle 404 - product not in database
    if (response.status === 404) {
      return res.status(404).json({
        found: false,
        error: 'Product not found',
        message: 'This barcode was not found in the Open Food Facts database. You can add it manually.',
        barcode
      });
    }
    
    // Handle other non-OK responses
    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'This barcode was not found in the Open Food Facts database. You can add it manually.',
        barcode
      });
    }
    
    const product = data.product;
    
    // Extract relevant information
    const result = {
      barcode,
      found: true,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || null,
      genericName: product.generic_name || product.generic_name_en || null,
      category: mapOpenFoodFactsCategory(product.categories),
      categories: product.categories || null,
      quantity: product.quantity || null,
      servingSize: product.serving_size || null,
      imageUrl: product.image_front_url || product.image_url || null,
      thumbnailUrl: product.image_front_thumb_url || product.image_thumb_url || null,
      allergens: extractAllergens(product),
      allergenText: product.allergens || null,
      ingredients: product.ingredients_text || product.ingredients_text_en || null,
      nutrition: product.nutriments ? {
        calories: product.nutriments['energy-kcal_100g'] || product.nutriments['energy-kcal'] || null,
        fat: product.nutriments.fat_100g || product.nutriments.fat || null,
        saturatedFat: product.nutriments['saturated-fat_100g'] || product.nutriments['saturated-fat'] || null,
        carbohydrates: product.nutriments.carbohydrates_100g || product.nutriments.carbohydrates || null,
        sugars: product.nutriments.sugars_100g || product.nutriments.sugars || null,
        fiber: product.nutriments.fiber_100g || product.nutriments.fiber || null,
        protein: product.nutriments.proteins_100g || product.nutriments.proteins || null,
        sodium: product.nutriments.sodium_100g || product.nutriments.sodium || null,
        salt: product.nutriments.salt_100g || product.nutriments.salt || null
      } : null,
      nutriscore: product.nutriscore_grade || null,
      novaGroup: product.nova_group || null,
      labels: product.labels || null,
      origins: product.origins || null,
      stores: product.stores || null,
      openFoodFactsUrl: `https://world.openfoodfacts.org/product/${barcode}`
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error looking up barcode:', err);
    res.status(500).json({ 
      error: 'Failed to lookup barcode',
      message: err.message
    });
  }
});

module.exports = router;
