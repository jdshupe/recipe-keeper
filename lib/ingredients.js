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
// Substitution Database
// =====================

/**
 * Substitution quality levels:
 * - great: Direct replacement with minimal taste/texture difference
 * - good: Works well but may have slight differences
 * - okay: Emergency substitute, noticeable differences
 */
const SUBSTITUTIONS = {
  // Dairy substitutions
  'butter': [
    { substitute: 'coconut oil', ratio: 1, quality: 'great', notes: 'Works well for baking, adds slight coconut flavor' },
    { substitute: 'olive oil', ratio: 0.75, quality: 'good', notes: 'Use 3/4 the amount, best for savory dishes' },
    { substitute: 'applesauce', ratio: 0.5, quality: 'good', notes: 'Use half the amount, good for baking, reduces fat' },
    { substitute: 'avocado', ratio: 1, quality: 'good', notes: 'Mashed, works well in baking' },
    { substitute: 'margarine', ratio: 1, quality: 'great', notes: 'Direct replacement' },
    { substitute: 'ghee', ratio: 1, quality: 'great', notes: 'Clarified butter, same properties' }
  ],
  'milk': [
    { substitute: 'almond milk', ratio: 1, quality: 'great', notes: 'Direct replacement, slightly nutty flavor' },
    { substitute: 'oat milk', ratio: 1, quality: 'great', notes: 'Creamy texture, good for baking' },
    { substitute: 'coconut milk', ratio: 1, quality: 'good', notes: 'Richer, adds coconut flavor' },
    { substitute: 'soy milk', ratio: 1, quality: 'great', notes: 'Most similar protein content' },
    { substitute: 'water', ratio: 1, quality: 'okay', notes: 'Emergency only, lacks fat/protein' },
    { substitute: 'evaporated milk', ratio: 0.5, quality: 'good', notes: 'Dilute with equal water, richer result' }
  ],
  'heavy cream': [
    { substitute: 'coconut cream', ratio: 1, quality: 'great', notes: 'Thick part of canned coconut milk' },
    { substitute: 'milk', ratio: 0.75, quality: 'okay', notes: 'Add 1/4 cup butter per cup milk for richness' },
    { substitute: 'half and half', ratio: 1, quality: 'good', notes: 'Less rich but works' },
    { substitute: 'evaporated milk', ratio: 1, quality: 'good', notes: 'Good for cooking, won\'t whip' }
  ],
  'sour cream': [
    { substitute: 'greek yogurt', ratio: 1, quality: 'great', notes: 'Similar texture and tang' },
    { substitute: 'plain yogurt', ratio: 1, quality: 'good', notes: 'Slightly thinner' },
    { substitute: 'cottage cheese', ratio: 1, quality: 'good', notes: 'Blend until smooth' },
    { substitute: 'cream cheese', ratio: 1, quality: 'good', notes: 'Add lemon juice for tang' }
  ],
  'yogurt': [
    { substitute: 'sour cream', ratio: 1, quality: 'great', notes: 'Similar texture' },
    { substitute: 'buttermilk', ratio: 1, quality: 'good', notes: 'Thinner, good for baking' },
    { substitute: 'coconut yogurt', ratio: 1, quality: 'great', notes: 'Dairy-free option' },
    { substitute: 'silken tofu', ratio: 1, quality: 'good', notes: 'Blend until smooth, add lemon' }
  ],
  'cream cheese': [
    { substitute: 'mascarpone', ratio: 1, quality: 'great', notes: 'Richer, less tangy' },
    { substitute: 'cottage cheese', ratio: 1, quality: 'good', notes: 'Blend until smooth' },
    { substitute: 'greek yogurt', ratio: 1, quality: 'good', notes: 'More tangy, less rich' },
    { substitute: 'tofu cream cheese', ratio: 1, quality: 'good', notes: 'Dairy-free option' }
  ],
  'buttermilk': [
    { substitute: 'milk + vinegar', ratio: 1, quality: 'great', notes: 'Add 1 tbsp vinegar per cup milk, let sit 5 min' },
    { substitute: 'milk + lemon juice', ratio: 1, quality: 'great', notes: 'Add 1 tbsp lemon per cup milk' },
    { substitute: 'yogurt + water', ratio: 1, quality: 'good', notes: 'Mix 3/4 cup yogurt with 1/4 cup water' },
    { substitute: 'kefir', ratio: 1, quality: 'great', notes: 'Very similar properties' }
  ],
  
  // Egg substitutions
  'egg': [
    { substitute: 'flax egg', ratio: 1, quality: 'great', notes: '1 tbsp ground flax + 3 tbsp water per egg' },
    { substitute: 'chia egg', ratio: 1, quality: 'great', notes: '1 tbsp chia + 3 tbsp water per egg' },
    { substitute: 'applesauce', ratio: 0.25, quality: 'good', notes: '1/4 cup per egg, adds sweetness' },
    { substitute: 'mashed banana', ratio: 0.25, quality: 'good', notes: '1/4 cup per egg, adds banana flavor' },
    { substitute: 'silken tofu', ratio: 0.25, quality: 'good', notes: '1/4 cup blended per egg' },
    { substitute: 'commercial egg replacer', ratio: 1, quality: 'great', notes: 'Follow package directions' },
    { substitute: 'aquafaba', ratio: 3, quality: 'great', notes: '3 tbsp chickpea water per egg' }
  ],
  'eggs': [
    { substitute: 'flax egg', ratio: 1, quality: 'great', notes: '1 tbsp ground flax + 3 tbsp water per egg' },
    { substitute: 'chia egg', ratio: 1, quality: 'great', notes: '1 tbsp chia + 3 tbsp water per egg' },
    { substitute: 'applesauce', ratio: 0.25, quality: 'good', notes: '1/4 cup per egg, adds sweetness' },
    { substitute: 'aquafaba', ratio: 3, quality: 'great', notes: '3 tbsp chickpea water per egg' }
  ],
  
  // Flour substitutions
  'all-purpose flour': [
    { substitute: 'whole wheat flour', ratio: 1, quality: 'good', notes: 'Denser result, more fiber' },
    { substitute: 'almond flour', ratio: 1, quality: 'good', notes: 'Gluten-free, moister result' },
    { substitute: 'oat flour', ratio: 1, quality: 'good', notes: 'Gluten-free if certified' },
    { substitute: 'coconut flour', ratio: 0.25, quality: 'okay', notes: 'Use 1/4 amount, add more liquid' },
    { substitute: 'gluten-free flour blend', ratio: 1, quality: 'great', notes: 'Designed as direct replacement' }
  ],
  'flour': [
    { substitute: 'whole wheat flour', ratio: 1, quality: 'good', notes: 'Denser result' },
    { substitute: 'almond flour', ratio: 1, quality: 'good', notes: 'Gluten-free option' },
    { substitute: 'oat flour', ratio: 1, quality: 'good', notes: 'Blend oats until fine' },
    { substitute: 'gluten-free flour blend', ratio: 1, quality: 'great', notes: 'Direct replacement' }
  ],
  'bread flour': [
    { substitute: 'all-purpose flour', ratio: 1, quality: 'good', notes: 'Less chewy result' },
    { substitute: 'all-purpose flour + vital wheat gluten', ratio: 1, quality: 'great', notes: 'Add 1 tbsp gluten per cup' }
  ],
  
  // Sugar substitutions
  'sugar': [
    { substitute: 'honey', ratio: 0.75, quality: 'good', notes: 'Use 3/4 amount, reduce liquid slightly' },
    { substitute: 'maple syrup', ratio: 0.75, quality: 'good', notes: 'Use 3/4 amount, reduce liquid' },
    { substitute: 'coconut sugar', ratio: 1, quality: 'great', notes: 'Direct replacement, caramel notes' },
    { substitute: 'stevia', ratio: 0.01, quality: 'good', notes: 'Much sweeter, use tiny amount' },
    { substitute: 'agave nectar', ratio: 0.67, quality: 'good', notes: 'Use 2/3 amount' }
  ],
  'brown sugar': [
    { substitute: 'white sugar + molasses', ratio: 1, quality: 'great', notes: '1 cup sugar + 1 tbsp molasses' },
    { substitute: 'coconut sugar', ratio: 1, quality: 'great', notes: 'Similar flavor profile' },
    { substitute: 'maple syrup', ratio: 0.75, quality: 'good', notes: 'Reduce other liquids' },
    { substitute: 'honey', ratio: 0.75, quality: 'good', notes: 'Different flavor but works' }
  ],
  
  // Oil/Fat substitutions
  'vegetable oil': [
    { substitute: 'canola oil', ratio: 1, quality: 'great', notes: 'Direct replacement' },
    { substitute: 'olive oil', ratio: 1, quality: 'good', notes: 'Adds flavor, good for savory' },
    { substitute: 'coconut oil', ratio: 1, quality: 'good', notes: 'Melted, adds slight coconut flavor' },
    { substitute: 'applesauce', ratio: 0.5, quality: 'good', notes: 'Use half amount for baking' },
    { substitute: 'avocado oil', ratio: 1, quality: 'great', notes: 'Neutral flavor, high heat' }
  ],
  'olive oil': [
    { substitute: 'avocado oil', ratio: 1, quality: 'great', notes: 'Similar health benefits' },
    { substitute: 'vegetable oil', ratio: 1, quality: 'good', notes: 'More neutral flavor' },
    { substitute: 'coconut oil', ratio: 1, quality: 'good', notes: 'Different flavor profile' },
    { substitute: 'butter', ratio: 1, quality: 'good', notes: 'For cooking, not high heat' }
  ],
  
  // Leavening substitutions
  'baking powder': [
    { substitute: 'baking soda + cream of tartar', ratio: 1, quality: 'great', notes: '1/4 tsp soda + 1/2 tsp cream of tartar per tsp' },
    { substitute: 'baking soda + lemon juice', ratio: 1, quality: 'good', notes: '1/4 tsp soda + 1/2 tsp lemon per tsp' },
    { substitute: 'baking soda + vinegar', ratio: 1, quality: 'good', notes: '1/4 tsp soda + 1/2 tsp vinegar per tsp' },
    { substitute: 'self-rising flour', ratio: 1, quality: 'good', notes: 'Replace regular flour, omit baking powder' }
  ],
  'baking soda': [
    { substitute: 'baking powder', ratio: 3, quality: 'good', notes: 'Use 3x the amount, less effective' }
  ],
  
  // Condiment substitutions
  'soy sauce': [
    { substitute: 'tamari', ratio: 1, quality: 'great', notes: 'Gluten-free, similar flavor' },
    { substitute: 'coconut aminos', ratio: 1, quality: 'good', notes: 'Less salty, slightly sweet' },
    { substitute: 'worcestershire sauce', ratio: 0.5, quality: 'okay', notes: 'Different flavor, use less' },
    { substitute: 'liquid aminos', ratio: 1, quality: 'great', notes: 'Similar umami flavor' }
  ],
  'worcestershire sauce': [
    { substitute: 'soy sauce + vinegar', ratio: 1, quality: 'good', notes: 'Mix equal parts' },
    { substitute: 'coconut aminos + vinegar', ratio: 1, quality: 'good', notes: 'Gluten-free option' },
    { substitute: 'balsamic vinegar', ratio: 1, quality: 'okay', notes: 'Different but adds depth' }
  ],
  
  // Vinegar substitutions
  'white wine vinegar': [
    { substitute: 'rice vinegar', ratio: 1, quality: 'great', notes: 'Mild, similar acidity' },
    { substitute: 'apple cider vinegar', ratio: 1, quality: 'good', notes: 'Slightly fruitier' },
    { substitute: 'lemon juice', ratio: 1, quality: 'good', notes: 'Fresh, citrus notes' },
    { substitute: 'champagne vinegar', ratio: 1, quality: 'great', notes: 'Light and mild' }
  ],
  'balsamic vinegar': [
    { substitute: 'red wine vinegar + honey', ratio: 1, quality: 'good', notes: 'Add 1/2 tsp honey per tbsp vinegar' },
    { substitute: 'apple cider vinegar + molasses', ratio: 1, quality: 'okay', notes: 'Approximates sweetness' },
    { substitute: 'sherry vinegar', ratio: 1, quality: 'good', notes: 'Similar depth' }
  ],
  'rice vinegar': [
    { substitute: 'white wine vinegar', ratio: 1, quality: 'great', notes: 'Slightly stronger' },
    { substitute: 'apple cider vinegar', ratio: 1, quality: 'good', notes: 'Dilute with water for mildness' },
    { substitute: 'lemon juice', ratio: 1, quality: 'good', notes: 'Fresh alternative' }
  ],
  
  // Spice/Herb substitutions
  'fresh herbs': [
    { substitute: 'dried herbs', ratio: 0.33, quality: 'good', notes: 'Use 1/3 the amount' }
  ],
  'dried herbs': [
    { substitute: 'fresh herbs', ratio: 3, quality: 'great', notes: 'Use 3x the amount' }
  ],
  'fresh basil': [
    { substitute: 'dried basil', ratio: 0.33, quality: 'good', notes: 'Use 1/3 the amount' },
    { substitute: 'fresh oregano', ratio: 1, quality: 'okay', notes: 'Different but complementary' },
    { substitute: 'fresh spinach', ratio: 1, quality: 'okay', notes: 'For pesto, milder flavor' }
  ],
  'fresh cilantro': [
    { substitute: 'fresh parsley', ratio: 1, quality: 'good', notes: 'Less distinctive flavor' },
    { substitute: 'fresh basil', ratio: 1, quality: 'okay', notes: 'Thai basil for Asian dishes' },
    { substitute: 'dried cilantro', ratio: 0.33, quality: 'okay', notes: 'Much less flavorful' }
  ],
  'fresh parsley': [
    { substitute: 'fresh cilantro', ratio: 1, quality: 'good', notes: 'Stronger flavor' },
    { substitute: 'fresh chervil', ratio: 1, quality: 'great', notes: 'Mild, similar appearance' },
    { substitute: 'dried parsley', ratio: 0.33, quality: 'okay', notes: 'Less vibrant' }
  ],
  
  // Garlic/Onion substitutions
  'fresh garlic': [
    { substitute: 'garlic powder', ratio: 0.125, quality: 'good', notes: '1/8 tsp per clove' },
    { substitute: 'garlic paste', ratio: 0.5, quality: 'great', notes: '1/2 tsp per clove' },
    { substitute: 'minced garlic (jar)', ratio: 0.5, quality: 'great', notes: '1/2 tsp per clove' },
    { substitute: 'shallot', ratio: 0.5, quality: 'okay', notes: 'Milder, different flavor' }
  ],
  'garlic': [
    { substitute: 'garlic powder', ratio: 0.125, quality: 'good', notes: '1/8 tsp per clove' },
    { substitute: 'garlic paste', ratio: 0.5, quality: 'great', notes: '1/2 tsp per clove' }
  ],
  'onion': [
    { substitute: 'shallot', ratio: 1, quality: 'great', notes: 'Milder, sweeter' },
    { substitute: 'leek', ratio: 1, quality: 'good', notes: 'White/light green parts only' },
    { substitute: 'green onion', ratio: 1, quality: 'good', notes: 'Milder flavor' },
    { substitute: 'onion powder', ratio: 0.04, quality: 'okay', notes: '1 tbsp per medium onion' }
  ],
  
  // Tomato substitutions
  'tomato paste': [
    { substitute: 'tomato sauce', ratio: 3, quality: 'good', notes: 'Use 3x amount, reduce liquid in recipe' },
    { substitute: 'ketchup', ratio: 1, quality: 'okay', notes: 'Sweeter, less concentrated' },
    { substitute: 'crushed tomatoes', ratio: 3, quality: 'good', notes: 'Blend and reduce' }
  ],
  'canned tomatoes': [
    { substitute: 'fresh tomatoes', ratio: 1.5, quality: 'great', notes: 'Use 1.5x amount, blanch and peel' },
    { substitute: 'tomato sauce', ratio: 1, quality: 'good', notes: 'Smoother texture' },
    { substitute: 'tomato paste + water', ratio: 0.33, quality: 'good', notes: '1/3 paste + 2/3 water' }
  ],
  
  // Broth/Stock substitutions
  'chicken broth': [
    { substitute: 'vegetable broth', ratio: 1, quality: 'good', notes: 'Vegetarian option' },
    { substitute: 'chicken bouillon + water', ratio: 1, quality: 'great', notes: '1 cube per cup water' },
    { substitute: 'water', ratio: 1, quality: 'okay', notes: 'Add extra seasonings' },
    { substitute: 'beef broth', ratio: 1, quality: 'okay', notes: 'Stronger, darker flavor' }
  ],
  'beef broth': [
    { substitute: 'vegetable broth', ratio: 1, quality: 'good', notes: 'Lighter flavor' },
    { substitute: 'beef bouillon + water', ratio: 1, quality: 'great', notes: '1 cube per cup water' },
    { substitute: 'mushroom broth', ratio: 1, quality: 'good', notes: 'Rich umami flavor' },
    { substitute: 'red wine + water', ratio: 0.5, quality: 'okay', notes: 'Half wine, half water' }
  ],
  'vegetable broth': [
    { substitute: 'chicken broth', ratio: 1, quality: 'good', notes: 'Non-vegetarian' },
    { substitute: 'water + miso', ratio: 1, quality: 'good', notes: '1 tbsp miso per cup' },
    { substitute: 'water + soy sauce', ratio: 1, quality: 'okay', notes: 'For umami depth' }
  ],
  
  // Cheese substitutions
  'parmesan': [
    { substitute: 'pecorino romano', ratio: 1, quality: 'great', notes: 'Sharper, saltier' },
    { substitute: 'asiago', ratio: 1, quality: 'good', notes: 'Milder flavor' },
    { substitute: 'nutritional yeast', ratio: 1, quality: 'good', notes: 'Vegan option, cheesy flavor' },
    { substitute: 'grana padano', ratio: 1, quality: 'great', notes: 'Very similar' }
  ],
  'mozzarella': [
    { substitute: 'provolone', ratio: 1, quality: 'good', notes: 'Sharper flavor' },
    { substitute: 'monterey jack', ratio: 1, quality: 'good', notes: 'Good melting' },
    { substitute: 'vegan mozzarella', ratio: 1, quality: 'good', notes: 'Dairy-free option' }
  ],
  'cheddar': [
    { substitute: 'colby', ratio: 1, quality: 'great', notes: 'Milder, similar texture' },
    { substitute: 'gouda', ratio: 1, quality: 'good', notes: 'Slightly sweeter' },
    { substitute: 'monterey jack', ratio: 1, quality: 'good', notes: 'Milder flavor' }
  ],
  
  // Nut/Seed substitutions
  'peanuts': [
    { substitute: 'sunflower seeds', ratio: 1, quality: 'good', notes: 'Nut-free option' },
    { substitute: 'soy nuts', ratio: 1, quality: 'good', notes: 'Similar crunch' },
    { substitute: 'almonds', ratio: 1, quality: 'great', notes: 'If not avoiding tree nuts' }
  ],
  'peanut butter': [
    { substitute: 'almond butter', ratio: 1, quality: 'great', notes: 'Tree nut option' },
    { substitute: 'sunflower seed butter', ratio: 1, quality: 'good', notes: 'Nut-free option' },
    { substitute: 'tahini', ratio: 1, quality: 'good', notes: 'Sesame-based, less sweet' },
    { substitute: 'cashew butter', ratio: 1, quality: 'great', notes: 'Creamier' }
  ],
  'almonds': [
    { substitute: 'cashews', ratio: 1, quality: 'great', notes: 'Similar texture' },
    { substitute: 'sunflower seeds', ratio: 1, quality: 'good', notes: 'Nut-free option' },
    { substitute: 'pepitas', ratio: 1, quality: 'good', notes: 'Pumpkin seeds' }
  ],
  
  // Alcohol substitutions (for cooking)
  'white wine': [
    { substitute: 'chicken broth', ratio: 1, quality: 'good', notes: 'Add splash of vinegar' },
    { substitute: 'white grape juice', ratio: 1, quality: 'good', notes: 'Sweeter, add vinegar' },
    { substitute: 'dry vermouth', ratio: 1, quality: 'great', notes: 'More complex flavor' },
    { substitute: 'apple cider vinegar + water', ratio: 0.5, quality: 'okay', notes: 'Half vinegar, half water' }
  ],
  'red wine': [
    { substitute: 'beef broth', ratio: 1, quality: 'good', notes: 'Add splash of vinegar' },
    { substitute: 'grape juice', ratio: 1, quality: 'good', notes: 'Sweeter, add vinegar' },
    { substitute: 'cranberry juice', ratio: 1, quality: 'okay', notes: 'Tart substitute' },
    { substitute: 'pomegranate juice', ratio: 1, quality: 'good', notes: 'Rich color and flavor' }
  ],
  
  // Cornstarch/Thickener substitutions
  'cornstarch': [
    { substitute: 'all-purpose flour', ratio: 2, quality: 'good', notes: 'Use 2x amount' },
    { substitute: 'arrowroot', ratio: 1, quality: 'great', notes: 'Direct replacement' },
    { substitute: 'tapioca starch', ratio: 1, quality: 'great', notes: 'Direct replacement' },
    { substitute: 'potato starch', ratio: 1, quality: 'great', notes: 'Direct replacement' }
  ],
  
  // Honey substitutions
  'honey': [
    { substitute: 'maple syrup', ratio: 1, quality: 'great', notes: 'Slightly different flavor' },
    { substitute: 'agave nectar', ratio: 1, quality: 'great', notes: 'Vegan option' },
    { substitute: 'corn syrup', ratio: 1, quality: 'good', notes: 'Less complex flavor' },
    { substitute: 'molasses', ratio: 0.5, quality: 'okay', notes: 'Stronger, darker' }
  ],
  
  // Lemon/Lime substitutions
  'lemon juice': [
    { substitute: 'lime juice', ratio: 1, quality: 'great', notes: 'Slightly different citrus flavor' },
    { substitute: 'white wine vinegar', ratio: 0.5, quality: 'good', notes: 'Use half amount' },
    { substitute: 'orange juice', ratio: 1, quality: 'okay', notes: 'Sweeter, less tart' }
  ],
  'lime juice': [
    { substitute: 'lemon juice', ratio: 1, quality: 'great', notes: 'Slightly different citrus flavor' },
    { substitute: 'white wine vinegar', ratio: 0.5, quality: 'good', notes: 'Use half amount' }
  ],
  'lemon zest': [
    { substitute: 'lemon extract', ratio: 0.5, quality: 'good', notes: 'Use 1/2 tsp per tsp zest' },
    { substitute: 'lime zest', ratio: 1, quality: 'good', notes: 'Different citrus flavor' },
    { substitute: 'orange zest', ratio: 1, quality: 'okay', notes: 'Sweeter, less tart' }
  ]
};

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
// Shelf Life Defaults (in days)
// =====================

