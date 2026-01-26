/**
 * Ingredient Database Module
 * 
 * Provides a structured database for ingredients with support for:
 * - Inventory/Pantry tracking
 * - Nutritional information
 * - Substitutions
 * - Price tracking
 * - Allergen and dietary information
 * - Aggregated shopping and better categorization
 * - Recipe suggestions based on available ingredients
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { CONTENT_DIR } = require('./config');
const { ensureDir } = require('./utils');

// Ingredients database file path
const INGREDIENTS_DIR = path.join(CONTENT_DIR, 'ingredients');
const INGREDIENTS_DB_FILE = path.join(INGREDIENTS_DIR, 'ingredients.json');
const PANTRY_FILE = path.join(INGREDIENTS_DIR, 'pantry.json');

// =====================
// Category Definitions (Enhanced)
// =====================
const INGREDIENT_CATEGORIES = {
  produce: {
    name: 'Produce',
    icon: '🥬',
    keywords: ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'potato', 'lemon', 'lime', 'orange', 'pepper', 'cucumber', 'spinach', 'broccoli', 'mushroom', 'avocado', 'cilantro', 'parsley', 'basil', 'ginger', 'scallion', 'green onion', 'zucchini', 'squash', 'cabbage', 'kale', 'bell pepper', 'jalapeno', 'shallot', 'leek', 'corn', 'peas', 'green beans', 'asparagus', 'eggplant', 'beet', 'radish', 'turnip', 'sweet potato', 'yam', 'romaine', 'arugula', 'chard', 'collard', 'fennel', 'artichoke', 'brussels sprout', 'cauliflower', 'grape', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'mango', 'papaya', 'pineapple', 'watermelon', 'cantaloupe', 'honeydew', 'peach', 'plum', 'nectarine', 'cherry', 'pear', 'kiwi', 'pomegranate', 'fig', 'date', 'raisin', 'cranberry']
  },
  dairy: {
    name: 'Dairy & Eggs',
    icon: '🧈',
    keywords: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'egg', 'sour cream', 'half and half', 'half-and-half', 'cream cheese', 'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'goat cheese', 'brie', 'heavy cream', 'whipping cream', 'buttermilk', 'ghee', 'gruyere', 'swiss cheese', 'provolone', 'american cheese', 'blue cheese', 'gorgonzola', 'mascarpone', 'queso', 'manchego', 'havarti', 'asiago', 'romano', 'jack cheese', 'colby', 'muenster']
  },
  meat: {
    name: 'Meat & Seafood',
    icon: '🥩',
    keywords: ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'turkey', 'ham', 'fish', 'salmon', 'shrimp', 'lamb', 'steak', 'ground beef', 'ground turkey', 'ground pork', 'chorizo', 'prosciutto', 'pepperoni', 'meatball', 'ribs', 'thigh', 'breast', 'wing', 'drumstick', 'tenderloin', 'roast', 'tuna', 'cod', 'tilapia', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'anchovy', 'sardine', 'halibut', 'trout', 'catfish', 'mahi', 'swordfish', 'oyster', 'calamari', 'squid', 'octopus', 'duck', 'goose', 'veal', 'bison', 'venison', 'rabbit', 'quail', 'pancetta', 'guanciale', 'salami', 'mortadella', 'bologna', 'hot dog', 'bratwurst', 'kielbasa', 'andouille', 'italian sausage', 'breakfast sausage', 'ground chicken']
  },
  bakery: {
    name: 'Bread & Bakery',
    icon: '🍞',
    keywords: ['bread', 'bun', 'roll', 'tortilla', 'bagel', 'pita', 'croissant', 'english muffin', 'naan', 'flatbread', 'baguette', 'ciabatta', 'sourdough', 'brioche', 'focaccia', 'rye bread', 'pumpernickel', 'challah', 'cornbread', 'biscuit', 'crumpet', 'lavash', 'matzo', 'pretzel']
  },
  pantry: {
    name: 'Pantry & Staples',
    icon: '🥫',
    keywords: ['flour', 'sugar', 'salt', 'oil', 'vinegar', 'soy sauce', 'pasta', 'rice', 'beans', 'broth', 'stock', 'honey', 'syrup', 'vanilla', 'baking', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil', 'peanut butter', 'almond butter', 'jam', 'jelly', 'ketchup', 'mustard', 'mayonnaise', 'hot sauce', 'sriracha', 'worcestershire', 'fish sauce', 'hoisin', 'oyster sauce', 'tomato paste', 'tomato sauce', 'canned tomato', 'diced tomato', 'crushed tomato', 'coconut milk', 'spaghetti', 'linguine', 'penne', 'macaroni', 'fettuccine', 'lasagna', 'noodle', 'ramen', 'udon', 'rice noodle', 'brown rice', 'white rice', 'jasmine rice', 'basmati', 'quinoa', 'couscous', 'oat', 'oatmeal', 'cereal', 'granola', 'cornstarch', 'baking powder', 'baking soda', 'yeast', 'brown sugar', 'powdered sugar', 'confectioner', 'molasses', 'maple syrup', 'agave', 'breadcrumb', 'panko', 'cracker', 'chip', 'nut', 'almond', 'walnut', 'pecan', 'cashew', 'peanut', 'pistachio', 'pine nut', 'sesame seed', 'sunflower seed', 'chia', 'flax', 'lentil', 'chickpea', 'black bean', 'kidney bean', 'cannellini', 'navy bean', 'pinto bean', 'tahini', 'miso', 'gochujang', 'sambal', 'harissa', 'curry paste']
  },
  spices: {
    name: 'Spices & Seasonings',
    icon: '🧂',
    keywords: ['pepper', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'garlic powder', 'onion powder', 'chili powder', 'cayenne', 'turmeric', 'curry', 'garam masala', 'nutmeg', 'clove', 'allspice', 'cardamom', 'coriander', 'dill', 'bay leaf', 'sage', 'tarragon', 'marjoram', 'fennel seed', 'mustard seed', 'red pepper flake', 'crushed red pepper', 'italian seasoning', 'taco seasoning', 'seasoning', 'spice', 'herb', 'dried oregano', 'dried basil', 'dried thyme', 'smoked paprika', 'black pepper', 'white pepper', 'sea salt', 'kosher salt', 'celery salt', 'garlic salt', 'old bay', 'everything bagel', 'sumac', 'za\'atar', 'five spice', 'star anise', 'saffron', 'lavender', 'herbes de provence', 'bouquet garni', 'fenugreek', 'asafoetida', 'szechuan pepper']
  },
  frozen: {
    name: 'Frozen Foods',
    icon: '🧊',
    keywords: ['ice cream', 'frozen', 'popsicle', 'frozen pizza', 'frozen vegetable', 'frozen fruit', 'frozen dinner', 'ice', 'sorbet', 'gelato', 'frozen yogurt', 'frozen berries', 'frozen peas', 'frozen corn', 'frozen spinach']
  },
  beverages: {
    name: 'Beverages',
    icon: '🥤',
    keywords: ['juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer', 'sparkling water', 'lemonade', 'orange juice', 'apple juice', 'cranberry juice', 'grape juice', 'coconut water', 'almond milk', 'oat milk', 'soy milk', 'espresso', 'cold brew', 'kombucha', 'energy drink', 'sports drink', 'tonic water', 'club soda', 'ginger ale', 'root beer', 'cola', 'iced tea', 'matcha', 'chai']
  },
  other: {
    name: 'Other',
    icon: '📦',
    keywords: []
  }
};

// =====================
// Allergen Definitions
// =====================
const ALLERGENS = {
  dairy: { name: 'Dairy', icon: '🥛' },
  eggs: { name: 'Eggs', icon: '🥚' },
  fish: { name: 'Fish', icon: '🐟' },
  shellfish: { name: 'Shellfish', icon: '🦐' },
  treeNuts: { name: 'Tree Nuts', icon: '🥜' },
  peanuts: { name: 'Peanuts', icon: '🥜' },
  wheat: { name: 'Wheat/Gluten', icon: '🌾' },
  soy: { name: 'Soy', icon: '🫘' },
  sesame: { name: 'Sesame', icon: '🌰' }
};

// Common allergen ingredient mappings
const ALLERGEN_KEYWORDS = {
  dairy: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'sour cream', 'cream cheese', 'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'brie', 'heavy cream', 'whipping cream', 'buttermilk', 'ghee', 'whey', 'casein', 'lactose'],
  eggs: ['egg', 'eggs', 'mayonnaise', 'mayo', 'meringue', 'custard'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'catfish', 'mahi', 'swordfish', 'anchovy', 'sardine', 'fish sauce'],
  shellfish: ['shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'calamari', 'squid', 'octopus', 'crawfish', 'crayfish', 'prawn'],
  treeNuts: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'pine nut', 'macadamia', 'hazelnut', 'brazil nut', 'chestnut'],
  peanuts: ['peanut', 'peanut butter', 'peanut oil'],
  wheat: ['flour', 'bread', 'pasta', 'noodle', 'wheat', 'spaghetti', 'linguine', 'penne', 'macaroni', 'fettuccine', 'lasagna', 'ramen', 'udon', 'breadcrumb', 'panko', 'cracker', 'tortilla', 'bagel', 'croissant', 'baguette', 'ciabatta', 'sourdough', 'brioche', 'couscous', 'seitan', 'bulgur', 'farina', 'semolina'],
  soy: ['soy', 'soy sauce', 'tofu', 'tempeh', 'edamame', 'miso', 'soybean'],
  sesame: ['sesame', 'sesame oil', 'sesame seed', 'tahini']
};

// =====================
// Dietary Flags
// =====================
const DIETARY_FLAGS = {
  vegetarian: { name: 'Vegetarian', icon: '🥬' },
  vegan: { name: 'Vegan', icon: '🌱' },
  glutenFree: { name: 'Gluten-Free', icon: '🌾' },
  dairyFree: { name: 'Dairy-Free', icon: '🥛' },
  kosher: { name: 'Kosher', icon: '✡️' },
  halal: { name: 'Halal', icon: '☪️' },
  keto: { name: 'Keto-Friendly', icon: '🥓' },
  paleo: { name: 'Paleo-Friendly', icon: '🦴' },
  whole30: { name: 'Whole30 Compliant', icon: '🍳' }
};

// Non-vegetarian keywords
const NON_VEGETARIAN_KEYWORDS = ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'turkey', 'ham', 'fish', 'salmon', 'shrimp', 'lamb', 'steak', 'ground beef', 'ground turkey', 'ground pork', 'chorizo', 'prosciutto', 'pepperoni', 'meatball', 'ribs', 'thigh', 'breast', 'wing', 'drumstick', 'tenderloin', 'roast', 'tuna', 'cod', 'tilapia', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'anchovy', 'sardine', 'halibut', 'trout', 'catfish', 'mahi', 'swordfish', 'oyster', 'calamari', 'squid', 'octopus', 'duck', 'goose', 'veal', 'bison', 'venison', 'rabbit', 'quail', 'pancetta', 'guanciale', 'salami', 'mortadella', 'bologna', 'hot dog', 'bratwurst', 'kielbasa', 'andouille', 'italian sausage', 'breakfast sausage', 'ground chicken', 'gelatin', 'lard', 'suet', 'tallow'];

// Animal product keywords (for vegan detection)
const ANIMAL_PRODUCT_KEYWORDS = [...NON_VEGETARIAN_KEYWORDS, ...ALLERGEN_KEYWORDS.dairy, ...ALLERGEN_KEYWORDS.eggs, 'honey', 'beeswax', 'royal jelly', 'carmine', 'cochineal', 'shellac', 'lanolin', 'whey', 'casein', 'lactose'];

// =====================
// Unit Definitions
// =====================
const UNITS = {
  volume: {
    tsp: { name: 'teaspoon', plural: 'teaspoons', abbrev: ['tsp', 'ts', 't'], mlValue: 4.929 },
    tbsp: { name: 'tablespoon', plural: 'tablespoons', abbrev: ['tbsp', 'tbs', 'tb', 'T'], mlValue: 14.787 },
    cup: { name: 'cup', plural: 'cups', abbrev: ['c', 'C'], mlValue: 236.588 },
    floz: { name: 'fluid ounce', plural: 'fluid ounces', abbrev: ['fl oz', 'fl. oz.'], mlValue: 29.574 },
    ml: { name: 'milliliter', plural: 'milliliters', abbrev: ['ml', 'mL'], mlValue: 1 },
    l: { name: 'liter', plural: 'liters', abbrev: ['l', 'L'], mlValue: 1000 },
    pt: { name: 'pint', plural: 'pints', abbrev: ['pt'], mlValue: 473.176 },
    qt: { name: 'quart', plural: 'quarts', abbrev: ['qt'], mlValue: 946.353 },
    gal: { name: 'gallon', plural: 'gallons', abbrev: ['gal'], mlValue: 3785.41 }
  },
  weight: {
    oz: { name: 'ounce', plural: 'ounces', abbrev: ['oz'], gValue: 28.3495 },
    lb: { name: 'pound', plural: 'pounds', abbrev: ['lb', 'lbs'], gValue: 453.592 },
    g: { name: 'gram', plural: 'grams', abbrev: ['g'], gValue: 1 },
    kg: { name: 'kilogram', plural: 'kilograms', abbrev: ['kg'], gValue: 1000 }
  },
  count: {
    piece: { name: 'piece', plural: 'pieces', abbrev: ['pc', 'pcs'] },
    whole: { name: 'whole', plural: 'whole', abbrev: [] },
    slice: { name: 'slice', plural: 'slices', abbrev: [] },
    clove: { name: 'clove', plural: 'cloves', abbrev: [] },
    head: { name: 'head', plural: 'heads', abbrev: [] },
    bunch: { name: 'bunch', plural: 'bunches', abbrev: [] },
    can: { name: 'can', plural: 'cans', abbrev: [] },
    jar: { name: 'jar', plural: 'jars', abbrev: [] },
    package: { name: 'package', plural: 'packages', abbrev: ['pkg'] },
    bag: { name: 'bag', plural: 'bags', abbrev: [] },
    box: { name: 'box', plural: 'boxes', abbrev: [] },
    bottle: { name: 'bottle', plural: 'bottles', abbrev: [] },
    stick: { name: 'stick', plural: 'sticks', abbrev: [] },
    large: { name: 'large', plural: 'large', abbrev: ['lg'] },
    medium: { name: 'medium', plural: 'medium', abbrev: ['med'] },
    small: { name: 'small', plural: 'small', abbrev: ['sm'] },
    pinch: { name: 'pinch', plural: 'pinches', abbrev: [] },
    dash: { name: 'dash', plural: 'dashes', abbrev: [] },
    handful: { name: 'handful', plural: 'handfuls', abbrev: [] },
    sprig: { name: 'sprig', plural: 'sprigs', abbrev: [] },
    stalk: { name: 'stalk', plural: 'stalks', abbrev: [] }
  }
};

// =====================
// Ingredient Schema
// =====================

/**
 * Ingredient Schema:
 * {
 *   id: string (UUID),
 *   name: string (canonical name),
 *   aliases: string[] (alternative names, e.g., ['cilantro', 'coriander leaves']),
 *   category: string (category key),
 *   subcategory: string (optional, e.g., 'citrus' for produce),
 *   
 *   // Dietary & Allergen Info
 *   allergens: string[] (allergen keys),
 *   dietaryFlags: {
 *     vegetarian: boolean,
 *     vegan: boolean,
 *     glutenFree: boolean,
 *     dairyFree: boolean,
 *     kosher: boolean | null,
 *     halal: boolean | null,
 *     keto: boolean | null,
 *     paleo: boolean | null,
 *     whole30: boolean | null
 *   },
 *   
 *   // Nutritional Info (per 100g, optional)
 *   nutrition: {
 *     calories: number,
 *     protein: number (grams),
 *     carbs: number (grams),
 *     fat: number (grams),
 *     fiber: number (grams),
 *     sugar: number (grams),
 *     sodium: number (mg)
 *   } | null,
 *   
 *   // Storage & Handling
 *   defaultUnit: string (unit key),
 *   storageLocation: 'pantry' | 'refrigerator' | 'freezer' | null,
 *   shelfLife: { days: number, location: string } | null,
 *   
 *   // Substitutions
 *   substitutes: string[] (ingredient IDs that can substitute),
 *   
 *   // Price Tracking
 *   priceHistory: [{
 *     price: number,
 *     quantity: number,
 *     unit: string,
 *     store: string | null,
 *     date: string (ISO date)
 *   }],
 *   averagePricePerUnit: number | null,
 *   
 *   // Metadata
 *   notes: string | null,
 *   imageUrl: string | null,
 *   createdAt: string (ISO date),
 *   updatedAt: string (ISO date)
 * }
 */

