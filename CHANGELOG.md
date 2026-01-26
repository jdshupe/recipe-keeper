# Changelog

All notable changes to Recipe Keeper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-26

### Added
- **Barcode Scanning**: Scan grocery items directly into pantry
  - Camera-based barcode scanning using html5-qrcode
  - Integration with Open Food Facts API (3M+ products)
  - Auto-fills ingredient name, category, nutrition, allergens
  - Manual barcode entry fallback
  - Supports EAN-13, EAN-8, UPC-A, UPC-E, CODE-128 formats
  
- **Quick Add Features**: Faster pantry management
  - Frequently Bought Items: One-click re-add items you buy often
  - Recently Added: Quick access to last 10 items
  - Common Staples: Pre-defined list of grocery essentials
  
- **Bulk Import**: Add multiple items at once
  - Paste a list (one item per line with optional quantity/unit)
  - CSV file upload with column mapping
  - Preview and edit before import
  
- **Nutrition Display**: See recipe nutritional information
  - Calculated from ingredient nutrition data
  - Per-serving and total recipe views
  - Shows partial data indicator when incomplete
  - 60+ common ingredients with nutrition data
  
- **Ingredient Substitutions**: Cooking flexibility
  - 50+ substitution rules (dairy, eggs, flour, oils, etc.)
  - Quality indicators (great/good/okay)
  - Conversion ratios included
  - Shows available substitutes from your pantry
  - Integrated into "What Can I Make?" page
  
- **Price Tracking**: Budget management
  - Track prices paid per ingredient
  - Store tracking (where you shop)
  - Price history with trends (increasing/decreasing/stable)
  - Recipe cost estimation on recipe page
  - Export price data to CSV
  
- **Smart Expiration Dates**: Reduce food waste
  - Auto-suggests expiration based on category and storage location
  - Shows "typically good for X days" hints
  - Specific overrides for common items (milk, eggs, etc.)
  
- **Shopping Insights**: Usage patterns
  - Purchase frequency tracking
  - "Running low soon" predictions
  - Restock suggestions based on usage patterns
  - Average time between purchases

### API Endpoints Added
- `GET /api/ingredients/barcode/:barcode` - Open Food Facts lookup
- `GET /api/ingredients/pantry/frequent` - Frequently added items
- `GET /api/ingredients/pantry/recent` - Recently added items
- `POST /api/ingredients/pantry/bulk` - Bulk add items
- `GET /api/ingredients/substitutes` - All substitution rules
- `GET /api/ingredients/:id/substitutes` - Substitutes for ingredient
- `GET /api/ingredients/:id/price-history` - Full price history
- `GET /api/ingredients/shelf-life/:category/:location` - Shelf life defaults
- `GET /api/ingredients/shelf-life/suggest` - Smart expiration suggestion
- `GET /api/ingredients/shopping-insights` - Usage patterns
- `GET /api/recipes/:slug/nutrition` - Recipe nutrition calculation
- `GET /api/recipes/:slug/cost-estimate` - Recipe cost estimation
- `GET /api/recipes/:slug/substitutes` - Missing ingredient substitutes

---

## [1.2.0] - 2026-01-26

### Added
- **Mobile Responsive Design**: Full mobile and tablet support
  - Hamburger menu navigation for mobile devices
  - Touch-friendly tap targets (44px+)
  - Safe area insets for modern devices
  - Landscape orientation optimizations
  
- **Ingredient Database**: Structured ingredient management
  - Auto-detection for categories, allergens, dietary flags
  - Pantry management (add, update, remove items)
  - Storage location tracking (pantry/refrigerator/freezer)
  - Expiration date tracking with alerts
  
- **Pantry Management** (`/pantry`):
  - Add items with quantity, unit, location
  - Quick quantity adjustments (+/-)
  - Expiration alerts (expiring soon, expired)
  - Filter by location
  - Search functionality
  
- **"What Can I Make?"** (`/what-can-i-make`):
  - Recipe suggestions based on pantry contents
  - Match percentage display
  - Missing ingredients list
  - "Add Missing to Shopping List" action

### Keyboard Shortcuts
- `P` - Navigate to Pantry
- `W` - Navigate to What Can I Make?

---

## [1.0.0] - 2026-01-08

### Added
- **Recipe Import**: Import recipes from URLs with automatic extraction of ingredients, instructions, and metadata
- **Manual Recipe Entry**: Add recipes by hand with full form at `/add-recipe.html`
- **Edit Recipes**: Modify any saved recipe, handles title/slug changes
- **Search & Filter**: Real-time search across title, description, tags, and ingredients
- **Favorites**: Star recipes and filter to show only favorites
- **Tag System**: 
  - Clickable tag cloud on recipes page
  - Filter by tag
  - Tag management page to rename/delete tags
- **Collections**: User-defined recipe collections with full CRUD
- **Cook Mode**: Full-screen step-by-step view with dark theme, swipe/keyboard navigation
- **Recipe Scaling**: Adjust servings with automatic ingredient recalculation
  - Handles fractions, mixed numbers, ranges
  - Smart unit conversion
  - Unicode fraction display
