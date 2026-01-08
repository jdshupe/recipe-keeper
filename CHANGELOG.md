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

## [Unreleased]

### Planned for v1.1.0
- Dark mode toggle
- Recently viewed recipes on home page
- Quick add to shopping list from recipe cards
- Improved home page with stats and suggestions
- Toast notifications for better feedback
- Global keyboard shortcuts

See [ROADMAP.md](ROADMAP.md) for full details.
