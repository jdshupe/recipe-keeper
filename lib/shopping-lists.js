const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { LISTS_DIR } = require('./config');
const { ensureDir } = require('./utils');

// =====================
// Category Definitions
// =====================
const CATEGORIES = {
  produce: ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'potato', 'lemon', 'lime', 'orange', 'pepper', 'cucumber', 'spinach', 'broccoli', 'mushroom', 'avocado', 'cilantro', 'parsley', 'basil', 'ginger', 'scallion', 'green onion', 'zucchini', 'squash', 'cabbage', 'kale', 'bell pepper', 'jalapeno', 'shallot', 'leek', 'corn', 'peas', 'green beans', 'asparagus', 'eggplant', 'beet', 'radish', 'turnip', 'sweet potato', 'yam'],
  dairy: ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'egg', 'sour cream', 'half and half', 'half-and-half', 'cream cheese', 'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'goat cheese', 'brie', 'heavy cream', 'whipping cream'],
  meat: ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'turkey', 'ham', 'fish', 'salmon', 'shrimp', 'lamb', 'steak', 'ground beef', 'ground turkey', 'ground pork', 'chorizo', 'prosciutto', 'pepperoni', 'meatball', 'ribs', 'thigh', 'breast', 'wing', 'drumstick', 'tenderloin', 'roast', 'tuna', 'cod', 'tilapia', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'anchovy'],
  bakery: ['bread', 'bun', 'roll', 'tortilla', 'bagel', 'pita', 'croissant', 'english muffin', 'naan', 'flatbread', 'baguette', 'ciabatta', 'sourdough', 'brioche'],
  pantry: ['flour', 'sugar', 'salt', 'oil', 'vinegar', 'soy sauce', 'pasta', 'rice', 'beans', 'broth', 'stock', 'honey', 'syrup', 'vanilla', 'baking', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil', 'peanut butter', 'almond butter', 'jam', 'jelly', 'ketchup', 'mustard', 'mayonnaise', 'hot sauce', 'sriracha', 'worcestershire', 'fish sauce', 'hoisin', 'oyster sauce', 'tomato paste', 'tomato sauce', 'canned tomato', 'diced tomato', 'crushed tomato', 'coconut milk', 'spaghetti', 'linguine', 'penne', 'macaroni', 'fettuccine', 'lasagna', 'noodle', 'ramen', 'udon', 'rice noodle', 'brown rice', 'white rice', 'jasmine rice', 'basmati', 'quinoa', 'couscous', 'oat', 'oatmeal', 'cereal', 'granola', 'cornstarch', 'baking powder', 'baking soda', 'yeast', 'brown sugar', 'powdered sugar', 'confectioner', 'molasses', 'maple syrup', 'agave', 'breadcrumb', 'panko', 'cracker', 'chip', 'nut', 'almond', 'walnut', 'pecan', 'cashew', 'peanut', 'pistachio', 'pine nut', 'sesame seed', 'sunflower seed', 'chia', 'flax', 'lentil', 'chickpea', 'black bean', 'kidney bean', 'cannellini', 'navy bean', 'pinto bean'],
  spices: ['pepper', 'cinnamon', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary', 'garlic powder', 'onion powder', 'chili powder', 'cayenne', 'turmeric', 'curry', 'garam masala', 'nutmeg', 'clove', 'allspice', 'cardamom', 'coriander', 'dill', 'bay leaf', 'sage', 'tarragon', 'marjoram', 'fennel seed', 'mustard seed', 'red pepper flake', 'crushed red pepper', 'italian seasoning', 'taco seasoning', 'seasoning', 'spice', 'herb', 'dried oregano', 'dried basil', 'dried thyme', 'smoked paprika', 'black pepper', 'white pepper', 'sea salt', 'kosher salt', 'celery salt', 'garlic salt', 'old bay', 'everything bagel'],
  frozen: ['ice cream', 'frozen', 'popsicle', 'frozen pizza', 'frozen vegetable', 'frozen fruit', 'frozen dinner', 'ice'],
  beverages: ['juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer', 'sparkling water', 'lemonade', 'orange juice', 'apple juice', 'cranberry juice', 'grape juice', 'coconut water', 'almond milk', 'oat milk', 'soy milk', 'espresso', 'cold brew'],
  other: []
};

const CATEGORY_DISPLAY_ORDER = ['produce', 'meat', 'dairy', 'bakery', 'pantry', 'spices', 'frozen', 'beverages', 'other'];

const CATEGORY_ICONS = {
  produce: '🥬',
  dairy: '🧈',
  meat: '🥩',
  bakery: '🍞',
  pantry: '🥫',
  spices: '🧂',
  frozen: '🧊',
  beverages: '🥤',
  other: '📦',
  custom: '📝'
};

// =====================
// Ingredient Parsing
// =====================

// Common units for ingredient parsing
const UNITS = [
  'cup', 'cups', 'c',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'tb',
  'teaspoon', 'teaspoons', 'tsp', 'ts',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'gallon', 'gallons', 'gal',
  'quart', 'quarts', 'qt',
  'pint', 'pints', 'pt',
  'stick', 'sticks',
  'clove', 'cloves',
  'head', 'heads',
  'bunch', 'bunches',
  'can', 'cans',
  'jar', 'jars',
  'package', 'packages', 'pkg',
  'bag', 'bags',
  'box', 'boxes',
  'bottle', 'bottles',
  'slice', 'slices',
  'piece', 'pieces',
  'whole',
  'large', 'medium', 'small',
  'pinch', 'dash', 'handful'
];

// Unit conversion map (to base unit)
const UNIT_CONVERSIONS = {
  // Volume - base unit: teaspoon
  'teaspoon': 1, 'teaspoons': 1, 'tsp': 1, 'ts': 1,
  'tablespoon': 3, 'tablespoons': 3, 'tbsp': 3, 'tbs': 3, 'tb': 3,
  'cup': 48, 'cups': 48, 'c': 48,
  // Weight - base unit: ounce
  'ounce': 1, 'ounces': 1, 'oz': 1,
  'pound': 16, 'pounds': 16, 'lb': 16, 'lbs': 16,
  // Count-based - no conversion
  'clove': 1, 'cloves': 1,
  'can': 1, 'cans': 1,
  'slice': 1, 'slices': 1,
  'piece': 1, 'pieces': 1
};

// Unit type groupings
const UNIT_TYPES = {
  volume: ['teaspoon', 'teaspoons', 'tsp', 'ts', 'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'tb', 'cup', 'cups', 'c'],
  weight: ['ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g'],
  count: ['clove', 'cloves', 'can', 'cans', 'slice', 'slices', 'piece', 'pieces', 'whole', 'large', 'medium', 'small']
};

// Parse a fraction string like "1/2" to decimal
function parseFraction(str) {
  if (str.includes('/')) {
    const [num, denom] = str.split('/').map(Number);
    if (denom !== 0) return num / denom;
  }
  return parseFloat(str);
}

// Convert decimal to nice fraction string
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

// Parse an ingredient string into components
function parseIngredient(ingredientStr) {
  const trimmed = ingredientStr.trim();
  let quantity = null;
  let unit = null;
  let name = trimmed;
  let rest = trimmed;
  
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
  
  // Try to match unit
  const unitPattern = new RegExp(`^(${UNITS.join('|')})\\.?\\s+`, 'i');
  const unitMatch = rest.match(unitPattern);
  
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    rest = rest.slice(unitMatch[0].length);
  }
  
  // Handle parenthetical sizes like "(15 oz)"
  const parenPattern = /^\(([^)]+)\)\s*/;
  const parenMatch = rest.match(parenPattern);
  let modifier = null;
  
  if (parenMatch) {
    modifier = parenMatch[1];
    rest = rest.slice(parenMatch[0].length);
  }
  
  name = rest.trim();
  
  return {
    original: ingredientStr,
    quantity,
    unit,
    modifier,
    name,
    normalizedName: normalizeName(name)
  };
}

