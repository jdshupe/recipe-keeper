const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { RECIPES_DIR } = require('./config');
const { ensureDir } = require('./utils');

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
  const filePath = path.join(RECIPES_DIR, `${recipe.slug}.md`);
  const fileContent = matter.stringify(content || '', frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  console.log(`Saved recipe: ${recipe.title}`);
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
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
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
      const tagIndex = recipe.tags.findIndex(t => t.toLowerCase() === oldTagLower);
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

module.exports = { getAllRecipes, getRecipeBySlug, saveRecipe, deleteRecipe, generateSlug, getAllTags, renameTag, deleteTag, getRecipesByTag };
