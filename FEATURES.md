# Recipe Keeper - Feature Ideas

Analysis of potential features based on typical user workflows.

---

## User Workflows

1. **Finding Recipes** - User discovers a recipe online, wants to save it
2. **Browsing Collection** - User looks through saved recipes to decide what to cook
3. **Cooking** - User follows recipe while in the kitchen
4. **Shopping** - User creates list and shops at the store

---

## High Value Features

### 1. Search & Filter Recipes ✅ IMPLEMENTED
**What:** Search bar to find recipes by name, ingredient, or tag. Filter by category, cook time, etc.

**Why:** Once you have 20+ recipes, scrolling becomes tedious. This is essential for a growing collection.

**Difficulty:** Easy
- Add search input to recipes page
- Filter in JavaScript (no backend changes needed for basic search)
- ~50 lines of code

**Implementation Details:**
- Search bar on recipes page with real-time filtering as you type
- Searches across title, description, tags, and ingredients
- Filter buttons (All / Favorites) to toggle view
- Client-side filtering with cached recipe data for fast response
- **Tag Filtering**: Clickable tag cloud showing all tags with recipe counts, click to filter by tag, works with search and favorites
- **Tag Management**: Dedicated `/tags.html` page to view all tags, see recipes per tag, rename or delete tags across all recipes
- **Clickable Tags**: Tags on recipe cards are clickable to filter
- Tag filtering added ~546 lines

---

### 2. Manual Recipe Entry ✅ IMPLEMENTED
**What:** Form to add recipes by hand instead of only importing from URLs.

**Why:** Many recipes come from cookbooks, family members, or sites that don't have structured data. Currently no way to add these.

**Difficulty:** Medium
- Create new HTML page with form (title, ingredients, instructions, etc.)
- Add POST endpoint to save
- ~150 lines of code

**Implementation Details:**
- New page at `/add-recipe.html` with complete recipe form
- Fields: title, description, prep/cook time, servings, tags, source URL, image URL, ingredients, instructions
- POST `/api/recipes` endpoint saves recipe as markdown with YAML frontmatter
- Auto-generates slug from title, checks for duplicates
- "+ Add Recipe" button in navigation bar
- Client and server-side validation

---

### 3. Edit Existing Recipes ✅ IMPLEMENTED
**What:** Ability to modify a saved recipe (fix typos, adjust ingredients, add notes).

**Why:** Imported recipes often need tweaking. Users want to personalize recipes over time.

**Difficulty:** Medium
- Add edit button to recipe detail page
- Create edit form (similar to manual entry)
- Pre-populate with existing data
- ~100 lines of code

**Implementation Details:**
- New page at `/edit-recipe.html?slug=recipe-slug`
- "✏️ Edit Recipe" button on recipe detail page
- Pre-populates form with existing recipe data (converts arrays back to textarea format)
- PUT `/api/recipes/:slug` endpoint handles updates
- If title changes, handles slug change (deletes old file, creates new)
- Preserves `favorite` status and `dateAdded` when editing

---

### 4. Recipe Scaling (Adjust Servings) ✅ IMPLEMENTED
**What:** Slider or input to change servings, automatically recalculates ingredient amounts.

**Why:** Recipes are often for 4 servings but user needs 2 or 6. Manual math is error-prone.

**Difficulty:** Hard
- Parse ingredient amounts (fractions, ranges, "to taste")
- Handle mixed units
- UI for selecting servings
- ~200 lines of code, complex parsing logic

**Implementation Details:**
- Servings control with +/- buttons on recipe detail page
- Intelligent ingredient parsing handles:
  - Whole numbers: "2 cups" → "4 cups"
  - Fractions: "1/2 cup" → "1 cup"
  - Mixed numbers: "1 1/2 cups" → "3 cups"
  - Ranges: "2-3 tablespoons" → "4-6 tablespoons"
  - Parentheticals: "2 (15 oz) cans" scales only the leading 2
  - No quantity items left unchanged ("salt to taste")
- Unicode fraction display (½, ¼, ¾, ⅓, ⅔, etc.)
- Scale factor indicator (e.g., "2.00x")
- Reset button to return to original amounts
- Estimated: ~200 lines | Actual: **465 lines** (2.3x estimate)

---

### 5. Favorite/Star Recipes ✅ IMPLEMENTED
**What:** Mark recipes as favorites, filter to show only favorites.

**Why:** Quick access to go-to recipes. Currently all recipes are equal.

**Difficulty:** Easy
- Add `favorite: boolean` to recipe schema
- Star icon on recipe cards and detail page
- Filter toggle
- ~40 lines of code

**Implementation Details:**
- Star (☆/★) button on each recipe card
- Toggle favorite button on recipe detail page
- PATCH `/api/recipes/:slug/favorite` endpoint toggles status
- "Favorites" filter button on recipes page
- Favorite status stored in recipe YAML frontmatter
- Visual feedback with filled/empty star icons

---

### 6. Cook Mode (Step-by-Step View) ✅ IMPLEMENTED
**What:** Full-screen, large-text view showing one instruction step at a time. Swipe/tap to advance.

