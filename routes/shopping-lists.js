const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { 
  getAllLists, 
  getListById, 
  createList, 
  updateList, 
  deleteList,
  addCustomItem,
  processListItems,
  categorizeIngredient
} = require('../lib/shopping-lists');
const { getRecipeBySlug } = require('../lib/recipes');

// GET /api/shopping-lists - Get all lists
router.get('/', async (req, res) => {
  try {
    const lists = await getAllLists();
    res.json({ data: lists, success: true });
  } catch (err) {
    console.error('Error getting lists:', err);
    res.status(500).json({ error: 'Failed to get shopping lists', success: false });
  }
});

// POST /api/shopping-lists - Create new list
router.post('/', async (req, res) => {
  try {
    const { name, recipeSlugs } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required', success: false });
    }
    
    const items = [];
    if (recipeSlugs && recipeSlugs.length) {
      for (const slug of recipeSlugs) {
        const recipe = await getRecipeBySlug(slug);
        if (recipe && recipe.ingredients) {
          for (const ing of recipe.ingredients) {
            items.push({
              id: uuidv4(),
              name: typeof ing === 'string' ? ing : ing.item || String(ing),
              recipeTitle: recipe.title,
              recipeSlug: recipe.slug,
              checked: false
            });
          }
        }
      }
    }
    
    const list = await createList(name, items);
    res.json({ data: list, success: true });
  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Failed to create shopping list', success: false });
  }
});

// GET /api/shopping-lists/:id - Get single list (with processed/combined items)
router.get('/:id', async (req, res) => {
  try {
    const processed = await processListItems(req.params.id);
    if (!processed) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    res.json({ data: processed, success: true });
  } catch (err) {
    console.error('Error getting list:', err);
    res.status(500).json({ error: 'Failed to get shopping list', success: false });
  }
});

// GET /api/shopping-lists/:id/raw - Get raw list without processing
router.get('/:id/raw', async (req, res) => {
  try {
    const list = await getListById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    res.json({ data: list, success: true });
  } catch (err) {
    console.error('Error getting list:', err);
    res.status(500).json({ error: 'Failed to get shopping list', success: false });
  }
});

// PUT /api/shopping-lists/:id - Update list
// Supports multiple update modes:
//   - { items: [...] } - Replace entire items array
//   - { action: 'toggle', itemId: 'xxx' } - Toggle single item checked state
//   - { action: 'clearChecked' } - Remove all checked items
//   - { name: 'New Name' } - Rename list
router.put('/:id', async (req, res) => {
  try {
    const list = await getListById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    
    const { action, itemId, name, items } = req.body;
    
    if (items && Array.isArray(items)) {
      list.items = items;
    } else if (action === 'toggle' && itemId) {
      const item = list.items.find(i => i.id === itemId);
      if (item) item.checked = !item.checked;
    } else if (action === 'clearChecked') {
      list.items = list.items.filter(i => !i.checked);
    } else if (name) {
      list.name = name;
    }
    
    await updateList(list);
    
    // Return processed list
    const processed = await processListItems(list.id);
    res.json({ data: processed, success: true });
  } catch (err) {
    console.error('Error updating list:', err);
    res.status(500).json({ error: 'Failed to update shopping list', success: false });
  }
});

// POST /api/shopping-lists/:id/custom-item - Add custom item
router.post('/:id/custom-item', async (req, res) => {
  try {
    const { itemName } = req.body;
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ error: 'Item name is required', success: false });
    }
    
    const newItem = await addCustomItem(req.params.id, itemName);
    if (!newItem) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    
    // Return updated processed list
    const processed = await processListItems(req.params.id);
    res.json({ data: processed, success: true });
  } catch (err) {
    console.error('Error adding custom item:', err);
    res.status(500).json({ error: 'Failed to add custom item', success: false });
  }
});

// DELETE /api/shopping-lists/:id - Delete list
router.delete('/:id', async (req, res) => {
  try {
    await deleteList(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting list:', err);
    res.status(500).json({ error: 'Failed to delete shopping list', success: false });
  }
});

// POST /api/shopping-lists/:id/add-recipe - Add recipe to existing list
router.post('/:id/add-recipe', async (req, res) => {
  try {
    const { recipeSlug } = req.body;
    if (!recipeSlug) {
      return res.status(400).json({ error: 'recipeSlug required', success: false });
    }
    
    const list = await getListById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    
    const recipe = await getRecipeBySlug(recipeSlug);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', success: false });
    }
    
    for (const ing of recipe.ingredients || []) {
      const ingName = typeof ing === 'string' ? ing : ing.item || String(ing);
      list.items.push({
        id: uuidv4(),
        name: ingName,
        recipeTitle: recipe.title,
        recipeSlug: recipe.slug,
        checked: false,
        isCustom: false,
        category: categorizeIngredient(ingName)
      });
    }
    
    await updateList(list);
    
    // Return processed list
    const processed = await processListItems(list.id);
    res.json({ data: processed, success: true });
  } catch (err) {
    console.error('Error adding recipe to list:', err);
    res.status(500).json({ error: 'Failed to add recipe', success: false });
  }
});

// DELETE /api/shopping-lists/:id/item/:itemId - Remove a specific item
router.delete('/:id/item/:itemId', async (req, res) => {
  try {
    const list = await getListById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found', success: false });
    }
    
    list.items = list.items.filter(i => i.id !== req.params.itemId);
    await updateList(list);
    
    // Return processed list
    const processed = await processListItems(list.id);
    res.json({ data: processed, success: true });
  } catch (err) {
    console.error('Error removing item:', err);
    res.status(500).json({ error: 'Failed to remove item', success: false });
  }
});

module.exports = router;