/**
 * Default shelf life data for common ingredient categories by storage location.
 * Used to auto-suggest expiration dates when adding items to pantry.
 * 
 * Structure: { category: { location: { days, hint } } }
 */
const SHELF_LIFE_DEFAULTS = {
  // Dairy products
  dairy: {
    refrigerator: { days: 10, hint: 'Typically good for 7-14 days' },
    freezer: { days: 90, hint: 'Typically good for 3 months' },
    pantry: { days: 1, hint: 'Dairy should be refrigerated!' }
  },
  
  // Meat & Seafood
  meat: {
    refrigerator: { days: 4, hint: 'Typically good for 3-5 days' },
    freezer: { days: 120, hint: 'Typically good for 4-6 months' },
    pantry: { days: 0, hint: 'Meat should be refrigerated or frozen!' }
  },
  
  // Produce - varies widely
  produce: {
    refrigerator: { days: 7, hint: 'Typically good for 5-14 days' },
    freezer: { days: 240, hint: 'Typically good for 8-12 months' },
    pantry: { days: 5, hint: 'Typically good for 3-7 days' }
  },
  
  // Bread & Bakery
  bakery: {
    refrigerator: { days: 7, hint: 'Typically good for 5-7 days' },
    freezer: { days: 90, hint: 'Typically good for 3 months' },
    pantry: { days: 5, hint: 'Typically good for 3-7 days' }
  },
  
  // Pantry staples (long shelf life)
  pantry: {
    refrigerator: { days: 365, hint: 'Typically good for 1+ year' },
    freezer: { days: 730, hint: 'Typically good for 2+ years' },
    pantry: { days: 365, hint: 'Typically good for 1+ year' }
  },
  
  // Spices & Seasonings
  spices: {
    refrigerator: { days: 730, hint: 'Typically good for 2+ years' },
    freezer: { days: 1095, hint: 'Typically good for 3+ years' },
    pantry: { days: 730, hint: 'Typically good for 2-3 years' }
  },
  
  // Frozen Foods
  frozen: {
    refrigerator: { days: 2, hint: 'Use within 1-2 days after thawing' },
    freezer: { days: 180, hint: 'Typically good for 6 months' },
    pantry: { days: 0, hint: 'Frozen foods should stay frozen!' }
  },
  
  // Beverages
  beverages: {
    refrigerator: { days: 14, hint: 'Typically good for 1-2 weeks after opening' },
    freezer: { days: 180, hint: 'Typically good for 6 months' },
    pantry: { days: 365, hint: 'Typically good for 1 year unopened' }
  },
  
  // Other/Default
  other: {
    refrigerator: { days: 14, hint: 'Check package for expiration' },
    freezer: { days: 90, hint: 'Typically good for 3 months' },
    pantry: { days: 90, hint: 'Check package for expiration' }
  }
};

