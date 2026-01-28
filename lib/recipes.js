const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { RECIPES_DIR } = require('./config');
const { ensureDir } = require('./utils');
const { parseAndMatchIngredients, getIngredientDetails } = require('./ingredients');

/**
 * Check if ingredients array is in structured format (objects) vs plain text (strings)
 * @param {Array} ingredients - The ingredients array to check
 * @returns {boolean} - True if structured format, false if plain text or invalid
 */
function isStructuredIngredients(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return false;
  }
  // Check first non-null ingredient
  const firstIngredient = ingredients.find(ing => ing != null);
  if (!firstIngredient) return false;
  
  // Structured ingredients are objects with at least a 'name' property
  return typeof firstIngredient === 'object' && 
         firstIngredient !== null && 
         typeof firstIngredient.name === 'string';
}

async function getAllRecipes() {
  await ensureDir(RECIPES_DIR);
  try {
    const files = await fs.readdir(RECIPES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const recipes = await Promise.all(mdFiles.map(async (file) => {
      const slug = file.replace('.md', '');
      const content = await fs.readFile(path.join(RECIPES_DIR, file), 'utf-8');
      const { data, content: body } = matter(content);
      return { slug, ...data, content: body.trim() };
    }));
    
    return recipes.sort((a, b) => 
      new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)
    );
  } catch (err) {
    console.error('Error reading recipes:', err);
    return [];
  }
}