// =====================
// Pantry Item Schema
// =====================

/**
 * Pantry Item Schema (what the user has in stock):
 * {
 *   id: string (UUID),
 *   ingredientId: string (reference to ingredient),
 *   ingredientName: string (denormalized for display),
 *   quantity: number,
 *   unit: string,
 *   location: 'pantry' | 'refrigerator' | 'freezer',
 *   purchaseDate: string (ISO date) | null,
 *   expirationDate: string (ISO date) | null,
 *   opened: boolean,
 *   notes: string | null,
 *   addedAt: string (ISO date),
 *   updatedAt: string (ISO date)
 * }
 */

// =====================
// Database Operations
// =====================

// In-memory cache for ingredients database
let ingredientsCache = null;
let pantryCache = null;

/**
 * Initialize the ingredients database
 */
async function initIngredientsDB() {
  await ensureDir(INGREDIENTS_DIR);
  
  try {
    const data = await fs.readFile(INGREDIENTS_DB_FILE, 'utf-8');
    ingredientsCache = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create initial database with empty ingredients array
      ingredientsCache = {
        version: '1.0.0',
        ingredients: [],
        lastUpdated: new Date().toISOString()
      };
      await saveIngredientsDB();
    } else {
      throw err;
    }
  }
  
  return ingredientsCache;
}