/**
 * Specific shelf life overrides for common ingredients
 * More precise than category defaults
 */
const INGREDIENT_SHELF_LIFE = {
  // Dairy specifics
  'milk': { refrigerator: 7, freezer: 90 },
  'butter': { refrigerator: 30, freezer: 365 },
  'cheese': { refrigerator: 21, freezer: 180 },
  'hard cheese': { refrigerator: 42, freezer: 180 },
  'soft cheese': { refrigerator: 7, freezer: 60 },
  'yogurt': { refrigerator: 14, freezer: 60 },
  'cream': { refrigerator: 14, freezer: 90 },
  'eggs': { refrigerator: 35, freezer: 365 },
  'sour cream': { refrigerator: 21, freezer: 90 },
  
  // Meat specifics
  'chicken': { refrigerator: 2, freezer: 270 },
  'chicken breast': { refrigerator: 2, freezer: 270 },
  'ground beef': { refrigerator: 2, freezer: 120 },
  'beef': { refrigerator: 5, freezer: 180 },
  'steak': { refrigerator: 5, freezer: 180 },
  'pork': { refrigerator: 5, freezer: 180 },
  'bacon': { refrigerator: 7, freezer: 30 },
  'sausage': { refrigerator: 2, freezer: 60 },
  'fish': { refrigerator: 2, freezer: 90 },
  'salmon': { refrigerator: 2, freezer: 90 },
  'shrimp': { refrigerator: 2, freezer: 180 },
  'deli meat': { refrigerator: 5, freezer: 60 },
  
  // Produce specifics
  'lettuce': { refrigerator: 7, pantry: 1 },
  'spinach': { refrigerator: 7, pantry: 1 },
  'tomatoes': { refrigerator: 7, pantry: 5 },
  'onion': { refrigerator: 60, pantry: 30 },
  'onions': { refrigerator: 60, pantry: 30 },
  'garlic': { refrigerator: 120, pantry: 30 },
  'potatoes': { refrigerator: 21, pantry: 21 },
  'carrots': { refrigerator: 21, pantry: 7 },
  'celery': { refrigerator: 14, pantry: 1 },
  'bell pepper': { refrigerator: 14, pantry: 3 },
  'peppers': { refrigerator: 14, pantry: 3 },
  'mushrooms': { refrigerator: 7, pantry: 1 },
  'avocado': { refrigerator: 5, pantry: 5 },
  'bananas': { refrigerator: 7, pantry: 5 },
  'apples': { refrigerator: 42, pantry: 7 },
  'oranges': { refrigerator: 21, pantry: 7 },
  'lemons': { refrigerator: 28, pantry: 7 },
  'limes': { refrigerator: 28, pantry: 7 },
  'berries': { refrigerator: 5, freezer: 365 },
  'herbs': { refrigerator: 7, freezer: 180 },
  'fresh herbs': { refrigerator: 7, freezer: 180 },
  
  // Bakery
  'bread': { refrigerator: 14, freezer: 90, pantry: 5 },
  'tortillas': { refrigerator: 30, freezer: 180, pantry: 7 },
  
  // Condiments (after opening)
  'ketchup': { refrigerator: 180, pantry: 30 },
  'mustard': { refrigerator: 365, pantry: 30 },
  'mayonnaise': { refrigerator: 60, pantry: 0 },
  'soy sauce': { refrigerator: 730, pantry: 365 },
  'hot sauce': { refrigerator: 730, pantry: 180 },
  
  // Pantry staples
  'flour': { pantry: 365, refrigerator: 730 },
  'sugar': { pantry: 730, refrigerator: 730 },
  'rice': { pantry: 730, refrigerator: 730 },
  'pasta': { pantry: 730, refrigerator: 730 },
  'olive oil': { pantry: 365, refrigerator: 365 },
  'vegetable oil': { pantry: 365, refrigerator: 365 },
  'honey': { pantry: 1095, refrigerator: 1095 },
  'peanut butter': { pantry: 180, refrigerator: 365 },
  'canned goods': { pantry: 730, refrigerator: 7 },
  'beans': { pantry: 730, refrigerator: 7 },
  'coffee': { pantry: 180, freezer: 365 },
  'tea': { pantry: 365 }
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
 *
 * Pantry Metadata Schema (tracks usage patterns):
 * {
 *   frequencyData: { [ingredientName: string]: { count: number, lastAdded: string, lastUnit: string, lastLocation: string } },
 *   recentlyAdded: [{ ingredientName: string, addedAt: string, unit: string, location: string }] (max 20 items)
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
    // Ensure metadata fields exist for older databases
    if (!pantryCache.frequencyData) {
      pantryCache.frequencyData = {};
    }
    if (!pantryCache.recentlyAdded) {
      pantryCache.recentlyAdded = [];
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      pantryCache = {
        version: '1.0.0',
        items: [],
        frequencyData: {},
        recentlyAdded: [],
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
  
  // Update frequency tracking
  const normalizedName = ingredient.name.toLowerCase();
  if (!pantryCache.frequencyData) {
    pantryCache.frequencyData = {};
  }
  if (!pantryCache.frequencyData[normalizedName]) {
    pantryCache.frequencyData[normalizedName] = {
      count: 0,
      displayName: ingredient.name,
      lastAdded: null,
      lastUnit: null,
      lastLocation: null
    };
  }
  pantryCache.frequencyData[normalizedName].count++;
  pantryCache.frequencyData[normalizedName].lastAdded = now;
  pantryCache.frequencyData[normalizedName].lastUnit = pantryItem.unit;
  pantryCache.frequencyData[normalizedName].lastLocation = pantryItem.location;
  pantryCache.frequencyData[normalizedName].displayName = ingredient.name;
  
  // Update recently added tracking
  if (!pantryCache.recentlyAdded) {
    pantryCache.recentlyAdded = [];
  }
  // Remove if already in recent list
  pantryCache.recentlyAdded = pantryCache.recentlyAdded.filter(
    r => r.ingredientName.toLowerCase() !== normalizedName
  );
  // Add to front of list
  pantryCache.recentlyAdded.unshift({
    ingredientName: ingredient.name,
    addedAt: now,
    unit: pantryItem.unit,
    location: pantryItem.location
  });
  // Keep only last 20
  if (pantryCache.recentlyAdded.length > 20) {
    pantryCache.recentlyAdded = pantryCache.recentlyAdded.slice(0, 20);
  }
  
  await savePantryDB();
  
  return pantryItem;
}

/**
 * Bulk add items to pantry
 * @param {Array} items - Array of pantry item data objects
 * @returns {Object} - Results with added items and any errors
 */
async function bulkAddToPantry(items) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const results = {
    success: [],
    errors: []
  };
  
  for (const itemData of items) {
    try {
      const item = await addToPantry(itemData);
      results.success.push(item);
    } catch (err) {
      results.errors.push({
        item: itemData,
        error: err.message
      });
    }
  }
  
  return results;
}

/**
 * Get frequently added items (added 3+ times)
 * @param {number} minCount - Minimum add count (default 3)
 * @param {number} limit - Maximum items to return (default 15)
 * @returns {Array} - Sorted by frequency descending
 */
async function getFrequentlyAddedItems(minCount = 3, limit = 15) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const frequencyData = pantryCache.frequencyData || {};
  
  const frequentItems = Object.entries(frequencyData)
    .filter(([_, data]) => data.count >= minCount)
    .map(([name, data]) => ({
      ingredientName: data.displayName || name,
      count: data.count,
      lastAdded: data.lastAdded,
      lastUnit: data.lastUnit,
      lastLocation: data.lastLocation
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return frequentItems;
}

/**
 * Get recently added items
 * @param {number} limit - Maximum items to return (default 10)
 * @returns {Array} - Most recent first
 */
async function getRecentlyAddedItems(limit = 10) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const recentItems = (pantryCache.recentlyAdded || []).slice(0, limit);
  return recentItems;
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
// Substitution Functions
// =====================

/**
 * Get substitutes for an ingredient
 * @param {string} ingredientName - Name of the ingredient to find substitutes for
 * @returns {Object} - Substitutes with metadata
 */
function getSubstitutes(ingredientName) {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Direct match
  if (SUBSTITUTIONS[normalizedName]) {
    return {
      ingredient: ingredientName,
      substitutes: SUBSTITUTIONS[normalizedName],
      exactMatch: true
    };
  }
  
  // Partial match - check if ingredient name contains a key
  for (const [key, subs] of Object.entries(SUBSTITUTIONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return {
        ingredient: ingredientName,
        substitutes: subs,
        exactMatch: false,
        matchedKey: key
      };
    }
  }
  
  // No match found
  return {
    ingredient: ingredientName,
    substitutes: [],
    exactMatch: false
  };
}

/**
 * Get all substitution rules
 * @returns {Object} - Complete substitution database
 */
function getAllSubstitutions() {
  return SUBSTITUTIONS;
}

/**
 * Find substitutes available in pantry for a missing ingredient
 * @param {string} ingredientName - The missing ingredient
 * @returns {Array} - Substitutes that are available in pantry
 */
async function getAvailableSubstitutes(ingredientName) {
  const { substitutes } = getSubstitutes(ingredientName);
  if (substitutes.length === 0) return [];
  
  const pantryItems = await getPantryItems();
  const pantryNames = new Set(
    pantryItems
      .filter(p => p.quantity > 0)
      .map(p => p.ingredientName.toLowerCase())
  );
  
  const available = [];
  for (const sub of substitutes) {
    const subNameLower = sub.substitute.toLowerCase();
    // Check if substitute or part of it is in pantry
    const inPantry = pantryNames.has(subNameLower) ||
      [...pantryNames].some(name => 
        name.includes(subNameLower) || subNameLower.includes(name)
      );
    
    if (inPantry) {
      available.push(sub);
    }
  }
  
  return available;
}

// =====================
// Nutrition Functions
// =====================

/**
 * Default nutrition values per 100g for common ingredients
 * Used as fallback when no nutrition data is stored
 */
const DEFAULT_NUTRITION = {
  // Proteins
  'chicken': { calories: 239, protein: 27, carbs: 0, fat: 14, fiber: 0, sodium: 82 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sodium: 72 },
  'ground beef': { calories: 254, protein: 17, carbs: 0, fat: 20, fiber: 0, sodium: 75 },
  'pork': { calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0, sodium: 62 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59 },
  'shrimp': { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sodium: 111 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124 },
  'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124 },
  'tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sodium: 7 },
  
  // Dairy
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sodium: 44 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 11 },
  'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sodium: 621 },
  'cream': { calories: 340, protein: 2.8, carbs: 2.8, fat: 36, fiber: 0, sodium: 40 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0, sodium: 36 },
  'sour cream': { calories: 198, protein: 2.4, carbs: 4.6, fat: 19, fiber: 0, sodium: 80 },
  
  // Grains & Starches
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sodium: 1 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sodium: 491 },
  'flour': { calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, sodium: 2 },
  'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, sodium: 2 },
  'quinoa': { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sodium: 7 },
  'couscous': { calories: 112, protein: 3.8, carbs: 23, fat: 0.2, fiber: 1.4, sodium: 5 },
  
  // Vegetables
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sodium: 4 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sodium: 17 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sodium: 6 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sodium: 69 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sodium: 33 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sodium: 79 },
  'bell pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sodium: 4 },
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sodium: 5 },
  'zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sodium: 8 },
  'cucumber': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sodium: 2 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sodium: 28 },
  'corn': { calories: 86, protein: 3.2, carbs: 19, fat: 1.2, fiber: 2.7, sodium: 15 },
  
  // Fruits
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sodium: 1 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sodium: 1 },
  'lemon': { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, sodium: 2 },
  'lime': { calories: 30, protein: 0.7, carbs: 11, fat: 0.2, fiber: 2.8, sodium: 2 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sodium: 0 },
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sodium: 7 },
  
  // Oils & Fats
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 2 },
  'vegetable oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 0 },
  'coconut oil': { calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 0 },
  
  // Condiments & Sauces
  'soy sauce': { calories: 53, protein: 8.1, carbs: 4.9, fat: 0.1, fiber: 0.8, sodium: 5493 },
  'tomato sauce': { calories: 29, protein: 1.3, carbs: 5.5, fat: 0.5, fiber: 1.5, sodium: 430 },
  'ketchup': { calories: 112, protein: 1.7, carbs: 26, fat: 0.1, fiber: 0.3, sodium: 907 },
  'mayonnaise': { calories: 680, protein: 1, carbs: 0.6, fat: 75, fiber: 0, sodium: 635 },
  'mustard': { calories: 66, protein: 4.4, carbs: 5.3, fat: 4, fiber: 3.3, sodium: 1135 },
  
  // Sweeteners
  'sugar': { calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, sodium: 1 },
  'honey': { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, sodium: 4 },
  'maple syrup': { calories: 260, protein: 0, carbs: 67, fat: 0.1, fiber: 0, sodium: 12 },
  
  // Legumes & Beans
  'beans': { calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 7.4, sodium: 1 },
  'chickpeas': { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sodium: 7 },
  'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sodium: 2 },
  
  // Nuts & Seeds
  'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sodium: 1 },
  'peanuts': { calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5, sodium: 18 },
  'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, sodium: 2 },
  
  // Herbs & Spices (per 100g, though used in small amounts)
  'salt': { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 38758 },
  'pepper': { calories: 251, protein: 10, carbs: 64, fat: 3.3, fiber: 25, sodium: 20 },
  'basil': { calories: 23, protein: 3.2, carbs: 2.7, fat: 0.6, fiber: 1.6, sodium: 4 },
  'cilantro': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8, sodium: 46 },
  'parsley': { calories: 36, protein: 3, carbs: 6.3, fat: 0.8, fiber: 3.3, sodium: 56 }
};