// Normalize ingredient name for comparison
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/,.*$/, '') // Remove everything after comma (often prep instructions)
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Get unit type for comparison
function getUnitType(unit) {
  if (!unit) return null;
  const lowerUnit = unit.toLowerCase();
  for (const [type, units] of Object.entries(UNIT_TYPES)) {
    if (units.includes(lowerUnit)) return type;
  }
  return null;
}

// Check if two units are compatible for combining
function areUnitsCompatible(unit1, unit2) {
  if (unit1 === unit2) return true;
  if (!unit1 && !unit2) return true;
  const type1 = getUnitType(unit1);
  const type2 = getUnitType(unit2);
  return type1 && type2 && type1 === type2;
}

// Combine two ingredients with compatible units
function combineIngredients(parsed1, parsed2) {
  // If units are the same, just add quantities
  if (parsed1.unit === parsed2.unit) {
    const newQty = (parsed1.quantity || 0) + (parsed2.quantity || 0);
    const unit = parsed1.unit || '';
    const unitStr = unit ? ` ${unit}` : '';
    return {
      ...parsed1,
      quantity: newQty,
      combined: true,
      displayName: `${decimalToFraction(newQty)}${unitStr} ${parsed1.name}`.trim()
    };
  }
  
  // Try to convert to same unit
  const conv1 = UNIT_CONVERSIONS[parsed1.unit];
  const conv2 = UNIT_CONVERSIONS[parsed2.unit];
  
  if (conv1 && conv2) {
    // Convert both to base unit, then to the larger unit
    const base1 = (parsed1.quantity || 0) * conv1;
    const base2 = (parsed2.quantity || 0) * conv2;
    const total = base1 + base2;
    
    // Use the larger unit for display
    const useUnit = conv1 >= conv2 ? parsed1.unit : parsed2.unit;
    const useFactor = conv1 >= conv2 ? conv1 : conv2;
    const finalQty = total / useFactor;
    
    return {
      ...parsed1,
      quantity: finalQty,
      unit: useUnit,
      combined: true,
      displayName: `${decimalToFraction(finalQty)} ${useUnit} ${parsed1.name}`.trim()
    };
  }
  
  // Can't combine - return null
  return null;
}