/**
 * Save the ingredients database
 */
async function saveIngredientsDB() {
  if (!ingredientsCache) {
    throw new Error('Ingredients database not initialized');
  }
  
  ingredientsCache.lastUpdated = new Date().toISOString();
  await fs.writeFile(INGREDIENTS_DB_FILE, JSON.stringify(ingredientsCache, null, 2), 'utf-8');
}

/**
 * Initialize the pantry database
 */
async function initPantryDB() {
  await ensureDir(INGREDIENTS_DIR);
  
  try {
    const data = await fs.readFile(PANTRY_FILE, 'utf-8');
    pantryCache = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      pantryCache = {
        version: '1.0.0',
        items: [],
        lastUpdated: new Date().toISOString()
      };
      await savePantryDB();
    } else {
      throw err;
    }
  }
  
  return pantryCache;
}

/**
 * Save the pantry database
 */
async function savePantryDB() {
  if (!pantryCache) {
    throw new Error('Pantry database not initialized');
  }
  
  pantryCache.lastUpdated = new Date().toISOString();
  await fs.writeFile(PANTRY_FILE, JSON.stringify(pantryCache, null, 2), 'utf-8');
}

// =====================
// Ingredient CRUD Operations
// =====================

/**
 * Get all ingredients
 */
async function getAllIngredients() {
  if (!ingredientsCache) {
    await initIngredientsDB();
  }
  return ingredientsCache.ingredients;
}

