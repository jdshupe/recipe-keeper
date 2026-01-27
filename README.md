# 🍳 Recipe Keeper

A personal recipe management web app for storing, organizing, and cooking from your digital recipe collection.

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

### Shopping Lists
- **Combine Duplicates** - Same ingredients from multiple recipes are combined
- **Category Sorting** - Items grouped by store aisle (Produce, Dairy, Meat, etc.)
- **Custom Items** - Add non-recipe items like paper towels
- **Progress Tracking** - Check off items as you shop
- **Quick Add** - 🛒 button on recipe cards for one-click ingredient adding

### Quality of Life (v1.1.0)
- **Dark Mode** - System-wide dark theme with toggle, respects system preference
- **Toast Notifications** - Non-blocking success/error feedback
- **Recently Viewed** - Last 5 viewed recipes shown on home page
- **Keyboard Shortcuts** - Press `?` to see all navigation shortcuts
- **Duplicate Detection** - Warning when importing similar recipes
- **Image Upload** - Upload photos directly instead of only URLs
- **Improved Home Page** - Stats, suggestions, and quick actions

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Plain HTML, CSS, JavaScript (no build step)
- **Data Storage**: Markdown files (recipes) + JSON files (lists, collections)
- **Dependencies**: gray-matter, marked, open-graph-scraper, uuid

## Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

```bash
# Clone or download the repository
cd recipe-keeper

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

### Development

```bash
# Run with auto-reload (requires nodemon)
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
│   └── collections.js     # Collection management
├── routes/
│   ├── recipes.js         # /api/recipes endpoints
│   ├── scrape.js          # /api/scrape endpoint
│   ├── shopping-lists.js  # /api/shopping-lists endpoints
│   └── collections.js     # /api/collections endpoints
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
│   ├── shopping-lists.html
│   ├── shopping-list.html
│   ├── shopping-list-new.html
│   ├── css/style.css      # All styles
│   └── js/app.js          # All client-side JavaScript
└── content/
    ├── recipes/           # Markdown recipe files
    ├── shopping-lists/    # JSON shopping list files
    └── collections/       # JSON collection files
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
notes: "Double the chocolate chips!"
dateAdded: 2026-01-08T12:00:00.000Z
---

## Ingredients

- 2 cups all-purpose flour
- 1 cup butter, softened
- 1 cup chocolate chips

## Instructions

1. Preheat oven to 375°F
2. Mix dry ingredients
3. Cream butter and sugar
4. Combine and fold in chocolate chips
5. Bake for 10-12 minutes
```

### Shopping Lists (JSON)

```json
{
  "id": "uuid",
  "name": "Weekly Groceries",
  "items": [
    {
      "id": "uuid",
      "name": "2 cups flour",
      "recipeTitle": "Chocolate Chip Cookies",
      "checked": false
    }
  ],
  "createdAt": "2026-01-08T12:00:00.000Z",
  "updatedAt": "2026-01-08T12:00:00.000Z"
}
```

### Collections (JSON)

```json
{
  "id": "uuid",
  "name": "Weeknight Dinners",
  "description": "Quick meals for busy nights",
  "recipeSlugs": ["one-pan-chicken", "pasta-primavera"],
  "createdAt": "2026-01-08T12:00:00.000Z",
  "updatedAt": "2026-01-08T12:00:00.000Z"
}
```

## API Reference

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recipes | List all recipes |
| GET | /api/recipes/:slug | Get single recipe |
| POST | /api/recipes | Create recipe |
| PUT | /api/recipes/:slug | Update recipe |
| DELETE | /api/recipes/:slug | Delete recipe |
| PATCH | /api/recipes/:slug/favorite | Toggle favorite |
| PATCH | /api/recipes/:slug/rating | Set rating |
| PATCH | /api/recipes/:slug/notes | Update notes |
| GET | /api/tags | List all tags with counts |
| PUT | /api/tags/:tag/rename | Rename tag |
| DELETE | /api/tags/:tag | Delete tag |

### Scraping
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/scrape | Extract recipe from URL |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload | Upload recipe image (multipart/form-data) |
| DELETE | /api/upload/:filename | Delete uploaded image |

### Shopping Lists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/shopping-lists | List all lists |
| GET | /api/shopping-lists/:id | Get list (processed) |
| GET | /api/shopping-lists/:id/raw | Get list (raw) |
| POST | /api/shopping-lists | Create list |
| PUT | /api/shopping-lists/:id | Update list |
| DELETE | /api/shopping-lists/:id | Delete list |
| POST | /api/shopping-lists/:id/custom-item | Add custom item |
| DELETE | /api/shopping-lists/:id/item/:itemId | Delete item |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/collections | List all collections |
| GET | /api/collections/:id | Get collection with recipes |
| POST | /api/collections | Create collection |
| PUT | /api/collections/:id | Update collection |
| DELETE | /api/collections/:id | Delete collection |
| POST | /api/collections/:id/recipes | Add recipe to collection |
| DELETE | /api/collections/:id/recipes/:slug | Remove recipe |

## Keyboard Shortcuts

### Global Navigation
| Key | Action |
|-----|--------|
| ? | Show shortcuts help |
| H | Go to Home |
| R | Go to Recipes |
| C | Go to Collections |
| S | Go to Shopping Lists |
| A | Add new recipe |
| / | Focus search box |

### Cook Mode
| Key | Action |
|-----|--------|
| → or Space | Next step |
| ← | Previous step |
| Escape | Exit cook mode |
| i | Toggle ingredients sidebar |

## Browser Support

- Chrome, Firefox, Safari, Edge (modern versions)
- Mobile browsers supported (touch/swipe in cook mode)

## License

MIT License - feel free to use, modify, and share.

## Version History

### v1.1.0 (2026-01-26)
- Dark mode with system preference detection
- Toast notifications replacing alerts
- Recently viewed recipes on home page
- Quick add to shopping list from recipe cards
- Global keyboard shortcuts
- Duplicate recipe detection on import/add
- Recipe image upload (drag & drop)
- Improved home page with stats and suggestions

### v1.0.0 (2026-01-08)
- Initial release with all Phase 1-4 features
- Search, favorites, print view
- Manual entry, edit, notes/ratings
- Cook mode, recipe scaling
- Shopping lists with smart combining
- Collections and tag management