// Categorize an ingredient by name
function categorizeIngredient(ingredientName) {
  const lower = ingredientName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (category === 'other') continue;
    
    for (const keyword of keywords) {
      // Check if keyword appears as a word or part of the ingredient
      const regex = new RegExp(`\\b${keyword}s?\\b`, 'i');
      if (regex.test(lower)) {
        return category;
      }
    }
  }
  
  return 'other';
}

// Combine duplicate ingredients in a list
function combineIngredientList(items) {
  const parsedItems = items.map(item => ({
    ...item,
    parsed: parseIngredient(item.name)
  }));
  
  const combined = [];
  const used = new Set();
  
  for (let i = 0; i < parsedItems.length; i++) {
    if (used.has(i)) continue;
    
    const item = parsedItems[i];
    let current = item.parsed;
    const sources = [{ recipeTitle: item.recipeTitle, recipeSlug: item.recipeSlug }];
    
    // Look for duplicates
    for (let j = i + 1; j < parsedItems.length; j++) {
      if (used.has(j)) continue;
      
      const other = parsedItems[j];
      
      // Check if names match
      if (current.normalizedName === other.parsed.normalizedName) {
        // Check if units are compatible
        if (areUnitsCompatible(current.unit, other.parsed.unit)) {
          const combinedResult = combineIngredients(current, other.parsed);
          if (combinedResult) {
            current = combinedResult;
            used.add(j);
            if (other.recipeTitle) {
              sources.push({ recipeTitle: other.recipeTitle, recipeSlug: other.recipeSlug });
            }
          }
        } else {
          // Different unit types - can't combine, will be shown separately
        }
      }
    }
    
    used.add(i);
    
    // Build display name
    let displayName;
    if (current.combined) {
      displayName = current.displayName;
    } else if (current.quantity !== null) {
      const unit = current.unit || '';
      const unitStr = unit ? ` ${unit}` : '';
      displayName = `${decimalToFraction(current.quantity)}${unitStr} ${current.name}`.trim();
    } else {
      displayName = current.original;
    }
    
    combined.push({
      id: item.id || uuidv4(),
      name: displayName,
      originalName: item.name,
      category: categorizeIngredient(current.name),
      checked: item.checked || false,
      recipeTitle: item.recipeTitle,
      recipeSlug: item.recipeSlug,
      sources: sources.filter(s => s.recipeTitle),
      isCustom: item.isCustom || false
    });
  }
  
  return combined;
}

