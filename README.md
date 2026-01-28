# 🍳 Recipe Keeper

A personal recipe management web app for storing, organizing, and cooking from your digital recipe collection. Built for home cooks who want full control of their recipes with pantry tracking, smart shopping lists, and meal planning features.

## Features

### Core Functionality
- **Import Recipes** - Paste a URL to automatically extract recipe data from websites
- **Manual Entry** - Add recipes by hand for cookbooks, family recipes, etc.
- **Edit Recipes** - Modify any recipe after saving
- **Shopping Lists** - Create shopping lists from recipe ingredients

### Organization
- **Search & Filter** - Find recipes by name, ingredient, or tag
- **Favorites** - Star your go-to recipes for quick access
- **Tags** - Organize with tags, filter by tag, manage tags across recipes
- **Collections** - Create custom collections (e.g., "Weeknight Dinners", "Holiday Recipes")

### Cooking Experience
- **Cook Mode** - Full-screen, step-by-step instructions with large text for kitchen use
  - Dark theme for visibility
  - Swipe or keyboard navigation
  - Collapsible ingredient sidebar
- **Recipe Scaling** - Adjust servings and ingredient quantities automatically scale
  - Handles fractions, mixed numbers, ranges
  - Smart unit conversion
- **Print View** - Clean, printer-friendly recipe format
- **Notes & Ratings** - Add personal notes and 1-5 star ratings

### Pantry Management (v1.2.0+)
- **Ingredient Database** - Structured ingredients with categories, allergens, dietary flags
- **Pantry Tracking** - Track what's in stock with quantities and locations
- **Expiration Alerts** - Get notified when items are expiring soon
- **"What Can I Make?"** - Recipe suggestions based on your pantry contents

### Barcode Scanning (v1.3.0+)
- **Camera Scanning** - Scan grocery barcodes directly into pantry
- **Open Food Facts Integration** - Auto-fills product info from 3M+ products
- **Quick Add** - Frequently bought items, recent items, common staples
- **Bulk Import** - Paste a list or upload CSV to add multiple items

### Smart Features (v1.3.0+)
- **Nutrition Tracking** - See nutritional info for recipes
- **Ingredient Substitutions** - 50+ substitution rules when you're missing something
- **Price Tracking** - Track prices, see trends, estimate recipe costs
- **Shopping Insights** - Purchase frequency and "time to restock" predictions

### Unified Ingredients (v1.4.0+)
- **Linked Ingredients** - Recipe ingredients link to your ingredient database
- **Auto-Matching** - Scraped recipes automatically match to known ingredients
- **Enriched Display** - See allergens, dietary badges, substitutes on recipe pages
- **Migration Tools** - Convert old recipes to new format

### Open Food Facts Contribution (v1.5.0)
- **Give Back** - Contribute new products to the open food database
- **Add Missing Products** - When a barcode scan finds nothing, add the product
- **Share Data** - Help build the world's largest open food database

### Quality of Life
- **Dark Mode** - System-wide dark theme with toggle
- **Mobile Responsive** - Works on phones and tablets
- **Toast Notifications** - Non-blocking feedback
- **Recently Viewed** - Quick access to recent recipes
- **Keyboard Shortcuts** - Press `?` to see all shortcuts
- **Duplicate Detection** - Warning when importing similar recipes
- **Image Upload** - Upload photos directly

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Plain HTML, CSS, JavaScript (no build step)
- **Data Storage**: Markdown files (recipes) + JSON files (lists, collections, ingredients)
- **External APIs**: Open Food Facts (barcode lookup and contribution)

## Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/jdshupe/recipe-keeper.git
cd recipe-keeper

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

### Production Deployment (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name recipe-keeper

# Save for auto-restart
pm2 save
pm2 startup
```

### Development

```bash
# Run with auto-reload
npm run dev
```

## Project Structure

```
recipe-keeper/
├── server.js              # Express server entry point
├── lib/
│   ├── config.js          # Shared configuration (paths)
│   ├── utils.js           # Shared utilities
│   ├── recipes.js         # Recipe CRUD operations
│   ├── scraper.js         # URL recipe extraction
│   ├── shopping-lists.js  # Shopping list logic
│   ├── collections.js     # Collection management
│   └── ingredients.js     # Ingredient & pantry management
├── routes/
│   ├── recipes.js         # /api/recipes endpoints
│   ├── scrape.js          # /api/scrape endpoint
│   ├── shopping-lists.js  # /api/shopping-lists endpoints
│   ├── collections.js     # /api/collections endpoints
│   ├── ingredients.js     # /api/ingredients endpoints
│   └── upload.js          # /api/upload endpoints
├── scripts/
│   └── migrate-ingredients.js  # Migration tool
├── public/
│   ├── index.html         # Home page
│   ├── recipes.html       # Recipe list
│   ├── recipe.html        # Recipe detail
│   ├── add-recipe.html    # Manual recipe entry
│   ├── edit-recipe.html   # Edit existing recipe
│   ├── cook-mode.html     # Step-by-step cooking view
│   ├── tags.html          # Tag management
│   ├── collections.html   # Collection list
│   ├── collection.html    # Collection detail
│   ├── pantry.html        # Pantry management
│   ├── what-can-i-make.html  # Recipe suggestions
│   ├── shopping-lists.html
│   ├── shopping-list.html
│   ├── shopping-list-new.html
│   ├── css/style.css      # All styles
│   └── js/app.js          # Shared client-side JavaScript
└── content/
    ├── recipes/           # Markdown recipe files
    ├── shopping-lists/    # JSON shopping list files
    ├── collections/       # JSON collection files
    └── ingredients.json   # Ingredient database