async function getRecipeBySlug(slug) {
  await ensureDir(RECIPES_DIR);
  const filePath = path.join(RECIPES_DIR, `${slug}.md`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    return { slug, ...data, content: body.trim() };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function saveRecipe(recipe) {
  await ensureDir(RECIPES_DIR);
  const { content, ...frontmatter } = recipe;
  
  // Handle ingredients - structured ingredients are stored as YAML objects
  // No special processing needed here as gray-matter handles YAML serialization
  // Both plain text arrays and structured object arrays are serialized correctly
  
  const filePath = path.join(RECIPES_DIR, `${recipe.slug}.md`);
  const fileContent = matter.stringify(content || '', frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  console.log(`Saved recipe: ${recipe.title}`);
}

/**
 * Convert a recipe's plain text ingredients to structured format
 * @param {Object} recipe - Recipe with plain text ingredients
 * @returns {Object} - Recipe with structured ingredients
 */
async function convertToStructuredIngredients(recipe) {
  if (!recipe) return recipe;
  
  const ingredients = recipe.ingredients;
  
  // If no ingredients or already structured, return as-is
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return recipe;
  }
  
  if (isStructuredIngredients(ingredients)) {
    return recipe; // Already structured
  }
  
  // Convert plain text ingredients to structured format
  try {
    const structuredIngredients = await parseAndMatchIngredients(ingredients);
    return {
      ...recipe,
      ingredients: structuredIngredients
    };
  } catch (err) {
    console.error('Error converting ingredients to structured format:', err);
    return recipe; // Return original on error
  }
}

/**
 * Get a recipe with enriched ingredient details from the database
 * @param {string} slug - Recipe slug
 * @returns {Object|null} - Recipe with enrichedIngredients array, or null if not found
 */
async function getRecipeWithIngredientDetails(slug) {
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return null;
  
  const ingredients = recipe.ingredients;
  
  // If no ingredients, return recipe with empty enriched array
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return {
      ...recipe,
      enrichedIngredients: []
    };
  }
  
  // If ingredients are plain text, convert first
  let structuredIngredients;
  if (!isStructuredIngredients(ingredients)) {
    try {
      structuredIngredients = await parseAndMatchIngredients(ingredients);
    } catch (err) {
      console.error('Error parsing ingredients:', err);
      structuredIngredients = [];
    }
  } else {
    structuredIngredients = ingredients;
  }
  
  // Enrich each ingredient with database details
  const enrichedIngredients = await Promise.all(
    structuredIngredients.map(async (ing) => {
      if (!ing) return null;
      
      // Start with the structured ingredient data
      const enriched = { ...ing };
      
      // If matched to database, get full details
      if (ing.ingredientId) {
        try {
          const details = await getIngredientDetails(ing.ingredientId);
          if (details) {
            // Add database fields to the enriched ingredient
            enriched.category = details.category;
            enriched.allergens = details.allergens;
            enriched.nutrition = details.nutrition;
            enriched.dietaryFlags = details.dietaryFlags;
            enriched.dbName = details.name; // Original database name
          }
        } catch (err) {
          console.error(`Error getting details for ingredient ${ing.ingredientId}:`, err);
        }
      }
      
      return enriched;
    })
  );
  
  // Filter out nulls
  return {
    ...recipe,
    enrichedIngredients: enrichedIngredients.filter(ing => ing !== null)
  };
}

/**
 * Migrate a recipe from plain text ingredients to structured format and save
 * @param {string} slug - Recipe slug
 * @returns {Object|null} - Updated recipe, or null if not found
 */
async function migrateRecipeIngredients(slug) {
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return null;
  
  // Check if already structured
  if (recipe.ingredients && isStructuredIngredients(recipe.ingredients)) {
    console.log(`Recipe "${recipe.title}" already has structured ingredients`);
    return recipe;
  }
  
  // Convert to structured format
  const updatedRecipe = await convertToStructuredIngredients(recipe);
  
  // Save the updated recipe
  await saveRecipe(updatedRecipe);
  console.log(`Migrated ingredients for recipe: ${recipe.title}`);
  
  return updatedRecipe;
}

async function deleteRecipe(slug) {
  const filePath = path.join(RECIPES_DIR, `${slug}.md`);
  try {
    await fs.unlink(filePath);
    console.log(`Deleted recipe: ${slug}`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Get all unique tags across all recipes with counts
async function getAllTags() {
  const recipes = await getAllRecipes();
  const tagCounts = {};
  
  recipes.forEach(recipe => {
    if (recipe.tags && Array.isArray(recipe.tags)) {
      recipe.tags.forEach(tag => {
        // Ensure tag is a string before processing
        if (tag && typeof tag === 'string') {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        }
      });
    }
  });
  
  // Convert to array of { tag, count } objects, sorted alphabetically
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

// Rename a tag across all recipes
async function renameTag(oldTag, newTag) {
  const recipes = await getAllRecipes();
  const oldTagLower = oldTag.toLowerCase().trim();
  const newTagTrimmed = newTag.trim();
  let updatedCount = 0;
  
  for (const recipe of recipes) {
    if (recipe.tags && Array.isArray(recipe.tags)) {
      const tagIndex = recipe.tags.findIndex(t => typeof t === 'string' && t.toLowerCase() === oldTagLower);
      if (tagIndex !== -1) {
        recipe.tags[tagIndex] = newTagTrimmed;
        await saveRecipe(recipe);
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

// Delete a tag from all recipes
async function deleteTag(tagToDelete) {
  const recipes = await getAllRecipes();
  const tagLower = tagToDelete.toLowerCase().trim();
  let updatedCount = 0;
  
  for (const recipe of recipes) {
    if (recipe.tags && Array.isArray(recipe.tags)) {
      const originalLength = recipe.tags.length;
      recipe.tags = recipe.tags.filter(t => t.toLowerCase() !== tagLower);
      if (recipe.tags.length !== originalLength) {
        await saveRecipe(recipe);
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

// Get recipes by tag
async function getRecipesByTag(tag) {
  const recipes = await getAllRecipes();
  const tagLower = tag.toLowerCase().trim();
  
  return recipes.filter(recipe => 
    recipe.tags && 
    Array.isArray(recipe.tags) && 
    recipe.tags.some(t => t.toLowerCase() === tagLower)
  );
}

// Check for duplicate recipes by title similarity or exact source URL match
async function checkForDuplicates(title, sourceUrl = null) {
  const recipes = await getAllRecipes();
  const duplicates = [];
  
  const normalizeTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const inputTitleNorm = normalizeTitle(title);
  
  for (const recipe of recipes) {
    let matchReason = null;
    let matchScore = 0;
    
    // Exact source URL match (highest priority)
    if (sourceUrl && recipe.source) {
      const inputUrl = sourceUrl.toLowerCase().replace(/\/$/, '');
      const recipeUrl = recipe.source.toLowerCase().replace(/\/$/, '');
      if (inputUrl === recipeUrl) {
        matchReason = 'Same source URL';
        matchScore = 100;
      }
    }
    
    // Title similarity check
    if (!matchReason) {
      const recipeTitleNorm = normalizeTitle(recipe.title);
      
      // Exact title match
      if (inputTitleNorm === recipeTitleNorm) {
        matchReason = 'Exact title match';
        matchScore = 95;
      }
      // One title contains the other
      else if (inputTitleNorm.includes(recipeTitleNorm) || recipeTitleNorm.includes(inputTitleNorm)) {
        const shorter = Math.min(inputTitleNorm.length, recipeTitleNorm.length);
        const longer = Math.max(inputTitleNorm.length, recipeTitleNorm.length);
        if (shorter / longer > 0.7) {
          matchReason = 'Similar title';
          matchScore = Math.round((shorter / longer) * 80);
        }
      }
    }
    
    if (matchReason) {
      duplicates.push({
        slug: recipe.slug,
        title: recipe.title,
        source: recipe.source,
        image: recipe.image,
        matchReason,
        matchScore
      });
    }
  }
  
  // Sort by match score (highest first)
  return duplicates.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { 
  getAllRecipes, 
  getRecipeBySlug, 
  saveRecipe, 
  deleteRecipe, 
  generateSlug, 
  getAllTags, 
  renameTag, 
  deleteTag, 
  getRecipesByTag, 
  checkForDuplicates,
  // Structured ingredients support
  isStructuredIngredients,
  convertToStructuredIngredients,
  getRecipeWithIngredientDetails,
  migrateRecipeIngredients
};
