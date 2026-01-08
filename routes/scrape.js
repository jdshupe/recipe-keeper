const express = require('express');
const router = express.Router();
const { scrapeRecipe } = require('../lib/scraper');
const { saveRecipe, getRecipeBySlug } = require('../lib/recipes');

// POST /api/scrape - Scrape recipe from URL
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required', success: false });
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL', success: false });
    }
    
    const recipe = await scrapeRecipe(url);
    
    // Check if slug already exists, append number if so
    let slug = recipe.slug;
    let counter = 1;
    while (await getRecipeBySlug(slug)) {
      slug = `${recipe.slug}-${counter}`;
      counter++;
    }
    recipe.slug = slug;
    
    await saveRecipe(recipe);
    res.json({ data: recipe, success: true });
  } catch (err) {
    console.error('Error scraping recipe:', err);
    res.status(500).json({ error: err.message || 'Failed to scrape recipe', success: false });
  }
});

module.exports = router;