/**
 * Get ingredient by ID
 */
async function getIngredientById(id) {
  const ingredients = await getAllIngredients();
  return ingredients.find(i => i.id === id) || null;
}

/**
 * Find ingredient by name (exact or alias match)
 */
async function findIngredientByName(name) {
  const ingredients = await getAllIngredients();
  const normalizedName = name.toLowerCase().trim();
  
  return ingredients.find(i => 
    i.name.toLowerCase() === normalizedName ||
    (i.aliases && i.aliases.some(a => a.toLowerCase() === normalizedName))
  ) || null;
}

/**
 * Search ingredients by partial name match
 */
async function searchIngredients(query, limit = 20) {
  const ingredients = await getAllIngredients();
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return ingredients.slice(0, limit);
  
  const results = ingredients.filter(i => {
    const nameMatch = i.name.toLowerCase().includes(normalizedQuery);
    const aliasMatch = i.aliases && i.aliases.some(a => a.toLowerCase().includes(normalizedQuery));
    return nameMatch || aliasMatch;
  });
  
  // Sort by relevance (exact match first, then starts with, then contains)
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    const aExact = aName === normalizedQuery;
    const bExact = bName === normalizedQuery;
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;
    
    const aStarts = aName.startsWith(normalizedQuery);
    const bStarts = bName.startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;
    
    return aName.localeCompare(bName);
  });
  
  return results.slice(0, limit);
}