/**
 * Estimate weight in grams from quantity and unit
 */
function estimateGrams(quantity, unit) {
  if (!quantity) return 100; // Default to 100g serving
  
  const unitLower = (unit || '').toLowerCase();
  
  // Weight units - convert directly
  if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams') {
    return quantity;
  }
  if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
    return quantity * 1000;
  }
  if (unitLower === 'oz' || unitLower === 'ounce' || unitLower === 'ounces') {
    return quantity * 28.35;
  }
  if (unitLower === 'lb' || unitLower === 'lbs' || unitLower === 'pound' || unitLower === 'pounds') {
    return quantity * 453.6;
  }
  
  // Volume units - rough conversions for common ingredients
  if (unitLower === 'cup' || unitLower === 'cups' || unitLower === 'c') {
    return quantity * 150; // Average ~150g per cup
  }
  if (unitLower === 'tbsp' || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
    return quantity * 15;
  }
  if (unitLower === 'tsp' || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
    return quantity * 5;
  }
  if (unitLower === 'ml' || unitLower === 'milliliter' || unitLower === 'milliliters') {
    return quantity; // Assuming water-like density
  }
  if (unitLower === 'l' || unitLower === 'liter' || unitLower === 'liters') {
    return quantity * 1000;
  }
  
  // Count units - rough estimates
  if (unitLower === 'clove' || unitLower === 'cloves') {
    return quantity * 3; // ~3g per clove
  }
  if (unitLower === 'large' || unitLower === 'medium' || unitLower === 'small') {
    return quantity * 150; // Average for produce
  }
  if (unitLower === 'piece' || unitLower === 'pieces' || unitLower === 'whole') {
    return quantity * 100; // Default
  }
  if (unitLower === 'can' || unitLower === 'cans') {
    return quantity * 400; // ~400g per can
  }
  if (unitLower === 'pinch') {
    return quantity * 0.5;
  }
  if (unitLower === 'dash') {
    return quantity * 1;
  }
  
  // Default - assume the quantity is roughly the serving
  return quantity * 100;
}

