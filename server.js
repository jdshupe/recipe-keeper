const express = require('express');
const path = require('path');

const recipesRoutes = require('./routes/recipes');
const shoppingListRoutes = require('./routes/shopping-lists');
const scrapeRoutes = require('./routes/scrape');
const collectionsRoutes = require('./routes/collections');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/recipes', recipesRoutes);
app.use('/api/shopping-lists', shoppingListRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recipes.html'));
});

app.get('/recipes/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recipe.html'));
});

app.get('/shopping-lists', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shopping-lists.html'));
});

app.get('/collections', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'collections.html'));
});

app.get('/collection/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'collection.html'));
});

// Note: /new must come before /:id to avoid matching "new" as an id
app.get('/shopping-list/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shopping-list-new.html'));
});

app.get('/shopping-list/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shopping-list.html'));
});

app.listen(PORT, () => {
  console.log(`Recipe Keeper running at http://localhost:${PORT}`);
});