- **Print View**: Printer-friendly recipe formatting
- **Notes & Ratings**: Personal notes and 1-5 star ratings per recipe
- **Shopping Lists**:
  - Create lists from recipe ingredients
  - Combine duplicate ingredients across recipes
  - Auto-categorize by store aisle (9 categories)
  - Add custom items
  - Collapsible category sections

### Technical
- Express.js backend with plain HTML/CSS/JS frontend
- Markdown files with YAML frontmatter for recipe storage
- JSON files for shopping lists and collections
- No build step required

---

## [1.1.0] - 2026-01-08

### Added
- **Dark Mode**: System-wide dark theme with toggle button in navigation
  - CSS variables for easy theming
  - Flash-prevention script to avoid FOUC
  - Persists preference via localStorage
- **Toast Notifications**: Non-intrusive feedback replacing alert() dialogs
  - Success, error, and info variants
  - Auto-dismiss after 3.5 seconds
- **Recently Viewed**: Track and display last 5 viewed recipes on home page
  - Clear history option
  - Persists via localStorage
- **Quick Add to Shopping List**: 🛒 button on recipe cards and detail page
  - Dropdown to select existing list or create new
  - One-click ingredient adding
- **Improved Home Page**: 
  - Quick stats (recipe count, favorites, collections)
  - Random recipe suggestion with "Surprise Me!" refresh
  - Quick actions grid for common tasks
- **Keyboard Shortcuts**: Global navigation shortcuts
  - Press `?` to view all shortcuts
  - `H` for home, `R` for recipes, `C` for collections
  - `S` for shopping lists, `A` for add recipe
  - `/` to focus search
- **Duplicate Detection**: Warning when importing/adding similar recipes
  - Checks URL match and title similarity
  - Shows modal with option to proceed or view existing
  - Inline warning on manual add form
- **Recipe Image Upload**: Upload images directly from your device
  - Drag & drop or click to select
  - Support for JPEG, PNG, GIF, WebP (5MB max)
  - Option to use URL or upload file
  - Preview and remove functionality

### Changed
- Replaced 15 alert() calls with toast notifications
- Home page redesigned with actionable sections
- Recipe add/edit forms now have unified image picker (upload or URL)

---

## [1.2.0] - 2026-01-26

### Added
- **Mobile Responsive Design**: Comprehensive mobile-friendly styling
  - Hamburger menu navigation on phones/tablets
  - Touch-friendly tap targets (min 44px)
  - Better form and grid layouts on small screens
  - Safe area insets for notched devices
  - Landscape orientation optimizations
- **Ingredient Database**: Structured ingredient data system
  - Canonical ingredient names with aliases
  - Auto-categorization into 9 grocery categories
  - Allergen detection (dairy, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame)
  - Dietary flag detection (vegetarian, vegan, gluten-free, dairy-free)
  - Unit parsing and normalization
  - Price tracking per ingredient
- **Pantry Management**: Track ingredients you have at home
  - New page at `/pantry.html`
  - Add items with quantity, unit, and storage location
  - Track purchase and expiration dates
  - Expiring/expired items alerts
  - Quick quantity adjustments
  - Filter by location (pantry, refrigerator, freezer)
- **"What Can I Make?" Feature**: Recipe suggestions based on pantry
  - New page at `/what-can-i-make.html`
  - Shows recipes sorted by ingredient match percentage
  - Displays missing ingredients for each recipe
  - One-click "Add Missing to Shopping List" action
- **Recipe-Pantry Integration**: 
  - `/api/recipes/:slug/shopping-needed` - Get items needed from store
  - `/api/recipes/:slug/parsed-ingredients` - Get parsed ingredient data with pantry status
  - `/api/recipes/:slug/cost-estimate` - Estimate recipe cost based on price data
- **New Keyboard Shortcuts**: 
  - `P` for Pantry
  - `W` for "What Can I Make?"

### API Endpoints Added
- `GET /api/ingredients` - Search/list all ingredients
- `GET /api/ingredients/categories` - Get category definitions
- `GET /api/ingredients/allergens` - Get allergen info
- `GET /api/ingredients/units` - Get unit definitions
- `POST /api/ingredients` - Create new ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient
- `POST /api/ingredients/:id/price` - Add price record
- `POST /api/ingredients/parse` - Parse ingredient string
- `GET /api/ingredients/pantry/items` - List pantry items
- `GET /api/ingredients/pantry/expiring` - Get expiring items
- `GET /api/ingredients/pantry/expired` - Get expired items
- `POST /api/ingredients/pantry` - Add to pantry
- `PUT /api/ingredients/pantry/:id` - Update pantry item
- `DELETE /api/ingredients/pantry/:id` - Remove from pantry

### Technical
- New `lib/ingredients.js` module with comprehensive ingredient handling
- New `routes/ingredients.js` API router
- New `content/ingredients/` directory for ingredient and pantry data
- ~1800 lines of new backend code
- ~800 lines of new CSS for mobile responsiveness

---

## [Unreleased]

### Planned
- Additional quality of life improvements
- Performance optimizations

See [ROADMAP.md](ROADMAP.md) for full details.