/**
 * Create a new ingredient
 */
async function createIngredient(ingredientData) {
  if (!ingredientsCache) {
    await initIngredientsDB();
  }
  
  const now = new Date().toISOString();
  
  // Auto-detect category if not provided
  let category = ingredientData.category;
  if (!category) {
    category = detectCategory(ingredientData.name);
  }
  
  // Auto-detect allergens if not provided
  let allergens = ingredientData.allergens;
  if (!allergens) {
    allergens = detectAllergens(ingredientData.name);
  }
  
  // Auto-detect dietary flags if not provided
  let dietaryFlags = ingredientData.dietaryFlags;
  if (!dietaryFlags) {
    dietaryFlags = detectDietaryFlags(ingredientData.name, allergens);
  }
  
  const ingredient = {
    id: uuidv4(),
    name: ingredientData.name.trim(),
    aliases: ingredientData.aliases || [],
    category: category,
    subcategory: ingredientData.subcategory || null,
    allergens: allergens,
    dietaryFlags: dietaryFlags,
    nutrition: ingredientData.nutrition || null,
    defaultUnit: ingredientData.defaultUnit || 'piece',
    storageLocation: ingredientData.storageLocation || null,
    shelfLife: ingredientData.shelfLife || null,
    substitutes: ingredientData.substitutes || [],
    priceHistory: ingredientData.priceHistory || [],
    averagePricePerUnit: null,
    notes: ingredientData.notes || null,
    imageUrl: ingredientData.imageUrl || null,
    createdAt: now,
    updatedAt: now
  };
  
  ingredientsCache.ingredients.push(ingredient);
  await saveIngredientsDB();
  
  return ingredient;
}

/**
 * Update an existing ingredient
 */
async function updateIngredient(id, updates) {
  if (!ingredientsCache) {
    await initIngredientsDB();
  }
  
  const index = ingredientsCache.ingredients.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Ingredient not found: ${id}`);
  }
  
  const ingredient = ingredientsCache.ingredients[index];
  const updatedIngredient = {
    ...ingredient,
    ...updates,
    id: ingredient.id, // Prevent ID change
    createdAt: ingredient.createdAt, // Preserve creation date
    updatedAt: new Date().toISOString()
  };
  
  ingredientsCache.ingredients[index] = updatedIngredient;
  await saveIngredientsDB();
  
  return updatedIngredient;
}

/**
 * Delete an ingredient
 */
async function deleteIngredient(id) {
  if (!ingredientsCache) {
    await initIngredientsDB();
  }
  
  const index = ingredientsCache.ingredients.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Ingredient not found: ${id}`);
  }
  
  ingredientsCache.ingredients.splice(index, 1);
  await saveIngredientsDB();
}

/**
 * Get or create ingredient by name
 * If ingredient doesn't exist, create it automatically
 */
async function getOrCreateIngredient(name) {
  let ingredient = await findIngredientByName(name);
  
  if (!ingredient) {
    ingredient = await createIngredient({ name });
  }
  
  return ingredient;
}

// =====================
// Pantry Operations
// =====================

/**
 * Get all pantry items
 */
async function getPantryItems() {
  if (!pantryCache) {
    await initPantryDB();
  }
  return pantryCache.items;
}

/**
 * Add item to pantry
 */
async function addToPantry(pantryItemData) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const now = new Date().toISOString();
  
  // Get or create the ingredient
  const ingredient = await getOrCreateIngredient(pantryItemData.ingredientName || pantryItemData.name);
  
  const pantryItem = {
    id: uuidv4(),
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    quantity: pantryItemData.quantity || 1,
    unit: pantryItemData.unit || ingredient.defaultUnit || 'piece',
    location: pantryItemData.location || ingredient.storageLocation || 'pantry',
    purchaseDate: pantryItemData.purchaseDate || null,
    expirationDate: pantryItemData.expirationDate || null,
    opened: pantryItemData.opened || false,
    notes: pantryItemData.notes || null,
    addedAt: now,
    updatedAt: now
  };
  
  pantryCache.items.push(pantryItem);
  await savePantryDB();
  
  return pantryItem;
}

/**
 * Update pantry item
 */
