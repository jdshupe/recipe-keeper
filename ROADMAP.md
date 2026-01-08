# Recipe Keeper - Roadmap

## Best Practices for Feature Planning

### Recommended Workflow

1. **GitHub Issues** - Create an issue for each feature/bug
   - Use labels: `enhancement`, `bug`, `documentation`, `priority:high/medium/low`
   - Reference issues in commits: `git commit -m "Add dark mode (fixes #12)"`

2. **Semantic Versioning** (semver.org)
   - **MAJOR** (2.0.0): Breaking changes, major redesigns
   - **MINOR** (1.1.0): New features, backwards compatible
   - **PATCH** (1.0.1): Bug fixes, small improvements

3. **This Roadmap File**
   - Plan upcoming releases
   - Track what's in progress
   - Document decisions and priorities

4. **CHANGELOG.md** - Keep a running log of changes per version

5. **GitHub Milestones** - Group issues into releases

---

## Release v1.1.0 - Quality of Life (Planned)

Target: User convenience improvements, polish, and easy wins.

### 1. Dark Mode
**Priority:** High | **Difficulty:** Easy | **Est. Lines:** ~100

**What:** Toggle between light and dark color schemes.

**Why:** 
- Cook mode already has dark theme - users expect it everywhere
- Easier on eyes at night
- Modern app expectation

**Implementation Plan:**
- Add CSS variables for all colors in `:root`
- Create `.dark-mode` class variants
- Toggle button in navbar
- Save preference to localStorage
- Respect system preference (`prefers-color-scheme`)

---

### 2. Recently Viewed Recipes
**Priority:** High | **Difficulty:** Easy | **Est. Lines:** ~60

**What:** Show last 5-10 viewed recipes on home page.

**Why:**
- Quick access to recipes you're actively using
- Home page currently just shows "recent recipes" by date added
- Users often return to same recipes repeatedly

**Implementation Plan:**
- Track views in localStorage (array of slugs + timestamps)
- Add "Recently Viewed" section to home page
- Limit to last 10, deduplicate
- Clear button optional

---

### 3. Keyboard Shortcuts (Global)
**Priority:** Medium | **Difficulty:** Easy | **Est. Lines:** ~80

**What:** Keyboard shortcuts for common actions across the app.

**Why:**
- Power users appreciate keyboard navigation
- Cook mode already has shortcuts - extend to whole app
- Faster than clicking

**Proposed Shortcuts:**
| Key | Action |
|-----|--------|
| `/` or `Ctrl+K` | Focus search |
| `n` | New recipe |
| `h` | Go home |
| `r` | Go to recipes |
| `s` | Go to shopping lists |
| `c` | Go to collections |
| `?` | Show shortcuts help |

**Implementation Plan:**
- Global keydown listener
- Check for input focus to avoid conflicts
- Help modal showing all shortcuts

---

### 4. Quick Add to Shopping List
**Priority:** High | **Difficulty:** Easy | **Est. Lines:** ~50

**What:** One-click "Add to Shopping List" from recipe card or detail page.

**Why:**
- Currently requires: Recipe → Click → Create New List → Select Recipe
- Should be: Recipe → "Add to List" → Done
- Most common workflow should be fastest

**Implementation Plan:**
- Add "🛒" button on recipe cards
- Dropdown to select existing list or create new
- Toast confirmation "Added to [List Name]"

---

### 5. Duplicate Recipe Detection
**Priority:** Medium | **Difficulty:** Medium | **Est. Lines:** ~100

**What:** Warn when importing/adding a recipe that might already exist.

**Why:**
- Easy to accidentally import same recipe twice
- Wastes storage and clutters collection
- Confusing to have duplicates

**Implementation Plan:**
- Check title similarity (fuzzy match)
- Check source URL exact match
- Show warning with option to proceed or view existing
- Run check on scrape and manual add

---

### 6. Recipe Image Upload
**Priority:** Medium | **Difficulty:** Medium | **Est. Lines:** ~150

**What:** Upload local images instead of only URL references.

**Why:**
- Many recipes don't have good images online
- Users may want custom photos of their version
- URL images can break/disappear