/**
 * Get nutrition data for an ingredient
 * First checks stored data, then falls back to defaults
 */
async function getIngredientNutrition(ingredientName) {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Try to find in database first
  const ingredient = await findIngredientByName(ingredientName);
  if (ingredient && ingredient.nutrition) {
    return {
      ...ingredient.nutrition,
      source: 'database'
    };
  }
  
  // Check default nutrition data
  if (DEFAULT_NUTRITION[normalizedName]) {
    return {
      ...DEFAULT_NUTRITION[normalizedName],
      source: 'default'
    };
  }
  
  // Try partial matches
  for (const [key, nutrition] of Object.entries(DEFAULT_NUTRITION)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return {
        ...nutrition,
        source: 'default',
        matchedKey: key
      };
    }
  }
  
  return null;
}

/**
 * Calculate nutrition for a full recipe
 * @param {Object} recipe - Recipe object with ingredients array
 * @returns {Object} - Total and per-serving nutrition
 */
async function calculateRecipeNutrition(recipe) {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return {
      success: false,
      error: 'No ingredients found'
    };
  }
  
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  };
  
  const breakdown = [];
  let ingredientsWithData = 0;
  let ingredientsWithoutData = 0;
  
  for (const ingredientStr of recipe.ingredients) {
    const parsed = parseIngredientString(ingredientStr);
    const nutrition = await getIngredientNutrition(parsed.name);
    
    if (nutrition) {
      // Estimate the weight in grams
      const grams = estimateGrams(parsed.quantity, parsed.unit);
      const factor = grams / 100; // Nutrition is per 100g
      
      const ingredientNutrition = {
        ingredient: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        estimatedGrams: Math.round(grams),
        calories: Math.round(nutrition.calories * factor),
        protein: Math.round(nutrition.protein * factor * 10) / 10,
        carbs: Math.round(nutrition.carbs * factor * 10) / 10,
        fat: Math.round(nutrition.fat * factor * 10) / 10,
        fiber: Math.round(nutrition.fiber * factor * 10) / 10,
        sodium: Math.round(nutrition.sodium * factor),
        source: nutrition.source
      };
      
      breakdown.push(ingredientNutrition);
      
      totals.calories += ingredientNutrition.calories;
      totals.protein += ingredientNutrition.protein;
      totals.carbs += ingredientNutrition.carbs;
      totals.fat += ingredientNutrition.fat;
      totals.fiber += ingredientNutrition.fiber;
      totals.sodium += ingredientNutrition.sodium;
      
      ingredientsWithData++;
    } else {
      breakdown.push({
        ingredient: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        estimatedGrams: null,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sodium: null,
        source: 'unknown'
      });
      ingredientsWithoutData++;
    }
  }
  
  // Round totals
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round(totals.fiber * 10) / 10;
  
  // Calculate per-serving if servings specified
  let perServing = null;
  const servingsNum = parseServingsValue(recipe.servings);
  
  if (servingsNum && servingsNum > 0) {
    perServing = {
      calories: Math.round(totals.calories / servingsNum),
      protein: Math.round((totals.protein / servingsNum) * 10) / 10,
      carbs: Math.round((totals.carbs / servingsNum) * 10) / 10,
      fat: Math.round((totals.fat / servingsNum) * 10) / 10,
      fiber: Math.round((totals.fiber / servingsNum) * 10) / 10,
      sodium: Math.round(totals.sodium / servingsNum)
    };
  }
  
  return {
    success: true,
    total: totals,
    perServing,
    servings: servingsNum,
    breakdown,
    ingredientsWithData,
    ingredientsWithoutData,
    isPartial: ingredientsWithoutData > 0,
    coverage: Math.round((ingredientsWithData / recipe.ingredients.length) * 100)
  };
}