async function updatePantryItem(id, updates) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const index = pantryCache.items.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Pantry item not found: ${id}`);
  }
  
  const item = pantryCache.items[index];
  const updatedItem = {
    ...item,
    ...updates,
    id: item.id,
    ingredientId: item.ingredientId,
    addedAt: item.addedAt,
    updatedAt: new Date().toISOString()
  };
  
  pantryCache.items[index] = updatedItem;
  await savePantryDB();
  
  return updatedItem;
}

/**
 * Remove item from pantry
 */
async function removeFromPantry(id) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const index = pantryCache.items.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Pantry item not found: ${id}`);
  }
  
  pantryCache.items.splice(index, 1);
  await savePantryDB();
}

/**
 * Get pantry items by ingredient
 */
async function getPantryItemsByIngredient(ingredientId) {
  const items = await getPantryItems();
  return items.filter(i => i.ingredientId === ingredientId);
}

/**
 * Check if ingredient is in pantry
 */
async function isInPantry(ingredientName) {
  const ingredient = await findIngredientByName(ingredientName);
  if (!ingredient) return false;
  
  const items = await getPantryItemsByIngredient(ingredient.id);
  return items.some(i => i.quantity > 0);
}

/**
 * Get expiring items (within N days)
 */
async function getExpiringItems(days = 7) {
  const items = await getPantryItems();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  
  return items.filter(item => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    return expDate <= cutoff && expDate >= new Date();
  }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
}

/**
 * Get expired items
 */
async function getExpiredItems() {
  const items = await getPantryItems();
  const now = new Date();
  
  return items.filter(item => {
    if (!item.expirationDate) return false;
    return new Date(item.expirationDate) < now;
  }).sort((a, b) => new Date(b.expirationDate) - new Date(a.expirationDate));
}

// =====================
// Auto-Detection Functions
// =====================

/**
 * Detect category based on ingredient name
 */
function detectCategory(name) {
  const normalizedName = name.toLowerCase();
  
  for (const [categoryKey, categoryData] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (categoryData.keywords.some(keyword => normalizedName.includes(keyword))) {
      return categoryKey;
    }
  }
  
  return 'other';
}

/**
 * Detect allergens based on ingredient name
 */
function detectAllergens(name) {
  const normalizedName = name.toLowerCase();
  const detected = [];
  
  for (const [allergenKey, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    if (keywords.some(keyword => normalizedName.includes(keyword))) {
      detected.push(allergenKey);
    }
  }
  
  return detected;
}

/**
 * Detect dietary flags based on ingredient name and allergens
 */
function detectDietaryFlags(name, allergens = []) {
  const normalizedName = name.toLowerCase();
  
  // Check if contains meat/fish
  const hasMeat = NON_VEGETARIAN_KEYWORDS.some(keyword => normalizedName.includes(keyword));
  
  // Check if contains any animal products
  const hasAnimalProducts = ANIMAL_PRODUCT_KEYWORDS.some(keyword => normalizedName.includes(keyword));
  
  // Check if contains gluten
  const hasGluten = allergens.includes('wheat') || 
    ALLERGEN_KEYWORDS.wheat.some(keyword => normalizedName.includes(keyword));
  
  // Check if contains dairy
  const hasDairy = allergens.includes('dairy') ||
    ALLERGEN_KEYWORDS.dairy.some(keyword => normalizedName.includes(keyword));
  
  return {
    vegetarian: !hasMeat,
    vegan: !hasAnimalProducts,
    glutenFree: !hasGluten,
    dairyFree: !hasDairy,
    kosher: null, // Requires manual input
    halal: null, // Requires manual input
    keto: null, // Requires nutrition data
    paleo: null, // Requires manual input
    whole30: null // Requires manual input
  };
}

// =====================
// Recipe Integration Helpers
// =====================

/**
 * Parse a raw ingredient string into structured data
 */
function parseIngredientString(ingredientStr) {
  const trimmed = ingredientStr.trim();
  let quantity = null;
  let unit = null;
  let name = trimmed;
  let rest = trimmed;
  let preparation = null;
  
  // Extract preparation notes (e.g., "diced", "chopped", "minced")
  const prepPatterns = [
    /,\s*(diced|chopped|minced|sliced|cubed|grated|shredded|crushed|julienned|melted|softened|at room temperature|divided|optional|to taste)/gi,
    /\s*\((diced|chopped|minced|sliced|cubed|grated|shredded|crushed|julienned|melted|softened|at room temperature|divided|optional|to taste)[^)]*\)/gi
  ];
  
  for (const pattern of prepPatterns) {
    const match = rest.match(pattern);
    if (match) {
      preparation = match[0].replace(/^[,\s(]+|[)\s]+$/g, '').trim();
      rest = rest.replace(pattern, '').trim();
    }
  }
  
  // Try to match quantity at start
  // Pattern for mixed numbers: "1 1/2"
  const mixedPattern = /^(\d+)\s+(\d+\/\d+)\s+/;
  const mixedMatch = rest.match(mixedPattern);
  
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const frac = parseFraction(mixedMatch[2]);
    quantity = whole + frac;
    rest = rest.slice(mixedMatch[0].length);
  } else {
    // Pattern for simple fractions: "1/2"
    const fracPattern = /^(\d+\/\d+)\s+/;
    const fracMatch = rest.match(fracPattern);
    
    if (fracMatch) {
      quantity = parseFraction(fracMatch[1]);
      rest = rest.slice(fracMatch[0].length);
    } else {
      // Pattern for whole/decimal numbers: "2" or "2.5"
      const wholePattern = /^(\d+(?:\.\d+)?)\s+/;
      const wholeMatch = rest.match(wholePattern);
      
      if (wholeMatch) {
        quantity = parseFloat(wholeMatch[1]);
        rest = rest.slice(wholeMatch[0].length);
      }
    }
  }
  
  // Build unit pattern from all known units
  const allUnits = [];
  for (const unitType of Object.values(UNITS)) {
    for (const [key, unitData] of Object.entries(unitType)) {
      allUnits.push(unitData.name, unitData.plural, ...unitData.abbrev);
    }
  }
  const unitPattern = new RegExp(`^(${allUnits.join('|')})\\.?\\s+`, 'i');
  const unitMatch = rest.match(unitPattern);
  
  if (unitMatch) {
    unit = normalizeUnit(unitMatch[1]);
    rest = rest.slice(unitMatch[0].length);
  }
  
  // Handle parenthetical amounts like "(15 oz)"
  const parenPattern = /^\(([^)]+)\)\s*/;
  const parenMatch = rest.match(parenPattern);
  let modifier = null;
  
  if (parenMatch) {
    modifier = parenMatch[1];
    rest = rest.slice(parenMatch[0].length);
  }
  
  name = rest.trim();
  
  // Clean up name
  name = name.replace(/,\s*$/, '').trim();
  
  return {
    rawText: ingredientStr,
    quantity,
    unit,
    name,
    preparation,
    modifier
  };
}