// Group items by category
function groupByCategory(items) {
  const groups = {};
  
  // Initialize all categories
  for (const cat of CATEGORY_DISPLAY_ORDER) {
    groups[cat] = [];
  }
  groups.custom = [];
  
  for (const item of items) {
    const cat = item.isCustom ? 'custom' : (item.category || 'other');
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  
  // Sort items within each category alphabetically
  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Return only non-empty categories in display order
  const result = [];
  
  // Add custom items first if any
  if (groups.custom && groups.custom.length > 0) {
    result.push({
      category: 'custom',
      displayName: 'Custom Items',
      icon: CATEGORY_ICONS.custom,
      items: groups.custom
    });
  }
  
  for (const cat of CATEGORY_DISPLAY_ORDER) {
    if (groups[cat] && groups[cat].length > 0) {
      result.push({
        category: cat,
        displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: CATEGORY_ICONS[cat],
        items: groups[cat]
      });
    }
  }
  
  return result;
}

// =====================
// Core Functions
// =====================

async function getAllLists() {
  await ensureDir(LISTS_DIR);
  try {
    const files = await fs.readdir(LISTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const lists = await Promise.all(jsonFiles.map(async (file) => {
      const content = await fs.readFile(path.join(LISTS_DIR, file), 'utf-8');
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    }));
    
    return lists.filter(Boolean).sort((a, b) => 
      new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  } catch (err) {
    console.error('Error reading shopping lists:', err);
    return [];
  }
}

async function getListById(id) {
  await ensureDir(LISTS_DIR);
  const filePath = path.join(LISTS_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function createList(name, items) {
  await ensureDir(LISTS_DIR);
  const now = new Date().toISOString();
  const list = {
    id: uuidv4(),
    name,
    items: items.map(item => ({ ...item, id: item.id || uuidv4() })),
    createdAt: now,
    updatedAt: now
  };
  
  const filePath = path.join(LISTS_DIR, `${list.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`Created shopping list: ${name}`);
  return list;
}

async function updateList(list) {
  await ensureDir(LISTS_DIR);
  list.updatedAt = new Date().toISOString();
  const filePath = path.join(LISTS_DIR, `${list.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf-8');
}

async function deleteList(id) {
  const filePath = path.join(LISTS_DIR, `${id}.json`);
  try {
    await fs.unlink(filePath);
    console.log(`Deleted shopping list: ${id}`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// Add a custom item to a list
async function addCustomItem(listId, itemName) {
  const list = await getListById(listId);
  if (!list) return null;
  
  const newItem = {
    id: uuidv4(),
    name: itemName.trim(),
    checked: false,
    isCustom: true,
    category: 'custom'
  };
  
  list.items.push(newItem);
  await updateList(list);
  return newItem;
}

// Process and combine items for a list
async function processListItems(listId) {
  const list = await getListById(listId);
  if (!list) return null;
  
  // Separate custom items from recipe items
  const customItems = list.items.filter(i => i.isCustom);
  const recipeItems = list.items.filter(i => !i.isCustom);
  
  // Combine recipe items
  const combinedRecipe = combineIngredientList(recipeItems);
  
  // Add custom items back (they don't get combined)
  const processedCustom = customItems.map(item => ({
    ...item,
    category: 'custom'
  }));
  
  const allItems = [...processedCustom, ...combinedRecipe];
  
  // Group by category
  const grouped = groupByCategory(allItems);
  
  return {
    ...list,
    processedItems: allItems,
    groupedItems: grouped
  };
}

module.exports = { 
  getAllLists, 
  getListById, 
  createList, 
  updateList, 
  deleteList,
  addCustomItem,
  processListItems,
  combineIngredientList,
  groupByCategory,
  categorizeIngredient,
  parseIngredient,
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_DISPLAY_ORDER
};