```

## Data Format

### Recipes (Markdown with YAML frontmatter)

```markdown
---
title: Chocolate Chip Cookies
description: Classic homemade cookies
prepTime: 15 mins
cookTime: 12 mins
servings: "24 cookies"
tags:
  - dessert
  - baking
source: https://example.com/recipe
image: https://example.com/image.jpg
favorite: true
rating: 5
personalNotes: "Double the chocolate chips!"
dateAdded: 2026-01-08T12:00:00.000Z
ingredients:
  - ingredientId: "uuid-or-null"
    originalText: "2 cups all-purpose flour"
    quantity: 2
    unit: "cups"
    name: "all-purpose flour"
    preparation: null
    matchConfidence: "exact"
---

## Instructions

1. Preheat oven to 375°F
2. Mix dry ingredients
3. Cream butter and sugar
4. Combine and fold in chocolate chips
5. Bake for 10-12 minutes
```

### Ingredients Database (JSON)

```json
{
  "id": "uuid",
  "name": "all-purpose flour",
  "category": "baking",
  "aliases": ["flour", "ap flour", "white flour"],
  "allergens": ["gluten"],
  "dietaryFlags": [],
  "nutrition": { "calories": 455, "protein": 13, ... },
  "pantry": {
    "inStock": true,
    "quantity": 5,
    "unit": "lb",
    "location": "pantry",
    "expirationDate": "2026-06-01"
  }
}
```

## API Reference

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recipes | List all recipes |
| GET | /api/recipes/:slug | Get single recipe |
| GET | /api/recipes/:slug/enriched | Get with ingredient details |
| GET | /api/recipes/:slug/nutrition | Calculate nutrition |
| POST | /api/recipes | Create recipe |
| PUT | /api/recipes/:slug | Update recipe |
| DELETE | /api/recipes/:slug | Delete recipe |
| PATCH | /api/recipes/:slug/favorite | Toggle favorite |
| PATCH | /api/recipes/:slug/rating | Set rating |
| POST | /api/recipes/:slug/migrate-ingredients | Convert to structured |

### Ingredients & Pantry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ingredients | List all ingredients |
| GET | /api/ingredients/:id | Get single ingredient |
| POST | /api/ingredients | Create ingredient |
| PUT | /api/ingredients/:id | Update ingredient |
| GET | /api/ingredients/pantry | Get pantry items |
| POST | /api/ingredients/pantry/bulk | Bulk add to pantry |
| GET | /api/ingredients/barcode/:code | Open Food Facts lookup |
| POST | /api/ingredients/off-contribute | Contribute to OFF |

### Shopping Lists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/shopping-lists | List all lists |
| GET | /api/shopping-lists/:id | Get list |
| POST | /api/shopping-lists | Create list |
| PUT | /api/shopping-lists/:id | Update list |
| DELETE | /api/shopping-lists/:id | Delete list |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/collections | List all collections |
| GET | /api/collections/:id | Get collection |
| POST | /api/collections | Create collection |
| PUT | /api/collections/:id | Update collection |
| DELETE | /api/collections/:id | Delete collection |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ? | Show shortcuts help |
| H | Go to Home |
| R | Go to Recipes |
| C | Go to Collections |
| S | Go to Shopping Lists |
| P | Go to Pantry |
| W | Go to What Can I Make? |
| A | Add new recipe |
| / | Focus search box |

### Cook Mode
| Key | Action |
|-----|--------|
| → or Space | Next step |
| ← | Previous step |
| Escape | Exit cook mode |
| i | Toggle ingredients |

## Browser Support

- Chrome, Firefox, Safari, Edge (modern versions)
- Mobile browsers with touch/swipe support

## License

MIT License - feel free to use, modify, and share.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### v1.5.0 (2026-01-27)
- Open Food Facts contribution support
- Improved API timeout handling
- Bug fixes for tag handling

### v1.4.0 (2026-01-26)
- Unified ingredient database across all features
- Ingredient picker with visual matching
- Auto-matching on recipe import
- Enriched recipe display with allergens/dietary badges

### v1.3.0 (2026-01-26)
- Barcode scanning with Open Food Facts
- Quick add features (frequent, recent, staples)
- Bulk import (paste list or CSV)
- Nutrition tracking and recipe cost estimation
- Ingredient substitutions
- Price tracking and shopping insights

### v1.2.0 (2026-01-26)
- Mobile responsive design
- Ingredient database and pantry management
- "What Can I Make?" suggestions

### v1.1.0 (2026-01-26)
- Dark mode
- Toast notifications
- Recently viewed recipes
- Keyboard shortcuts
- Image upload

### v1.0.0 (2026-01-08)
- Initial release