/**
 * Parse fraction string to decimal
 */
function parseFraction(str) {
  if (str.includes('/')) {
    const [num, denom] = str.split('/').map(Number);
    if (denom !== 0) return num / denom;
  }
  return parseFloat(str);
}

/**
 * Normalize a unit string to a standard key
 */
function normalizeUnit(unitStr) {
  const normalized = unitStr.toLowerCase().replace(/\./g, '');
  
  for (const unitType of Object.values(UNITS)) {
    for (const [key, unitData] of Object.entries(unitType)) {
      if (unitData.name === normalized || 
          unitData.plural === normalized ||
          unitData.abbrev.includes(normalized)) {
        return key;
      }
    }
  }
  
  return normalized;
}

/**
 * Convert decimal to nice fraction string
 */
function decimalToFraction(decimal) {
  if (decimal === 0) return '0';
  
  const FRACTION_MAP = {
    0.125: '⅛', 0.25: '¼', 0.333: '⅓', 0.375: '⅜',
    0.5: '½', 0.625: '⅝', 0.667: '⅔', 0.75: '¾', 0.875: '⅞'
  };
  
  const whole = Math.floor(decimal);
  const frac = decimal - whole;
  
  if (frac < 0.0625) {
    return whole.toString();
  }
  
  let closestFrac = '';
  let closestDiff = 1;
  
  for (const [val, symbol] of Object.entries(FRACTION_MAP)) {
    const diff = Math.abs(frac - parseFloat(val));
    if (diff < closestDiff) {
      closestDiff = diff;
      closestFrac = symbol;
    }
  }
  
  if (closestDiff > 0.05) {
    const rounded = Math.round(decimal * 100) / 100;
    return rounded.toString();
  }
  
  if (whole === 0) {
    return closestFrac;
  }
  return `${whole} ${closestFrac}`;
}

/**
 * Format an ingredient for display
 */
function formatIngredient(parsed, scaleFactor = 1) {
  const parts = [];
  
  if (parsed.quantity) {
    const scaled = parsed.quantity * scaleFactor;
    parts.push(decimalToFraction(scaled));
  }
  
  if (parsed.unit) {
    const unitInfo = findUnitInfo(parsed.unit);
    if (unitInfo) {
      const unitName = parsed.quantity && parsed.quantity * scaleFactor !== 1 
        ? unitInfo.plural 
        : unitInfo.name;
      parts.push(unitName);
    } else {
      parts.push(parsed.unit);
    }
  }
  
  parts.push(parsed.name);
  
  if (parsed.preparation) {
    parts.push(`, ${parsed.preparation}`);
  }
  
  return parts.join(' ');
}

/**
 * Find unit info from key
 */
function findUnitInfo(unitKey) {
  for (const unitType of Object.values(UNITS)) {
    if (unitType[unitKey]) {
      return unitType[unitKey];
    }
  }
  return null;
}

// =====================
// Recipe Matching
// =====================

/**
 * Get recipes that can be made with pantry items
 * Returns recipes sorted by how many ingredients are available
 */
