const ogs = require('open-graph-scraper');
const { generateSlug } = require('./recipes');

function parseDuration(duration) {
  if (!duration) return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes || null;
}

async function scrapeRecipe(url) {
  const { error, result } = await ogs({ url });
  
  if (error) {
    throw new Error(`Failed to fetch URL: ${url}`);
  }
  
  let schemaRecipe = null;
  
  if (result.jsonLD) {
    for (const item of result.jsonLD) {
      if (item['@type'] === 'Recipe') {
        schemaRecipe = item;
        break;
      }
      if (item['@graph'] && Array.isArray(item['@graph'])) {
        const found = item['@graph'].find(g => g['@type'] === 'Recipe');
        if (found) {
          schemaRecipe = found;
          break;
        }
      }
    }
  }
  
  if (!schemaRecipe) {
    // Fallback to Open Graph
    const title = result.ogTitle || 'Untitled Recipe';
    return {
      title,
      slug: generateSlug(title),
      source: url,
      image: result.ogImage?.[0]?.url || '',
      description: result.ogDescription || '',
      ingredients: [],
      instructions: [],
      dateAdded: new Date().toISOString()
    };
  }
  
  const title = schemaRecipe.name || 'Untitled Recipe';
  let image = '';
  if (schemaRecipe.image) {
    if (typeof schemaRecipe.image === 'string') {
      image = schemaRecipe.image;
    } else if (Array.isArray(schemaRecipe.image)) {
      image = schemaRecipe.image[0]?.url || schemaRecipe.image[0] || '';
    } else if (schemaRecipe.image.url) {
      image = schemaRecipe.image.url;
    }
  }
  
  const ingredients = (schemaRecipe.recipeIngredient || []).map(ing => String(ing).trim());
  
  let instructions = [];
  if (schemaRecipe.recipeInstructions) {
    const instr = schemaRecipe.recipeInstructions;
    if (typeof instr === 'string') {
      instructions = [instr];
    } else if (Array.isArray(instr)) {
      instructions = instr.map(step => {
        return typeof step === 'string' ? step : step.text || '';
      }).filter(Boolean);
    }
  }
  
  // Format duration as human readable
  function formatDuration(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} mins`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr`;
  }
  
  return {
    title,
    slug: generateSlug(title),
    source: url,
    image,
    description: schemaRecipe.description || '',
    prepTime: formatDuration(parseDuration(schemaRecipe.prepTime)),
    cookTime: formatDuration(parseDuration(schemaRecipe.cookTime)),
    totalTime: formatDuration(parseDuration(schemaRecipe.totalTime)),
    servings: schemaRecipe.recipeYield ? String(schemaRecipe.recipeYield) : null,
    tags: [schemaRecipe.recipeCategory, schemaRecipe.recipeCuisine].filter(Boolean),
    ingredients,
    instructions,
    dateAdded: new Date().toISOString()
  };
}

module.exports = { scrapeRecipe };