/**
 * Parse servings value from various formats
 */
function parseServingsValue(servingsStr) {
  if (!servingsStr) return null;
  if (typeof servingsStr === 'number') return servingsStr;
  
  const str = servingsStr.toString().toLowerCase();
  const match = str.match(/(\d+)/);
  
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

// =====================
// Smart Expiration Date Defaults
// =====================

/**
 * Get default expiration date based on ingredient name, category, and location
 * @param {string} ingredientName - Name of the ingredient
 * @param {string} category - Category of the ingredient (optional, will auto-detect)
 * @param {string} location - Storage location: 'pantry', 'refrigerator', or 'freezer'
 * @returns {Object} - { date: ISO date string, days: number, hint: string }
 */
function getDefaultExpirationDate(ingredientName, category = null, location = 'pantry') {
  const normalizedName = (ingredientName || '').toLowerCase().trim();
  const normalizedLocation = (location || 'pantry').toLowerCase();
  
  // First, check for specific ingredient overrides
  for (const [key, shelfLife] of Object.entries(INGREDIENT_SHELF_LIFE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      const days = shelfLife[normalizedLocation];
      if (days !== undefined) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return {
          date: date.toISOString().split('T')[0],
          days,
          hint: `${ingredientName} typically lasts ${days} days in ${normalizedLocation}`,
          matchedIngredient: key
        };
      }
    }
  }
  
  // Detect category if not provided
  const detectedCategory = category || detectCategory(ingredientName);
  
  // Get default from category
  const categoryDefaults = SHELF_LIFE_DEFAULTS[detectedCategory] || SHELF_LIFE_DEFAULTS.other;
  const locationDefault = categoryDefaults[normalizedLocation] || categoryDefaults.pantry;
  
  const date = new Date();
  date.setDate(date.getDate() + locationDefault.days);
  
  return {
    date: date.toISOString().split('T')[0],
    days: locationDefault.days,
    hint: locationDefault.hint,
    category: detectedCategory,
    location: normalizedLocation
  };
}