async function getRecipesMatchingPantry(recipes) {
  const pantryItems = await getPantryItems();
  const pantryIngredientNames = new Set(
    pantryItems
      .filter(p => p.quantity > 0)
      .map(p => p.ingredientName.toLowerCase())
  );
  
  const results = [];
  
  for (const recipe of recipes) {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;
    
    let available = 0;
    let missing = [];
    
    for (const ingredientStr of recipe.ingredients) {
      const parsed = parseIngredientString(ingredientStr);
      const ingredientName = parsed.name.toLowerCase();
      
      // Check if ingredient or any part of its name is in pantry
      const isAvailable = pantryIngredientNames.has(ingredientName) ||
        [...pantryIngredientNames].some(pantryName => 
          ingredientName.includes(pantryName) || pantryName.includes(ingredientName)
        );
      
      if (isAvailable) {
        available++;
      } else {
        missing.push(parsed.name);
      }
    }
    
    const totalIngredients = recipe.ingredients.length;
    const matchPercentage = totalIngredients > 0 
      ? Math.round((available / totalIngredients) * 100) 
      : 0;
    
    results.push({
      recipe,
      available,
      missing,
      total: totalIngredients,
      matchPercentage
    });
  }
  
  // Sort by match percentage (highest first), then by number of missing (lowest first)
  results.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.missing.length - b.missing.length;
  });
  
  return results;
}

/**
 * Get shopping list items needed for a recipe based on pantry
 */
async function getShoppingNeededForRecipe(recipe) {
  const pantryItems = await getPantryItems();
  const pantryIngredientNames = new Set(
    pantryItems
      .filter(p => p.quantity > 0)
      .map(p => p.ingredientName.toLowerCase())
  );
  
  const needed = [];
  
  for (const ingredientStr of (recipe.ingredients || [])) {
    const parsed = parseIngredientString(ingredientStr);
    const ingredientName = parsed.name.toLowerCase();
    
    const isAvailable = pantryIngredientNames.has(ingredientName) ||
      [...pantryIngredientNames].some(pantryName => 
        ingredientName.includes(pantryName) || pantryName.includes(ingredientName)
      );
    
    if (!isAvailable) {
      needed.push({
        rawText: ingredientStr,
        ...parsed
      });
    }
  }
  
  return needed;
}

// =====================
// Price Tracking
// =====================

/**
 * Add price record to ingredient
 */
async function addPriceRecord(ingredientId, priceData) {
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new Error(`Ingredient not found: ${ingredientId}`);
  }
  
  const record = {
    price: priceData.price,
    quantity: priceData.quantity || 1,
    unit: priceData.unit || ingredient.defaultUnit,
    store: priceData.store || null,
    date: priceData.date || new Date().toISOString()
  };
  
  ingredient.priceHistory = ingredient.priceHistory || [];
  ingredient.priceHistory.push(record);
  
  // Recalculate average price
  if (ingredient.priceHistory.length > 0) {
    const total = ingredient.priceHistory.reduce((sum, r) => sum + (r.price / r.quantity), 0);
    ingredient.averagePricePerUnit = total / ingredient.priceHistory.length;
  }
  
  await updateIngredient(ingredientId, {
    priceHistory: ingredient.priceHistory,
    averagePricePerUnit: ingredient.averagePricePerUnit
  });
  
  return record;
}

/**
 * Estimate cost of a recipe
 */
async function estimateRecipeCost(recipe) {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return { total: null, breakdown: [], itemsWithPrices: 0, itemsWithoutPrices: 0 };
  }
  
  const breakdown = [];
  let total = 0;
  let itemsWithPrices = 0;
  let itemsWithoutPrices = 0;
  
  for (const ingredientStr of recipe.ingredients) {
    const parsed = parseIngredientString(ingredientStr);
    const ingredient = await findIngredientByName(parsed.name);
    
    if (ingredient && ingredient.averagePricePerUnit) {
      const quantity = parsed.quantity || 1;
      const cost = quantity * ingredient.averagePricePerUnit;
      total += cost;
      itemsWithPrices++;
      breakdown.push({
        ingredient: parsed.name,
        quantity,
        unit: parsed.unit,
        unitPrice: ingredient.averagePricePerUnit,
        cost
      });
    } else {
      itemsWithoutPrices++;
      breakdown.push({
        ingredient: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        unitPrice: null,
        cost: null
      });
    }
  }
  
  return {
    total: itemsWithPrices > 0 ? Math.round(total * 100) / 100 : null,
    breakdown,
    itemsWithPrices,
    itemsWithoutPrices
  };
}

// =====================
// Exports
// =====================

module.exports = {
  // Constants
  INGREDIENT_CATEGORIES,
  ALLERGENS,
  ALLERGEN_KEYWORDS,
  DIETARY_FLAGS,
  UNITS,
  
  // Database operations
  initIngredientsDB,
  initPantryDB,
  
  // Ingredient CRUD
  getAllIngredients,
  getIngredientById,
  findIngredientByName,
  searchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getOrCreateIngredient,
  
  // Pantry operations
  getPantryItems,
  addToPantry,
  updatePantryItem,
  removeFromPantry,
  getPantryItemsByIngredient,
  isInPantry,
  getExpiringItems,
  getExpiredItems,
  
  // Detection functions
  detectCategory,
  detectAllergens,
  detectDietaryFlags,
  
  // Parsing & formatting
  parseIngredientString,
  formatIngredient,
  decimalToFraction,
  normalizeUnit,
  findUnitInfo,
  
  // Recipe integration
  getRecipesMatchingPantry,
  getShoppingNeededForRecipe,
  
  // Price tracking
  addPriceRecord,
  estimateRecipeCost
};
