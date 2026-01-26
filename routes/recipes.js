const express = require('express');
const router = express.Router();
const { getAllRecipes, getRecipeBySlug, saveRecipe, deleteRecipe, generateSlug, getAllTags, renameTag, deleteTag, getRecipesByTag, checkForDuplicates } = require('../lib/recipes');
const ingredients = require('../lib/ingredients');

// POST /api/recipes/check-duplicates - Check for potential duplicate recipes
router.post('/check-duplicates', async (req, res) => {
  try {
    const { title, sourceUrl } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required', success: false });
    }
    
    const duplicates = await checkForDuplicates(title, sourceUrl);
    res.json({ data: duplicates, success: true });
  } catch (err) {
    console.error('Error checking duplicates:', err);
    res.status(500).json({ error: 'Failed to check for duplicates', success: false });
  }
});

// GET /api/tags - Get all unique tags with counts
router.get('/tags', async (req, res) => {
  try {
    const tags = await getAllTags();
    res.json({ data: tags, success: true });
  } catch (err) {
    console.error('Error getting tags:', err);
    res.status(500).json({ error: 'Failed to get tags', success: false });
  }
});

// PUT /api/tags/:tag - Rename a tag
router.put('/tags/:tag', async (req, res) => {
  try {
    const { newTag } = req.body;
    if (!newTag || !newTag.trim()) {
      return res.status(400).json({ error: 'New tag name is required', success: false });
    }
    
    const updatedCount = await renameTag(req.params.tag, newTag);
    res.json({ data: { updatedCount, newTag: newTag.trim() }, success: true });
  } catch (err) {
    console.error('Error renaming tag:', err);
    res.status(500).json({ error: 'Failed to rename tag', success: false });
  }
});

// DELETE /api/tags/:tag - Delete a tag from all recipes
router.delete('/tags/:tag', async (req, res) => {
  try {
    const updatedCount = await deleteTag(req.params.tag);
    res.json({ data: { updatedCount }, success: true });
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ error: 'Failed to delete tag', success: false });
  }
});

// GET /api/tags/:tag/recipes - Get recipes with a specific tag
router.get('/tags/:tag/recipes', async (req, res) => {
  try {
    const recipes = await getRecipesByTag(req.params.tag);
    res.json({ data: recipes, success: true });
  } catch (err) {
    console.error('Error getting recipes by tag:', err);
    res.status(500).json({ error: 'Failed to get recipes by tag', success: false });
  }
});

// POST /api/recipes - Create a new recipe
router.post('/', async (req, res) => {
  try {
    const { title, description, prepTime, cookTime, servings, tags, source, image, ingredients, instructions } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required', success: false });
    }
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required', success: false });
    }
    
    if (!instructions || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required', success: false });
    }
    
    const slug = generateSlug(title);
    
    // Check if recipe with this slug already exists
    const existing = await getRecipeBySlug(slug);
    if (existing) {
      return res.status(400).json({ error: 'A recipe with a similar title already exists', success: false });
    }
    
    const recipe = {
      slug,
      title: title.trim(),
      description: description?.trim() || '',
      prepTime: prepTime?.trim() || null,
      cookTime: cookTime?.trim() || null,
      servings: servings?.trim() || null,
      tags: tags || [],
      source: source?.trim() || null,
      image: image?.trim() || '',
      ingredients,
      instructions,
      dateAdded: new Date().toISOString()
    };
    
    await saveRecipe(recipe);
    res.status(201).json({ data: recipe, success: true });
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ error: 'Failed to create recipe', success: false });
  }
});

// GET /api/recipes - Get all recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await getAllRecipes();
    res.json({ data: recipes, success: true });
  } catch (err) {
    console.error('Error getting recipes:', err);
    res.status(500).json({ error: 'Failed to get recipes', success: false });
  }
});

// PATCH /api/recipes/:slug/favorite - Toggle favorite status
// NOTE: Must come BEFORE /:slug routes to match correctly
router.patch('/:slug/favorite', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    recipe.favorite = !recipe.favorite;
    await saveRecipe(recipe);
    res.json({ data: { favorite: recipe.favorite }, success: true });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Failed to toggle favorite', success: false });
  }
});

// PATCH /api/recipes/:slug/rating - Update recipe rating
router.patch('/:slug/rating', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    const { rating } = req.body;
    // Validate rating is 0-5
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 0 and 5', success: false });
    }
    recipe.rating = rating;
    await saveRecipe(recipe);
    res.json({ data: { rating: recipe.rating }, success: true });
  } catch (err) {
    console.error('Error updating rating:', err);
    res.status(500).json({ error: 'Failed to update rating', success: false });
  }
});

// PATCH /api/recipes/:slug/notes - Update recipe personal notes
router.patch('/:slug/notes', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    const { personalNotes } = req.body;
    recipe.personalNotes = personalNotes || '';
    await saveRecipe(recipe);
    res.json({ data: { personalNotes: recipe.personalNotes }, success: true });
  } catch (err) {
    console.error('Error updating notes:', err);
    res.status(500).json({ error: 'Failed to update notes', success: false });
  }
});

// GET /api/recipes/:slug/nutrition - Calculate recipe nutrition
router.get('/:slug/nutrition', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    const nutrition = await ingredients.calculateRecipeNutrition(recipe);
    res.json({ 
      data: nutrition, 
      success: nutrition.success,
      error: nutrition.error 
    });
  } catch (err) {
    console.error('Error calculating nutrition:', err);
    res.status(500).json({ error: 'Failed to calculate nutrition', success: false });
  }
});