**Why:** Kitchen use - hands may be dirty/wet, need large text visible from distance.

**Difficulty:** Medium
- New page/modal with step navigation
- Large fonts, high contrast
- Touch-friendly controls
- ~100 lines of code

**Implementation Details:**
- New page at `/cook-mode.html?slug=recipe-slug`
- Dark theme (#0d1117 background, light text) for kitchen visibility
- Large, easy-to-read text (28px on mobile, 40px on desktop)
- Step counter ("Step 3 of 8") and visual progress bar
- Previous/Next navigation buttons (64px tall, touch-friendly)
- Swipe left/right on mobile devices
- Keyboard navigation: Arrow keys, Space (next), Escape (exit), 'i' (ingredients)
- Collapsible ingredients sidebar for quick reference
- "🍳 Start Cooking" button on recipe detail page
- Estimated: ~100 lines | Actual: **527 lines** (5.3x estimate)

---

### 7. Print-Friendly View ✅ IMPLEMENTED
**What:** CSS print stylesheet or dedicated print button that formats recipe nicely for paper.

**Why:** Many users still print recipes to use in kitchen or share with others.

**Difficulty:** Easy
- Add `@media print` CSS rules
- Hide navigation, optimize layout
- ~50 lines of CSS

**Implementation Details:**
- `@media print` CSS rules hide navigation, buttons, and interactive elements
- Resets backgrounds to white for ink-friendly printing
- Optimizes layout for paper (removes shadows, borders)
- Page break handling for long recipes
- "🖨️ Print Recipe" button on recipe detail page
- Hides scaling controls when printing

---

## Medium Value Features

### 8. Meal Planning Calendar
**What:** Weekly/monthly calendar to assign recipes to days. Auto-generate shopping list from planned meals.

**Why:** Helps with weekly meal prep and organized shopping.

**Difficulty:** Hard
- New data model for meal plans
- Calendar UI component
- Integration with shopping lists
- ~400 lines of code

---

### 9. Recipe Categories/Collections ✅ IMPLEMENTED
**What:** User-defined collections (e.g., "Weeknight Dinners", "Holiday Recipes", "Kid-Friendly").

**Why:** Better organization beyond tags. Group recipes by personal criteria.

**Difficulty:** Medium
- New data model for collections
- UI to create/manage collections
- Add recipes to collections
- ~200 lines of code

**Implementation Details:**
- **Collections Page** (`/collections.html`): View all collections with recipe counts, create/edit/delete collections
- **Collection View** (`/collection.html?id=xxx`): See all recipes in a collection, remove recipes, edit collection
- **Add to Collection**: Dropdown on recipe detail page to add/remove recipe from collections
- **Collection Badges**: Recipe detail shows which collections it belongs to
- **Data Model**: JSON files in `content/collections/` with id, name, description, recipeSlugs array
- **API**: Full CRUD at `/api/collections` plus endpoints for adding/removing recipes
- "Collections" link added to main navigation
- Estimated: ~200 lines | Actual: **~1,287 lines** (6.4x estimate)

---

### 10. Import from More Sources
**What:** Support pasting recipe text, importing from specific popular sites, or uploading photos.

**Why:** Many sites don't have JSON-LD. Users may have recipes in various formats.

**Difficulty:** Hard
- Text parsing with heuristics
- Site-specific scrapers
- OCR for photos (would need external service)
- Variable, potentially 500+ lines

---

### 11. Share Recipes
**What:** Generate shareable link, export as PDF, or email recipe to someone.

**Why:** Users want to share favorites with friends/family.

**Difficulty:** Medium
- PDF generation (using library like pdfkit)
- Or simple share page with recipe content
- ~150 lines of code

---

### 12. Shopping List Improvements ✅ IMPLEMENTED
**What:** 
- Combine duplicate ingredients across recipes
- Sort by store aisle/category
- Add custom items not from recipes

**Why:** Current list is basic. Real shopping trips need organization.

**Difficulty:** Medium-Hard
- Ingredient parsing/normalization
- Category assignment
- Custom item UI
- ~250 lines of code

**Implementation Details:**
- **Combine Duplicates**: Parses ingredient quantities (fractions, mixed numbers), detects duplicates by normalized name, combines compatible units (tsp→tbsp→cups), displays with Unicode fractions
- **Category Sorting**: 9 categories (Produce, Meat, Dairy, Bakery, Pantry, Spices, Frozen, Beverages, Other) with auto-categorization by keyword matching
- **Category UI**: Color-coded headers with icons (🥬🥩🧈🍞🥫🧂🧊🥤📦), collapsible sections, completion progress per category
- **Custom Items**: Input field at top, Enter key support, "Custom Items" category, delete button for each item
- Estimated: ~250 lines | Actual: **~924 lines** (3.7x estimate)

---

## Nice-to-Have Features

### 13. Dark Mode
**What:** Dark color scheme option.

**Why:** Easier on eyes at night, user preference.

**Difficulty:** Easy
- CSS variables for colors
- Toggle switch
- localStorage for preference
- ~80 lines of code

---

### 14. Recipe Notes/Ratings ✅ IMPLEMENTED
**What:** Personal notes field and 1-5 star rating for each recipe.

**Why:** Track modifications made, remember if recipe was good.

**Difficulty:** Easy
- Add fields to recipe schema
- UI for rating stars and notes textarea
- ~60 lines of code

**Implementation Details:**
- "My Rating" section with 5 clickable star icons on recipe detail page
- Click any star to set rating (1-5), click again to clear
- Yellow filled stars for rating, gray empty stars for unrated
- "My Notes" textarea with Save button
- PATCH `/api/recipes/:slug/rating` and `/api/recipes/:slug/notes` endpoints
- Rating and notes stored in recipe YAML frontmatter
- "✓ Saved" feedback after saving notes

---

### 15. Recently Viewed
**What:** Show recently accessed recipes on home page.

**Why:** Quick access to recipes you're currently using.

**Difficulty:** Easy
- Track in localStorage
- Display section on home page
- ~40 lines of code

---

### 16. Cooking Timers
**What:** Built-in timers that can be set from recipe page (e.g., "Bake 25 mins" has timer button).

**Why:** Convenient - no need for separate timer app.

**Difficulty:** Medium
- Timer UI component
- Audio notification
- Parse times from instructions
- ~120 lines of code

---

### 17. Nutritional Information
**What:** Display calories, macros, etc. for recipes.

**Why:** Health-conscious users want to track nutrition.

**Difficulty:** Hard
- Requires nutrition database or API
- Ingredient matching is complex
- Would need external service (Edamam, Nutritionix, etc.)
- API integration ~200 lines, ongoing API costs

---

### 18. Offline Support (PWA)
**What:** App works without internet, syncs when back online.

**Why:** Useful in kitchen or store with poor connectivity.

**Difficulty:** Hard
- Service worker for caching
- Offline-first architecture
- Sync conflict resolution
- ~300 lines of code, architectural changes

---

### 19. Backup/Export All Data
**What:** Download all recipes as ZIP, JSON, or PDF cookbook.

**Why:** Data ownership, migration, peace of mind.

**Difficulty:** Easy-Medium
- ZIP generation with all markdown files
- ~80 lines of code

---

## Summary Table

| Feature | Value | Difficulty | Lines of Code |
|---------|-------|------------|---------------|
| Search & Filter | High | Easy | ~50 |
| Manual Recipe Entry | High | Medium | ~150 |
| Edit Recipes | High | Medium | ~100 |
| Recipe Scaling | High | Hard | ~200 |
| Favorites | High | Easy | ~40 |
| Cook Mode | High | Medium | ~100 |
| Print View | High | Easy | ~50 CSS |
| Meal Planning | Medium | Hard | ~400 |
| Collections | Medium | Medium | ~200 |
| More Import Sources | Medium | Hard | ~500+ |
| Share Recipes | Medium | Medium | ~150 |
| Shopping List Improvements | Medium | Medium-Hard | ~250 |
| Dark Mode | Nice | Easy | ~80 |
| Notes/Ratings | Nice | Easy | ~60 |
| Recently Viewed | Nice | Easy | ~40 |
| Cooking Timers | Nice | Medium | ~120 |
| Nutritional Info | Nice | Hard | ~200 + API |
| Offline/PWA | Nice | Hard | ~300 |
| Backup/Export | Nice | Easy-Medium | ~80 |

---

## Recommended Priority

**Phase 1 - Essential Usability:** ✅ COMPLETE
1. ✅ Search & Filter - Implemented: search by name/ingredient/tag, filter by favorites
2. ✅ Favorites - Implemented: star button on cards, toggle on detail, filter view
3. ✅ Print View - Implemented: print stylesheet, print button on recipe detail

**Phase 2 - Content Management:** ✅ COMPLETE
4. ✅ Manual Recipe Entry - Implemented: form at /add-recipe.html, POST API endpoint
5. ✅ Edit Recipes - Implemented: form at /edit-recipe.html, edit button on detail page, handles slug changes
6. ✅ Notes/Ratings - Implemented: 1-5 star rating, personal notes textarea on recipe detail

**Phase 3 - Kitchen Experience:** ✅ COMPLETE
7. ✅ Cook Mode - Implemented: full-screen step-by-step view, swipe/keyboard nav, ingredient sidebar
   - Estimated: ~100 lines | Actual: **527 lines** (5.3x estimate)
8. ✅ Recipe Scaling - Implemented: servings adjuster, fraction parsing, real-time scaling
   - Estimated: ~200 lines | Actual: **465 lines** (2.3x estimate)

**Phase 4 - Advanced:** ✅ COMPLETE
9. ✅ Shopping List Improvements - Implemented: combine duplicates, category sorting, custom items
   - Estimated: ~250 lines | Actual: **~924 lines** (3.7x estimate)
10. ✅ Collections/Categories - Implemented: create/manage collections, add recipes to collections
    - Estimated: ~200 lines | Actual: **~1,287 lines** (6.4x estimate)
11. ✅ Tag Filtering & Management - Implemented: tag cloud, filter by tag, manage/rename/delete tags
    - Added: **~546 lines**