**Implementation Plan:**
- File upload on add/edit forms
- Store in `content/images/` directory
- Resize/compress on upload
- Fallback placeholder for missing images

---

### 7. Improved Home Page
**Priority:** Medium | **Difficulty:** Easy | **Est. Lines:** ~80

**What:** Better home page with more useful sections.

**Why:**
- Current home page is basic
- Could surface more useful information
- First impression matters

**Proposed Sections:**
- Quick stats (X recipes, Y collections, Z favorites)
- Recently viewed
- Random "Try this tonight" suggestion
- Quick actions (Import, Add, Browse)

---

### 8. Toast Notifications
**Priority:** Low | **Difficulty:** Easy | **Est. Lines:** ~60

**What:** Non-blocking success/error notifications.

**Why:**
- Current feedback is inline messages or alerts
- Toasts are more modern and less intrusive
- Better UX for quick actions

**Implementation Plan:**
- Simple toast component (CSS + JS)
- Auto-dismiss after 3 seconds
- Stack multiple toasts
- Success (green), Error (red), Info (blue)

---

## Release v1.2.0 - Enhanced Experience (Future)

### 9. Cooking Timers
**Priority:** Medium | **Difficulty:** Medium | **Est. Lines:** ~150

**What:** Built-in timers, auto-detected from recipe text.

**Why:**
- No need for separate timer app
- Parse "bake for 25 minutes" → clickable timer button
- Useful in cook mode especially

---

### 10. Backup/Export All Data
**Priority:** High | **Difficulty:** Easy-Medium | **Est. Lines:** ~100

**What:** Download all recipes as ZIP or generate PDF cookbook.

**Why:**
- Data portability is important
- Peace of mind backup
- Share entire collection

---

### 11. Share Individual Recipes
**Priority:** Medium | **Difficulty:** Medium | **Est. Lines:** ~150

**What:** Share link, export as PDF, or copy to clipboard.

**Why:**
- Easy sharing with friends/family
- Print alternative for digital sharing
- Social feature

---

### 12. Import Improvements
**Priority:** Medium | **Difficulty:** Hard | **Est. Lines:** ~200

**What:** Better handling of sites without structured data.

**Why:**
- Many sites don't have JSON-LD
- Users paste URLs that fail to import
- Fallback parsing would help

**Options:**
- Paste raw text mode with smart parsing
- Site-specific scrapers for popular recipe sites
- AI-assisted extraction (future)

---

## Release v2.0.0 - Major Features (Future)

### 13. Meal Planning Calendar
**Priority:** High | **Difficulty:** Hard | **Est. Lines:** ~500

**What:** Weekly/monthly calendar to plan meals, auto-generate shopping lists.

---

### 14. Offline Support (PWA)
**Priority:** Medium | **Difficulty:** Hard | **Est. Lines:** ~400

**What:** Works without internet, syncs when online.

---

### 15. Multi-User Support
**Priority:** Low | **Difficulty:** Hard | **Est. Lines:** ~800+

**What:** User accounts, shared family recipes, permissions.

---

## Summary - v1.1.0 Candidates

| # | Feature | Priority | Difficulty | Est. Lines |
|---|---------|----------|------------|------------|
| 1 | Dark Mode | High | Easy | ~100 |
| 2 | Recently Viewed | High | Easy | ~60 |
| 3 | Keyboard Shortcuts | Medium | Easy | ~80 |
| 4 | Quick Add to Shopping List | High | Easy | ~50 |
| 5 | Duplicate Detection | Medium | Medium | ~100 |
| 6 | Image Upload | Medium | Medium | ~150 |
| 7 | Improved Home Page | Medium | Easy | ~80 |
| 8 | Toast Notifications | Low | Easy | ~60 |

**Recommended for v1.1.0:** Features 1, 2, 4, 7, 8 (High priority + Easy)
- Total estimated: ~350 lines
- Expected actual: ~1,000-1,500 lines (based on 3-4x pattern from v1.0)

---

## Notes

- Estimates are consistently 3-5x lower than actual implementation
- "Easy" features often need more polish than expected
- Always test on mobile - many users cook with phones
- Consider accessibility (a11y) in all new features