/**
 * Get shelf life info for a category and location
 * @param {string} category - Ingredient category
 * @param {string} location - Storage location
 * @returns {Object} - { days, hint }
 */
function getShelfLifeInfo(category, location) {
  const categoryDefaults = SHELF_LIFE_DEFAULTS[category] || SHELF_LIFE_DEFAULTS.other;
  const locationDefault = categoryDefaults[location] || categoryDefaults.pantry;
  
  return {
    days: locationDefault.days,
    hint: locationDefault.hint,
    category,
    location
  };
}

// =====================
// Price History Functions
// =====================

/**
 * Get full price history with statistics for an ingredient
 * @param {string} ingredientId - ID of the ingredient
 * @returns {Object} - Price history with stats
 */
async function getPriceHistory(ingredientId) {
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new Error(`Ingredient not found: ${ingredientId}`);
  }
  
  const priceHistory = ingredient.priceHistory || [];
  
  if (priceHistory.length === 0) {
    return {
      ingredient: ingredient.name,
      ingredientId,
      history: [],
      stats: null,
      trend: 'unknown'
    };
  }
  
  // Sort by date (newest first)
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Calculate stats
  const pricesPerUnit = priceHistory.map(p => p.price / (p.quantity || 1));
  const totalPrice = pricesPerUnit.reduce((sum, p) => sum + p, 0);
  const avgPrice = totalPrice / pricesPerUnit.length;
  const minPrice = Math.min(...pricesPerUnit);
  const maxPrice = Math.max(...pricesPerUnit);
  
  // Calculate trend (compare recent 3 to earlier prices)
  let trend = 'stable';
  if (priceHistory.length >= 3) {
    const recent = sortedHistory.slice(0, Math.min(3, Math.floor(sortedHistory.length / 2)));
    const earlier = sortedHistory.slice(-Math.min(3, Math.floor(sortedHistory.length / 2)));
    
    const recentAvg = recent.reduce((sum, p) => sum + (p.price / (p.quantity || 1)), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, p) => sum + (p.price / (p.quantity || 1)), 0) / earlier.length;
    
    const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';
  }
  
  // Group by store
  const byStore = {};
  for (const record of priceHistory) {
    const store = record.store || 'Unknown';
    if (!byStore[store]) {
      byStore[store] = { count: 0, total: 0, min: Infinity, max: -Infinity };
    }
    const unitPrice = record.price / (record.quantity || 1);
    byStore[store].count++;
    byStore[store].total += unitPrice;
    byStore[store].min = Math.min(byStore[store].min, unitPrice);
    byStore[store].max = Math.max(byStore[store].max, unitPrice);
  }
  
  // Calculate store averages
  const storeStats = Object.entries(byStore).map(([store, data]) => ({
    store,
    count: data.count,
    avgPrice: Math.round((data.total / data.count) * 100) / 100,
    minPrice: Math.round(data.min * 100) / 100,
    maxPrice: Math.round(data.max * 100) / 100
  })).sort((a, b) => a.avgPrice - b.avgPrice);
  
  return {
    ingredient: ingredient.name,
    ingredientId,
    history: sortedHistory.map(p => ({
      ...p,
      pricePerUnit: Math.round((p.price / (p.quantity || 1)) * 100) / 100
    })),
    stats: {
      count: priceHistory.length,
      avgPrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      priceRange: Math.round((maxPrice - minPrice) * 100) / 100
    },
    trend,
    trendIcon: trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️',
    byStore: storeStats,
    bestStore: storeStats.length > 0 ? storeStats[0].store : null
  };
}

