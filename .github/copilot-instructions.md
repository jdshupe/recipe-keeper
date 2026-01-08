# Recipe Keeper - Project Instructions

## Overview
Recipe Keeper is a simple web app for storing and managing digital recipes. It allows users to:
1. Import recipes from URLs by scraping structured data
2. View and browse saved recipes  
3. Create shopping lists from recipe ingredients

## Technology Stack
- **Backend**: Express.js 4.18 (Node.js)
- **Frontend**: Plain HTML, CSS, and vanilla JavaScript (no build step)
- **Data Storage**: Markdown files with YAML frontmatter for recipes, JSON files for shopping lists
- **Libraries**: 
  - `gray-matter` - Parse markdown frontmatter
  - `marked` - Render markdown (if needed)
  - `open-graph-scraper` - Fetch recipe data from URLs
  - `uuid` - Generate unique IDs

## Project Structure
```
recipe-keeper/
├── server.js              # Express server entry point
├── package.json           # Dependencies and scripts
├── lib/
│   ├── config.js          # Shared configuration (paths)
│   ├── utils.js           # Shared utilities (ensureDir)
│   ├── recipes.js         # Recipe CRUD operations
│   ├── shopping-lists.js  # Shopping list CRUD operations
│   └── scraper.js         # URL recipe scraper
├── routes/
│   ├── recipes.js         # /api/recipes endpoints
│   ├── shopping-lists.js  # /api/shopping-lists endpoints
│   └── scrape.js          # /api/scrape endpoint
├── public/
│   ├── index.html         # Home page
│   ├── recipes.html       # All recipes list
│   ├── recipe.html        # Recipe detail view
│   ├── shopping-lists.html      # Shopping lists overview
│   ├── shopping-list.html       # Shopping list detail
│   ├── shopping-list-new.html   # Create new list form
│   ├── css/style.css      # Stylesheet
│   └── js/app.js          # Client-side JavaScript
└── content/
    ├── recipes/           # Markdown recipe files
    └── shopping-lists/    # JSON shopping list files
```

## API Endpoints

### Recipes
- `GET /api/recipes` - List all recipes
- `GET /api/recipes/:slug` - Get single recipe
- `PUT /api/recipes/:slug` - Update recipe
- `DELETE /api/recipes/:slug` - Delete recipe

### Shopping Lists
- `GET /api/shopping-lists` - List all shopping lists
- `POST /api/shopping-lists` - Create new list
- `GET /api/shopping-lists/:id` - Get single list
- `PUT /api/shopping-lists/:id` - Update list
- `DELETE /api/shopping-lists/:id` - Delete list
- `POST /api/shopping-lists/:id/add-recipe` - Add recipe ingredients to list

### Scraping
- `POST /api/scrape` - Import recipe from URL

## Recipe Format
Recipes are stored as markdown files with YAML frontmatter:
```yaml
---
title: Recipe Title
description: Brief description
image: https://example.com/image.jpg
prepTime: 15 mins
cookTime: 30 mins
totalTime: 45 mins
servings: "4 servings"
tags:
  - dinner
  - chicken
source: https://original-url.com
ingredients:
  - 1 cup flour
  - 2 eggs
instructions:
  - Step one
  - Step two
notes: Optional notes
---
```

## Running the App
```bash
npm install
npm run dev    # Development with auto-reload
npm start      # Production
```

The app runs at http://localhost:3000

## Development Notes
- No build step required - edit HTML/CSS/JS directly
- Recipes auto-slug from title (lowercase, hyphens)
- Shopping list items track which recipe they came from
- Recipe scraper uses Schema.org JSON-LD data when available