// GET /api/recipes/:slug/cost - Estimate recipe cost
router.get('/:slug/cost', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    const costEstimate = await ingredients.estimateRecipeCost(recipe);
    res.json({ 
      data: costEstimate, 
      success: true 
    });
  } catch (err) {
    console.error('Error estimating cost:', err);
    res.status(500).json({ error: 'Failed to estimate recipe cost', success: false });
  }
});

// GET /api/recipes/:slug/substitutes - Get substitutes for missing ingredients
router.get('/:slug/substitutes', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    // Get missing ingredients from pantry comparison
    const needed = await ingredients.getShoppingNeededForRecipe(recipe);
    
    // For each missing ingredient, find available substitutes
    const substitutions = [];
    for (const item of needed) {
      const available = await ingredients.getAvailableSubstitutes(item.name);
      if (available.length > 0) {
        substitutions.push({
          missing: item.name,
          quantity: item.quantity,
          unit: item.unit,
          substitutes: available
        });
      }
    }
    
    res.json({ 
      data: {
        missingIngredients: needed.map(n => n.name),
        substitutionsAvailable: substitutions
      },
      success: true 
    });
  } catch (err) {
    console.error('Error getting substitutes:', err);
    res.status(500).json({ error: 'Failed to get substitutes', success: false });
  }
});

// GET /api/recipes/:slug - Get single recipe
router.get('/:slug', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    res.json({ data: recipe, success: true });
  } catch (err) {
    console.error('Error getting recipe:', err);
    res.status(500).json({ error: 'Failed to get recipe', success: false });
  }
});

// PUT /api/recipes/:slug - Update recipe
router.put('/:slug', async (req, res) => {
  try {
    const existing = await getRecipeBySlug(req.params.slug);
    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    const { title, description, prepTime, cookTime, servings, tags, source, image, ingredients, instructions } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required', success: false });
    }
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required', success: false });
    }
    
    if (!instructions || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required', success: false });
    }
    
    // Generate new slug from title
    const newSlug = generateSlug(title);
    const oldSlug = req.params.slug;
    
    // If slug changed, check for conflicts and delete old file
    if (newSlug !== oldSlug) {
      const conflicting = await getRecipeBySlug(newSlug);
      if (conflicting) {
        return res.status(400).json({ error: 'A recipe with a similar title already exists', success: false });
      }
      // Delete old recipe file
      await deleteRecipe(oldSlug);
    }
    
    // Build updated recipe, preserving fields not in form
    const updated = {
      slug: newSlug,
      title: title.trim(),
      description: description?.trim() || '',
      prepTime: prepTime?.trim() || null,
      cookTime: cookTime?.trim() || null,
      servings: servings?.trim() || null,
      tags: tags || [],
      source: source?.trim() || null,
      image: image?.trim() || '',
      ingredients,
      instructions,
      // Preserve existing fields
      favorite: existing.favorite || false,
      rating: existing.rating || 0,
      personalNotes: existing.personalNotes || '',
      dateAdded: existing.dateAdded || new Date().toISOString(),
      content: existing.content || ''
    };
    
    await saveRecipe(updated);
    res.json({ data: updated, success: true });
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ error: 'Failed to update recipe', success: false });
  }
});

// DELETE /api/recipes/:slug - Delete recipe
router.delete('/:slug', async (req, res) => {
  try {
    await deleteRecipe(req.params.slug);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ error: 'Failed to delete recipe', success: false });
  }
});

// =====================
// Pantry-Recipe Integration Routes
// =====================

// GET /api/recipes/pantry-match - Get recipes sorted by pantry match
router.get('/pantry-match', async (req, res) => {
  try {
    const { minMatch = 0, limit = 20 } = req.query;
    const allRecipes = await getAllRecipes();
    const matched = await ingredients.getRecipesMatchingPantry(allRecipes);
    
    // Filter by minimum match percentage
    const filtered = matched.filter(m => m.matchPercentage >= parseInt(minMatch));
    
    res.json({ 
      data: filtered.slice(0, parseInt(limit)),
      success: true 
    });
  } catch (err) {
    console.error('Error matching recipes to pantry:', err);
    res.status(500).json({ error: 'Failed to match recipes', success: false });
  }
});

// GET /api/recipes/:slug/shopping-needed - Get shopping items needed for recipe
router.get('/:slug/shopping-needed', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    const needed = await ingredients.getShoppingNeededForRecipe(recipe);
    res.json({ data: needed, success: true });
  } catch (err) {
    console.error('Error getting shopping needed:', err);
    res.status(500).json({ error: 'Failed to get shopping needed', success: false });
  }
});

// GET /api/recipes/:slug/cost-estimate - Estimate recipe cost
router.get('/:slug/cost-estimate', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    const estimate = await ingredients.estimateRecipeCost(recipe);
    res.json({ data: estimate, success: true });
  } catch (err) {
    console.error('Error estimating cost:', err);
    res.status(500).json({ error: 'Failed to estimate cost', success: false });
  }
});

// GET /api/recipes/:slug/parsed-ingredients - Get parsed ingredients for a recipe
router.get('/:slug/parsed-ingredients', async (req, res) => {
  try {
    const recipe = await getRecipeBySlug(req.params.slug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return res.json({ data: [], success: true });
    }
    
    const parsed = await Promise.all(
      recipe.ingredients.map(async (ingredientStr) => {
        const p = ingredients.parseIngredientString(ingredientStr);
        const match = await ingredients.findIngredientByName(p.name);
        const inPantry = await ingredients.isInPantry(p.name);
        return {
          ...p,
          matchedIngredient: match,
          inPantry
        };
      })
    );
    
    res.json({ data: parsed, success: true });
  } catch (err) {
    console.error('Error parsing ingredients:', err);
    res.status(500).json({ error: 'Failed to parse ingredients', success: false });
  }
});

module.exports = router;
