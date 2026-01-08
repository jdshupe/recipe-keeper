# Recipe Keeper - Refactoring Analysis

Analysis against LLM AI Coding Principles. Only changes that improve regenerability, debuggability, or code clarity are included.

---

## 🔴 High Priority

### 1. Fix Broken Route (Bug)
**File:** `server.js`

The route `/shopping-list/:id` references `shopping-list-detail.html` which doesn't exist. The actual file is `shopping-list.html`. Also, the `/shopping-list/new` route is unreachable because Express matches `:id` first.

**Fix:** Update server.js to use correct filenames and reorder routes.

---

### 2. Remove Dead Code
**File:** `lib/scraper.js`

The `parseIngredient()` function (lines 12-31) is defined but never used. It's dead code that adds confusion.

**Fix:** Delete the `parseIngredient` function entirely.

---

### 3. Remove Debug Logging
**File:** `lib/recipes.js`

Console.log statements for debugging were left in:
- Line 20: `console.log('Found recipe files:', mdFiles);`
- Line 25: `console.log('Loaded recipe:', slug, '- title:', data.title);`

**Fix:** Remove debug console.log statements (keep error logging).

---

### 4. Add Error Handling to Frontend API Calls
**File:** `public/js/app.js`

Functions like `loadRecentRecipes()`, `loadAllRecipes()`, `loadShoppingLists()` have no try/catch. Network errors will silently fail.

**Fix:** Wrap API calls in try/catch and show user-friendly error messages.

---

## 🟡 Medium Priority

### 5. Extract Shared Utility Function
**Files:** `lib/recipes.js`, `lib/shopping-lists.js`

Both files have identical `ensureDir()` functions. This duplication means fixes need to be applied twice.

**Fix:** Create `lib/utils.js` with shared `ensureDir(dirPath)` function and import it in both files.

---

### 6. Simplify Shopping List PUT Endpoint
**File:** `routes/shopping-lists.js`

The PUT endpoint handles 4 different operations with conditionals (items array, toggle, clearChecked, name). This makes it harder to understand and debug.

**Fix:** Either:
- Split into separate endpoints (`/toggle`, `/clear-checked`)
- Or document the contract clearly with comments

---

### 7. Extract Content Paths to Config
**Files:** `lib/recipes.js`, `lib/shopping-lists.js`

Content directory paths are hardcoded:
```javascript
const RECIPES_DIR = path.join(__dirname, '..', 'content', 'recipes');
const LISTS_DIR = path.join(__dirname, '..', 'content', 'shopping-lists');
```

**Fix:** Create `lib/config.js` exporting paths, making it easy to change storage location.

---

### 8. Reduce Navigation Duplication
**Files:** All 6 HTML files

The navigation bar is copy-pasted in every HTML file. Changes require editing 6 files.

**Options:**
- Accept the duplication (it's simple, explicit, and regenerable)
- Create a simple JS function to inject nav on page load

**Recommendation:** Accept duplication for now - it's more explicit and each page can be regenerated independently. Add a comment noting the pattern.

---

## 🟢 Lower Priority

### 9. Rename File for Consistency
**File:** `public/shopping-list-new.html`

Current: `shopping-list-new.html` (noun-adjective)
Pattern elsewhere: `shopping-list.html`, `shopping-lists.html`

**Consider:** Rename to `new-shopping-list.html` or keep as-is. Low impact.

---

### 10. Consider Merging Scrape Route
**Files:** `routes/scrape.js` (39 lines)

The scrape route file is small and tightly coupled to recipes. Could be merged into `routes/recipes.js` as `POST /api/recipes/import`.

**Tradeoff:** Current separation is clearer for understanding. Merging reduces files but increases recipes.js complexity.

**Recommendation:** Keep separate - the current structure is more explicit.

---

### 11. Add Input Validation
**Files:** `routes/recipes.js`, `routes/shopping-lists.js`

API endpoints don't validate input format (e.g., slug patterns, required fields structure).

**Fix:** Add simple validation at route level. Not critical for personal app but improves robustness.

---

## ✅ Things That Are Fine (No Change Needed)

| Item | Why It's Fine |
|------|---------------|
| API response format `{success, data/error}` | Consistent across all endpoints |
| File-based storage (MD + JSON) | Simple, debuggable, no database needed |
| Flat project structure | Easy to navigate, no deep nesting |
| Separate CSS file | Single source of truth for styles |
| Single app.js for frontend | Appropriate for app size |
| Express without framework | Minimal dependencies, predictable |

---

## Summary

| Priority | Count | Effort |
|----------|-------|--------|
| 🔴 High | 4 items | ~30 min |
| 🟡 Medium | 4 items | ~1 hour |
| 🟢 Lower | 3 items | Optional |

**Recommended approach:** Fix High priority items first (especially #1 which is a bug), then Medium as time allows. Lower priority items are optional improvements.
