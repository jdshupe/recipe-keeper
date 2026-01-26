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
│   ├── recipes.js         # Recipe CRUD + duplicate detection
│   ├── shopping-lists.js  # Shopping list CRUD operations
│   ├── collections.js     # Collection CRUD operations
│   └── scraper.js         # URL recipe scraper
├── routes/
│   ├── recipes.js         # /api/recipes endpoints
│   ├── shopping-lists.js  # /api/shopping-lists endpoints
│   ├── collections.js     # /api/collections endpoints
│   ├── scrape.js          # /api/scrape endpoint
│   └── upload.js          # /api/upload - image upload (multer)
├── public/
│   ├── index.html         # Home page (stats, recently viewed, suggestions)
│   ├── recipes.html       # All recipes list
│   ├── recipe.html        # Recipe detail view
│   ├── add-recipe.html    # Manual recipe entry
│   ├── edit-recipe.html   # Edit existing recipe
│   ├── cook-mode.html     # Step-by-step cooking view
│   ├── tags.html          # Tag management
│   ├── collections.html   # Collection list
│   ├── collection.html    # Collection detail
│   ├── shopping-lists.html      # Shopping lists overview
│   ├── shopping-list.html       # Shopping list detail
│   ├── shopping-list-new.html   # Create new list form
│   ├── css/style.css      # Stylesheet (~3100 lines, CSS variables for theming)
│   └── js/app.js          # Client-side JavaScript (~3000 lines)
└── content/
    ├── recipes/           # Markdown recipe files
    ├── shopping-lists/    # JSON shopping list files
    └── collections/       # JSON collection files
```

## API Endpoints

### Recipes
- `GET /api/recipes` - List all recipes
- `GET /api/recipes/:slug` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:slug` - Update recipe
- `DELETE /api/recipes/:slug` - Delete recipe
- `PATCH /api/recipes/:slug/favorite` - Toggle favorite
- `PATCH /api/recipes/:slug/rating` - Set rating (1-5)
- `PATCH /api/recipes/:slug/notes` - Update notes
- `POST /api/recipes/check-duplicates` - Check for similar recipes (body: {title, sourceUrl})

### Tags
- `GET /api/tags` - List all tags with counts
- `PUT /api/tags/:tag/rename` - Rename tag across all recipes
- `DELETE /api/tags/:tag` - Delete tag from all recipes

### Shopping Lists
- `GET /api/shopping-lists` - List all shopping lists
- `POST /api/shopping-lists` - Create new list
- `GET /api/shopping-lists/:id` - Get single list (processed with categories)
- `GET /api/shopping-lists/:id/raw` - Get raw list data
- `PUT /api/shopping-lists/:id` - Update list
- `DELETE /api/shopping-lists/:id` - Delete list
- `POST /api/shopping-lists/:id/add-recipe` - Add recipe ingredients to list
- `POST /api/shopping-lists/:id/custom-item` - Add custom item
- `DELETE /api/shopping-lists/:id/item/:itemId` - Delete item

### Collections
- `GET /api/collections` - List all collections
- `GET /api/collections/:id` - Get collection with recipes
- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection
- `POST /api/collections/:id/recipes` - Add recipe to collection
- `DELETE /api/collections/:id/recipes/:slug` - Remove recipe
- `GET /api/collections/for-recipe/:slug` - Get collections containing recipe
- `PUT /api/collections/for-recipe/:slug` - Update recipe's collections

### Scraping
- `POST /api/scrape` - Import recipe from URL

### Upload
- `POST /api/upload` - Upload image (multipart/form-data, field: 'image')
- `DELETE /api/upload/:filename` - Delete uploaded image

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
npm run dev    # Development with auto-reload (--watch)
npm start      # Production
```

The app runs at http://localhost:3000

## Development Notes
- No build step required - edit HTML/CSS/JS directly
- Recipes auto-slug from title (lowercase, hyphens)
- Shopping list items track which recipe they came from
- Recipe scraper uses Schema.org JSON-LD data when available

## Key Features & Implementation Details

### Dark Mode
- CSS variables defined in `:root` and `.dark-mode` in style.css
- Toggle function `toggleDarkMode()` in app.js
- Preference stored in localStorage ('darkMode')
- Flash-prevention script in each HTML `<head>` applies class before render
- Respects `prefers-color-scheme: dark` system preference

### Toast Notifications
- `showToast(message, type)` function in app.js
- Types: 'success', 'error', 'info'
- Auto-dismiss after 3.5 seconds
- CSS in `.toast-container` and `.toast` classes

### Recently Viewed
- Stored in localStorage as JSON array of {slug, title, image, viewedAt}
- `trackRecentlyViewed(slug, title, image)` adds entries
- Limited to 5 most recent, deduplicated
- Displayed on home page with clear button

### Keyboard Shortcuts
- Global listener on `keydown` in app.js `setupKeyboardShortcuts()`
- Skips when input/textarea focused
- `?` opens help modal, `H/R/C/S/A` navigate, `/` focuses search

### Duplicate Detection
- `checkForDuplicates(title, sourceUrl)` in lib/recipes.js
- Checks exact URL match (100 score), exact title (95), similar title (fuzzy ~60-80)
- Import form checks before scraping, shows modal if matches found
- Manual add form shows inline warning on title blur

### Image Upload
- Multer middleware in routes/upload.js
- Stores files in `public/images/uploads/` with UUID filenames
- Accepts JPEG, PNG, GIF, WebP up to 5MB
- `setupImageUpload()` in app.js handles UI (tabs, drag/drop, preview)
- Hidden input stores final URL (uploaded path or external URL)

### Quick Add to Shopping List
- 🛒 button on recipe cards and detail page
- Dropdown shows existing lists + "Create New" option
- `setupQuickAddDropdowns()` in app.js
- Calls `POST /api/shopping-lists/:id/add-recipe`

### Recipe Scaling
- `scaleIngredients(ingredients, multiplier)` in app.js
- Parses fractions, mixed numbers, ranges
- Converts units intelligently (tsp→tbsp, cups, etc.)
- Displays Unicode fractions (½, ⅓, etc.)

### Cook Mode
- Full-screen step-by-step view at /cook-mode.html?slug=xxx
- Dark theme, large text for kitchen visibility
- Swipe gestures + keyboard navigation
- Collapsible ingredients sidebar

## Libraries (package.json)
- `express` ^4.18.2 - Web server
- `gray-matter` ^4.0.3 - Parse YAML frontmatter
- `marked` ^11.1.0 - Markdown rendering
- `open-graph-scraper` ^6.8.0 - Recipe URL extraction
- `uuid` ^9.0.0 - Generate unique IDs
- `multer` ^1.4.5-lts.1 - File upload handling
