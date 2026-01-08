# Changelog

All notable changes to Recipe Keeper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Changed
- Replaced 15 alert() calls with toast notifications
- Home page redesigned with actionable sections

---

## [Unreleased]

### Planned
- Duplicate recipe detection on import
- Keyboard shortcuts
- Global keyboard shortcuts

See [ROADMAP.md](ROADMAP.md) for full details.