/**
 * Get price history by ingredient name
 * @param {string} ingredientName - Name of the ingredient
 * @returns {Object} - Price history with stats
 */
async function getPriceHistoryByName(ingredientName) {
  const ingredient = await findIngredientByName(ingredientName);
  if (!ingredient) {
    return {
      ingredient: ingredientName,
      ingredientId: null,
      history: [],
      stats: null,
      trend: 'unknown'
    };
  }
  return getPriceHistory(ingredient.id);
}

// =====================
// Shopping Frequency Insights
// =====================

/**
 * Calculate shopping frequency insights based on pantry history
 * @returns {Object} - Shopping patterns and predictions
 */
async function getShoppingFrequencyInsights() {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const frequencyData = pantryCache.frequencyData || {};
  const items = pantryCache.items || [];
  
  // Analyze purchase frequency
  const frequentItems = Object.entries(frequencyData)
    .filter(([_, data]) => data.count >= 2 && data.lastAdded)
    .map(([name, data]) => {
      // Calculate average days between purchases
      const firstAdded = data.firstAdded || data.lastAdded;
      const lastAdded = data.lastAdded;
      const daysSinceFirst = Math.max(1, Math.floor(
        (new Date(lastAdded) - new Date(firstAdded)) / (1000 * 60 * 60 * 24)
      ));
      const avgDaysBetween = data.count > 1 ? Math.round(daysSinceFirst / (data.count - 1)) : null;
      
      // Calculate days since last purchase
      const daysSinceLast = Math.floor(
        (new Date() - new Date(lastAdded)) / (1000 * 60 * 60 * 24)
      );
      
      // Check if due for restock
      const dueForRestock = avgDaysBetween && daysSinceLast >= avgDaysBetween * 0.8;
      
      return {
        ingredientName: data.displayName || name,
        purchaseCount: data.count,
        avgDaysBetween,
        daysSinceLast,
        lastUnit: data.lastUnit,
        lastLocation: data.lastLocation,
        dueForRestock,
        restockUrgency: avgDaysBetween ? Math.min(100, Math.round((daysSinceLast / avgDaysBetween) * 100)) : null
      };
    })
    .sort((a, b) => (b.restockUrgency || 0) - (a.restockUrgency || 0));
  
  // Find items running low (in pantry but low quantity)
  const runningLow = items.filter(item => {
    const qty = item.quantity || 1;
    return qty <= 1 && qty > 0;
  }).map(item => ({
    ingredientName: item.ingredientName,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    expirationDate: item.expirationDate
  }));
  
  // Find frequently bought items that need restocking
  const restockSuggestions = frequentItems
    .filter(item => item.dueForRestock)
    .slice(0, 10);
  
  // Shopping frequency by ingredient
  const topBuyers = frequentItems
    .filter(item => item.avgDaysBetween)
    .slice(0, 10)
    .map(item => ({
      ingredientName: item.ingredientName,
      frequency: item.avgDaysBetween <= 7 ? 'weekly' :
                 item.avgDaysBetween <= 14 ? 'biweekly' :
                 item.avgDaysBetween <= 30 ? 'monthly' : 'occasionally',
      avgDays: item.avgDaysBetween,
      hint: `You buy ${item.ingredientName} every ~${item.avgDaysBetween} days`
    }));
  
  return {
    frequentItems: frequentItems.slice(0, 20),
    runningLow,
    restockSuggestions,
    topBuyers,
    totalUniqueItems: Object.keys(frequencyData).length,
    totalPurchases: Object.values(frequencyData).reduce((sum, d) => sum + d.count, 0)
  };
}

/**
 * Update frequency tracking with first added date
 * Called when adding items to track purchase intervals
 */
async function updateFrequencyTracking(ingredientName) {
  if (!pantryCache) {
    await initPantryDB();
  }
  
  const normalizedName = ingredientName.toLowerCase();
  const now = new Date().toISOString();
  
  if (!pantryCache.frequencyData) {
    pantryCache.frequencyData = {};
  }
  
  if (!pantryCache.frequencyData[normalizedName]) {
    pantryCache.frequencyData[normalizedName] = {
      count: 0,
      firstAdded: now,
      lastAdded: now,
      displayName: ingredientName
    };
  }
  
  // Ensure firstAdded exists
  if (!pantryCache.frequencyData[normalizedName].firstAdded) {
    pantryCache.frequencyData[normalizedName].firstAdded = now;
  }
  
  await savePantryDB();
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
  SUBSTITUTIONS,
  SHELF_LIFE_DEFAULTS,
  INGREDIENT_SHELF_LIFE,
  
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
  bulkAddToPantry,
  updatePantryItem,
  removeFromPantry,
  getPantryItemsByIngredient,
  isInPantry,
  getExpiringItems,
  getExpiredItems,
  getFrequentlyAddedItems,
  getRecentlyAddedItems,
  
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
  estimateRecipeCost,
  getPriceHistory,
  getPriceHistoryByName,
  
  // Shelf life & expiration
  getDefaultExpirationDate,
  getShelfLifeInfo,
  
  // Shopping frequency insights
  getShoppingFrequencyInsights,
  updateFrequencyTracking,
  
  // Substitutions
  getSubstitutes,
  getAllSubstitutions,
  getAvailableSubstitutes,
  
  // Nutrition
  getIngredientNutrition,
  calculateRecipeNutrition,
  DEFAULT_NUTRITION
};
