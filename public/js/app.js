// API Helpers
async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return response.json();
}

// =====================
// Toast Notification System
// =====================

const TOAST_ICONS = {
  success: '✓',
  error: '✗',
  info: 'ℹ'
};

const TOAST_DURATION = 3500; // 3.5 seconds

function getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info') {
  const container = getOrCreateToastContainer();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Create icon
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;
  
  // Create message
  const msg = document.createElement('span');
  msg.className = 'toast-message';
  msg.textContent = message;
  
  // Assemble toast
  toast.appendChild(icon);
  toast.appendChild(msg);
  
  // Add click to dismiss
  toast.addEventListener('click', () => removeToast(toast));
  
  // Add to container
  container.appendChild(toast);
  
  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });
  
  // Auto-remove after duration
  setTimeout(() => removeToast(toast), TOAST_DURATION);
  
  return toast;
}

function removeToast(toast) {
  if (!toast || toast.classList.contains('toast-removing')) return;
  
  toast.classList.add('toast-removing');
  toast.classList.remove('toast-visible');
  
  // Remove from DOM after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// =====================
// Dark Mode
// =====================

function initDarkMode() {
  // Check saved preference or system preference
  const saved = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (saved === 'true' || (saved === null && prefersDark)) {
    document.documentElement.classList.add('dark-mode');
  }
  
  // Update toggle button state
  updateDarkModeToggle();
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark);
  updateDarkModeToggle();
}

function updateDarkModeToggle() {
  const toggles = document.querySelectorAll('.dark-mode-toggle');
  const isDark = document.documentElement.classList.contains('dark-mode');
  toggles.forEach(toggle => {
    toggle.textContent = isDark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

// Initialize dark mode immediately
initDarkMode();

// =====================
// Recipe Scaling System
// =====================

// Global state for scaling
let originalIngredients = [];
let originalServings = 1;
let currentServings = 1;

// Common fractions for nice display
const FRACTION_MAP = {
  0.125: '⅛',
  0.25: '¼',
  0.333: '⅓',
  0.375: '⅜',
  0.5: '½',
  0.625: '⅝',
  0.667: '⅔',
  0.75: '¾',
  0.875: '⅞'
};

// Parse a fraction string like "1/2" to decimal
function parseFraction(str) {
  if (str.includes('/')) {
    const [num, denom] = str.split('/').map(Number);
    if (denom !== 0) return num / denom;
  }
  return parseFloat(str);
}

// Convert decimal to nice fraction string
function decimalToFraction(decimal) {
  if (decimal === 0) return '0';
  
  const whole = Math.floor(decimal);
  const frac = decimal - whole;
  
  // If it's a whole number
  if (frac < 0.0625) {
    return whole.toString();
  }
  
  // Find closest fraction
  let closestFrac = '';
  let closestDiff = 1;
  
  for (const [val, symbol] of Object.entries(FRACTION_MAP)) {
    const diff = Math.abs(frac - parseFloat(val));
    if (diff < closestDiff) {
      closestDiff = diff;
      closestFrac = symbol;
    }
  }
  
  // If difference is too large, just use decimal
  if (closestDiff > 0.05) {
    const rounded = Math.round(decimal * 100) / 100;
    return rounded.toString();
  }
  
  if (whole === 0) {
    return closestFrac;
  }
  return `${whole} ${closestFrac}`;
}

// Parse quantity from start of ingredient string
// Returns { quantity: number|null, rest: string, original: string, isRange: boolean, rangeEnd: number|null }
function parseIngredientQuantity(ingredient) {
  const trimmed = ingredient.trim();
  
  // Pattern for ranges: "2-3", "2 - 3", "2 to 3"
  const rangePattern = /^(\d+\s*\d*\/?\d*)\s*[-–—]\s*(\d+\s*\d*\/?\d*)\s+/;
  const rangeMatch = trimmed.match(rangePattern);
  
  if (rangeMatch) {
    const startQty = parseQuantityValue(rangeMatch[1].trim());
    const endQty = parseQuantityValue(rangeMatch[2].trim());
    const rest = trimmed.slice(rangeMatch[0].length);
    return {
      quantity: startQty,
      rangeEnd: endQty,
      isRange: true,
      rest: rest,
      original: ingredient
    };
  }
  
  // Pattern for "2 (15 oz) cans" - capture leading number, preserve parenthetical
  const parenPattern = /^(\d+\s*\d*\/?\d*)\s+(\([^)]+\)\s+.+)$/;
  const parenMatch = trimmed.match(parenPattern);
  
  if (parenMatch) {
    const qty = parseQuantityValue(parenMatch[1].trim());
    return {
      quantity: qty,
      rangeEnd: null,
      isRange: false,
      rest: parenMatch[2],
      original: ingredient
    };
  }
  
  // Pattern for mixed numbers: "1 1/2 cups"
  const mixedPattern = /^(\d+)\s+(\d+\/\d+)\s+/;
  const mixedMatch = trimmed.match(mixedPattern);
  
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const frac = parseFraction(mixedMatch[2]);
    const rest = trimmed.slice(mixedMatch[0].length);
    return {
      quantity: whole + frac,
      rangeEnd: null,
      isRange: false,
      rest: rest,
      original: ingredient
    };
  }
  
  // Pattern for simple fractions: "1/2 cup"
  const fracPattern = /^(\d+\/\d+)\s+/;
  const fracMatch = trimmed.match(fracPattern);
  
  if (fracMatch) {
    const qty = parseFraction(fracMatch[1]);
    const rest = trimmed.slice(fracMatch[0].length);
    return {
      quantity: qty,
      rangeEnd: null,
      isRange: false,
      rest: rest,
      original: ingredient
    };
  }
  
  // Pattern for whole numbers: "2 cups"
  const wholePattern = /^(\d+(?:\.\d+)?)\s+/;
  const wholeMatch = trimmed.match(wholePattern);
  
  if (wholeMatch) {
    const qty = parseFloat(wholeMatch[1]);
    const rest = trimmed.slice(wholeMatch[0].length);
    return {
      quantity: qty,
      rangeEnd: null,
      isRange: false,
      rest: rest,
      original: ingredient
    };
  }
  
  // No quantity found - return original unchanged
  return {
    quantity: null,
    rangeEnd: null,
    isRange: false,
    rest: trimmed,
    original: ingredient
  };
}

// Helper to parse a quantity value (handles mixed numbers and fractions)
function parseQuantityValue(str) {
  const trimmed = str.trim();
  
  // Mixed number: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseFraction(mixedMatch[2]);
  }
  
  // Fraction: "1/2"
  if (trimmed.includes('/')) {
    return parseFraction(trimmed);
  }
  
  // Whole number
  return parseFloat(trimmed);
}

// Scale an ingredient based on the scaling factor
function scaleIngredient(ingredient, scaleFactor) {
  const parsed = parseIngredientQuantity(ingredient);
  
  // No quantity found - return unchanged
  if (parsed.quantity === null) {
    return ingredient;
  }
  
  const scaledQty = parsed.quantity * scaleFactor;
  
  if (parsed.isRange && parsed.rangeEnd !== null) {
    const scaledEnd = parsed.rangeEnd * scaleFactor;
    return `${decimalToFraction(scaledQty)}-${decimalToFraction(scaledEnd)} ${parsed.rest}`;
  }
  
  return `${decimalToFraction(scaledQty)} ${parsed.rest}`;
}

// Parse servings from recipe (handles "4", "4 servings", "serves 4", etc.)
function parseServingsValue(servingsStr) {
  if (!servingsStr) return null;
  
  const str = servingsStr.toString().toLowerCase();
  const match = str.match(/(\d+)/);
  
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

// Initialize scaling for a recipe
function initScaling(recipe) {
  originalIngredients = recipe.ingredients || [];
  originalServings = parseServingsValue(recipe.servings) || 4; // Default to 4 if not specified
  currentServings = originalServings;
}

// Update the displayed ingredients based on current scaling
function updateScaledIngredients() {
  const scaleFactor = currentServings / originalServings;
  const isScaled = currentServings !== originalServings;
  
  const list = document.getElementById('ingredient-list');
  if (!list) return;
  
  list.innerHTML = originalIngredients.map((ing, i) => {
    const scaledIng = scaleIngredient(ing, scaleFactor);
    return `
      <li onclick="this.classList.toggle('checked')">
        <input type="checkbox" id="ing-${i}">
        <span class="text">${scaledIng}</span>
      </li>
    `;
  }).join('');
  
  // Update scale indicator
  const indicator = document.getElementById('scale-indicator');
  if (indicator) {
    if (isScaled) {
      indicator.style.display = 'inline-flex';
      indicator.textContent = `${scaleFactor.toFixed(2)}x`;
    } else {
      indicator.style.display = 'none';
    }
  }
  
  // Update servings display
  const servingsDisplay = document.getElementById('current-servings');
  if (servingsDisplay) {
    servingsDisplay.textContent = currentServings;
  }
}

// Adjust servings by delta
function adjustServings(delta) {
  const newServings = currentServings + delta;
  if (newServings >= 1 && newServings <= 100) {
    currentServings = newServings;
    // Update the input display
    const input = document.getElementById('servings-input');
    if (input) {
      input.value = currentServings;
    }
    updateScaledIngredients();
  }
}

// Set servings to specific value
function setServings(value) {
  const newServings = parseInt(value);
  if (newServings >= 1 && newServings <= 100) {
    currentServings = newServings;
    updateScaledIngredients();
  }
}

// Reset to original servings
function resetServings() {
  currentServings = originalServings;
  updateScaledIngredients();
  
  // Reset the input if it exists
  const input = document.getElementById('servings-input');
  if (input) {
    input.value = originalServings;
  }
}

// Generate scaling controls HTML
function renderScalingControls() {
  return `
    <div class="scaling-controls">
      <div class="scaling-header">
        <span class="scaling-label">Servings</span>
        <span id="scale-indicator" class="scale-indicator" style="display: none;">1x</span>
      </div>
      <div class="scaling-buttons">
        <button type="button" class="scaling-btn" onclick="adjustServings(-1)" aria-label="Decrease servings">−</button>
        <input type="number" id="servings-input" class="servings-input" value="${originalServings}" min="1" max="100" onchange="setServings(this.value)">
        <button type="button" class="scaling-btn" onclick="adjustServings(1)" aria-label="Increase servings">+</button>
      </div>
      <button type="button" class="scaling-reset" onclick="resetServings()">Reset to original (${originalServings})</button>
    </div>
  `;
}

// Global state for recipes (used by search)
let allRecipesCache = [];
let currentFilter = 'all'; // 'all' or 'favorites'
let currentTagFilter = null; // Active tag filter
let allTagsCache = []; // Cache for all tags

// Recipe Functions
async function loadRecentRecipes() {
  const container = document.getElementById('recent-recipes');
  try {
    const result = await api('/recipes');
    
    if (!result.success || result.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">📖</div><p>No recipes yet. Import your first recipe above!</p></div>';
      return;
    }
    
    const recipes = result.data.slice(0, 6);
    container.innerHTML = recipes.map(renderRecipeCard).join('');
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load recipes. Please refresh the page.</div>';
  }
}

// =====================
// Recently Viewed Recipes
// =====================

const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_RECENTLY_VIEWED = 10;
const DISPLAY_RECENTLY_VIEWED = 5;

function trackRecipeView(slug) {
  try {
    let recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    
    // Remove existing entry for this slug (to avoid duplicates)
    recentlyViewed = recentlyViewed.filter(item => item.slug !== slug);
    
    // Add new entry at the beginning
    recentlyViewed.unshift({
      slug: slug,
      timestamp: Date.now()
    });
    
    // Limit to MAX_RECENTLY_VIEWED items
    recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
  } catch (err) {
    console.error('Error tracking recipe view:', err);
  }
}

async function loadRecentlyViewed() {
  const section = document.getElementById('recently-viewed-section');
  const container = document.getElementById('recently-viewed');
  
  if (!section || !container) return;
  
  try {
    const recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    
    if (recentlyViewed.length === 0) {
      section.classList.add('hidden');
      return;
    }
    
    // Get the slugs to display (up to DISPLAY_RECENTLY_VIEWED)
    const slugsToFetch = recentlyViewed.slice(0, DISPLAY_RECENTLY_VIEWED).map(item => item.slug);
    
    // Fetch recipe data for each slug
    const recipePromises = slugsToFetch.map(slug => api(`/recipes/${slug}`));
    const results = await Promise.all(recipePromises);
    
    // Filter successful results and render
    const recipes = results
      .filter(result => result.success)
      .map(result => result.data);
    
    if (recipes.length === 0) {
      section.classList.add('hidden');
      return;
    }
    
    container.innerHTML = recipes.map(renderRecipeCard).join('');
    section.classList.remove('hidden');
  } catch (err) {
    console.error('Error loading recently viewed:', err);
    section.classList.add('hidden');
  }
}

function clearRecentlyViewed() {
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
  const section = document.getElementById('recently-viewed-section');
  if (section) {
    section.classList.add('hidden');
  }
  showToast('Recently viewed history cleared', 'success');
}

async function loadAllRecipes() {
  const container = document.getElementById('recipes-list');
  try {
    const result = await api('/recipes');
    
    if (!result.success || result.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">📖</div><p>No recipes yet. Import your first recipe above!</p></div>';
      allRecipesCache = [];
      return;
    }
    
    allRecipesCache = result.data;
    container.innerHTML = result.data.map(renderRecipeCard).join('');
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load recipes. Please refresh the page.</div>';
  }
}

// Search & Filter
function setupRecipeSearch() {
  const searchInput = document.getElementById('recipe-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterRecipes(query);
  });
}

function setFilter(filter) {
  currentFilter = filter;
  
  // Update button states for All/Favorites
  document.querySelectorAll('.filter-bar .filter-btn').forEach(btn => {
    const btnText = btn.textContent.toLowerCase();
    if ((filter === 'all' && btnText.includes('all')) ||
        (filter === 'favorites' && btnText.includes('favorites'))) {
      btn.classList.add('active');
    } else if (!btn.href) { // Don't remove active from link buttons
      btn.classList.remove('active');
    }
  });
  
  // Re-apply search with new filter
  const searchInput = document.getElementById('recipe-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  filterRecipes(query);
}

function filterRecipes(query) {
  const container = document.getElementById('recipes-list');
  
  // Start with all recipes or just favorites
  let recipes = currentFilter === 'favorites' 
    ? allRecipesCache.filter(r => r.favorite)
    : allRecipesCache;
  
  // Apply tag filter
  if (currentTagFilter) {
    recipes = recipes.filter(recipe => 
      recipe.tags && 
      recipe.tags.some(tag => tag.toLowerCase() === currentTagFilter.toLowerCase())
    );
  }
  
  // Apply search query
  if (query) {
    recipes = recipes.filter(recipe => {
      if (recipe.title && recipe.title.toLowerCase().includes(query)) return true;
      if (recipe.description && recipe.description.toLowerCase().includes(query)) return true;
      if (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query))) return true;
      if (recipe.ingredients && recipe.ingredients.some(ing => ing.toLowerCase().includes(query))) return true;
      return false;
    });
  }
  
  if (recipes.length === 0) {
    let message = 'No recipes found matching your criteria.';
    if (currentFilter === 'favorites' && !query && !currentTagFilter) {
      message = 'No favorite recipes yet. Click the ☆ on a recipe to add it to favorites.';
    } else if (currentTagFilter && !query) {
      message = `No recipes found with tag "${currentTagFilter}".`;
    }
    container.innerHTML = `<div class="no-results">${message}</div>`;
  } else {
    container.innerHTML = recipes.map(renderRecipeCard).join('');
  }
}

function renderRecipeCard(recipe) {
  const image = recipe.image 
    ? `<img src="${recipe.image}" alt="${recipe.title}">`
    : '🍽️';
  
  // Generate slug from title if not provided
  const slug = recipe.slug || recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Render tags with click handlers
  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return '';
    return `
      <div class="tags" onclick="event.preventDefault(); event.stopPropagation();">
        ${tags.slice(0, 3).map(tag => 
          `<span class="tag tag-clickable ${currentTagFilter && currentTagFilter.toLowerCase() === tag.toLowerCase() ? 'tag-active' : ''}" 
                 onclick="setTagFilter('${tag.replace(/'/g, "\\'")}')">${tag}</span>`
        ).join('')}
      </div>
    `;
  };
  
  return `
    <div class="recipe-card card">
      <a href="/recipe.html?slug=${slug}" class="card-link">
        <div class="card-image">${image}</div>
        <div class="card-body">
          <h3 class="card-title">${recipe.title}</h3>
          <div class="meta">
            ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime}</span>` : ''}
            ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime}</span>` : ''}
            ${recipe.servings ? `<span>👥 ${recipe.servings}</span>` : ''}
          </div>
          ${renderTags(recipe.tags)}
        </div>
      </a>
      <button class="favorite-btn ${recipe.favorite ? 'active' : ''}" onclick="toggleFavorite('${slug}', event)" title="${recipe.favorite ? 'Remove from favorites' : 'Add to favorites'}">
        ${recipe.favorite ? '★' : '☆'}
      </button>
    </div>
  `;
}

// =====================
// Tag Filtering System
// =====================

// Load and render tag cloud
async function loadTagCloud() {
  const container = document.getElementById('tag-cloud');
  if (!container) return;
  
  try {
    const result = await api('/recipes/tags');
    if (!result.success || result.data.length === 0) {
      container.innerHTML = '<span class="no-tags">No tags yet</span>';
      allTagsCache = [];
      return;
    }
    
    allTagsCache = result.data;
    renderTagCloud();
  } catch (err) {
    container.innerHTML = '<span class="no-tags">Failed to load tags</span>';
  }
}

// Render the tag cloud with current state
function renderTagCloud() {
  const container = document.getElementById('tag-cloud');
  if (!container || allTagsCache.length === 0) return;
  
  container.innerHTML = allTagsCache.map(({ tag, count }) => `
    <button class="tag-pill ${currentTagFilter && currentTagFilter.toLowerCase() === tag.toLowerCase() ? 'tag-pill-active' : ''}" 
            onclick="setTagFilter('${tag.replace(/'/g, "\\'")}')">
      ${tag} <span class="tag-count">(${count})</span>
    </button>
  `).join('');
}

// Set tag filter
function setTagFilter(tag) {
  // Toggle off if clicking the same tag
  if (currentTagFilter && currentTagFilter.toLowerCase() === tag.toLowerCase()) {
    clearTagFilter();
    return;
  }
  
  currentTagFilter = tag;
  
  // Update tag cloud UI
  renderTagCloud();
  
  // Show clear button
  const clearBtn = document.getElementById('clear-tag-filter');
  if (clearBtn) {
    clearBtn.classList.remove('hidden');
  }
  
  // Re-apply filters
  const searchInput = document.getElementById('recipe-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  filterRecipes(query);
}

// Clear tag filter
function clearTagFilter() {
  currentTagFilter = null;
  
  // Update tag cloud UI
  renderTagCloud();
  
  // Hide clear button
  const clearBtn = document.getElementById('clear-tag-filter');
  if (clearBtn) {
    clearBtn.classList.add('hidden');
  }
  
  // Re-apply filters
  const searchInput = document.getElementById('recipe-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  filterRecipes(query);
}

// =====================
// Tag Management Functions
// =====================

// Load all tags for management page
async function loadTagsManagement() {
  const container = document.getElementById('tags-list');
  if (!container) return;
  
  try {
    const result = await api('/recipes/tags');
    if (!result.success || result.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">🏷️</div><p>No tags yet. Add tags to your recipes to organize them!</p></div>';
      return;
    }
    
    container.innerHTML = result.data.map(({ tag, count }) => `
      <div class="tag-management-item" data-tag="${tag}">
        <div class="tag-info">
          <span class="tag-name">${tag}</span>
          <span class="tag-recipe-count">${count} recipe${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="tag-actions">
          <button class="btn btn-small btn-secondary" onclick="showRenameTagModal('${tag.replace(/'/g, "\\'")}')">Rename</button>
          <button class="btn btn-small btn-secondary" onclick="viewRecipesWithTag('${tag.replace(/'/g, "\\'")}')">View Recipes</button>
          <button class="btn btn-small btn-danger" onclick="confirmDeleteTag('${tag.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load tags. Please refresh the page.</div>';
  }
}

// View recipes with a specific tag
function viewRecipesWithTag(tag) {
  window.location.href = `/recipes.html?tag=${encodeURIComponent(tag)}`;
}

// Show rename tag modal
function showRenameTagModal(tag) {
  const newName = prompt(`Rename tag "${tag}" to:`, tag);
  if (newName && newName.trim() && newName.trim() !== tag) {
    renameTag(tag, newName.trim());
  }
}

// Rename a tag
async function renameTag(oldTag, newTag) {
  try {
    const result = await api(`/recipes/tags/${encodeURIComponent(oldTag)}`, {
      method: 'PUT',
      body: { newTag }
    });
    
    if (result.success) {
      showMessage(`Tag renamed! Updated ${result.data.updatedCount} recipe(s).`, 'success');
      loadTagsManagement();
    } else {
      showMessage(result.error || 'Failed to rename tag', 'error');
    }
  } catch (err) {
    showMessage('Failed to rename tag. Please try again.', 'error');
  }
}

// Confirm delete tag
function confirmDeleteTag(tag) {
  if (confirm(`Delete tag "${tag}" from all recipes? This cannot be undone.`)) {
    deleteTagFromAll(tag);
  }
}

// Delete a tag from all recipes
async function deleteTagFromAll(tag) {
  try {
    const result = await api(`/recipes/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      showMessage(`Tag deleted! Removed from ${result.data.updatedCount} recipe(s).`, 'success');
      loadTagsManagement();
    } else {
      showMessage(result.error || 'Failed to delete tag', 'error');
    }
  } catch (err) {
    showMessage('Failed to delete tag. Please try again.', 'error');
  }
}

// Show message on tag management page
function showMessage(text, type) {
  const container = document.getElementById('tag-message');
  if (container) {
    container.innerHTML = `<div class="message message-${type}">${text}</div>`;
    setTimeout(() => {
      container.innerHTML = '';
    }, 3000);
  }
}

// Check URL params for tag filter on page load
function checkUrlTagFilter() {
  const params = new URLSearchParams(window.location.search);
  const tag = params.get('tag');
  if (tag) {
    // Wait for recipes and tags to load, then apply filter
    setTimeout(() => {
      setTagFilter(tag);
    }, 100);
  }
}

async function toggleFavorite(slug, event) {
  event.preventDefault();
  event.stopPropagation();
  
  try {
    const result = await api(`/recipes/${slug}/favorite`, { method: 'PATCH' });
    if (result.success) {
      // Update cache
      const recipe = allRecipesCache.find(r => r.slug === slug);
      if (recipe) {
        recipe.favorite = result.data.favorite;
      }
      // Re-render with current search
      const searchInput = document.getElementById('recipe-search');
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      filterRecipes(query);
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
  }
}

async function loadRecipe(slug) {
  const container = document.getElementById('recipe-content');
  const result = await api(`/recipes/${slug}`);
  
  if (!result.success) {
    container.innerHTML = `<div class="message message-error">${result.error || 'Recipe not found'}</div>`;
    return;
  }
  
  const recipe = result.data;
  document.title = `${recipe.title} - Recipe Keeper`;
  
  // Track this recipe view
  trackRecipeView(slug);
  
  // Initialize scaling system
  initScaling(recipe);
  
  // Load collections for this recipe
  const collectionsResult = await api(`/collections/for-recipe/${slug}`);
  const recipeCollections = collectionsResult.success ? collectionsResult.data : [];
  
  const image = recipe.image 
    ? `<img src="${recipe.image}" alt="${recipe.title}">`
    : '<div style="font-size: 6rem; color: #ccc;">🍽️</div>';
  
  container.innerHTML = `
    <div class="recipe-header">
      <div class="hero-image">${image}</div>
      <div class="hero-content">
        <h1>${recipe.title}</h1>
        ${recipe.description ? `<p class="text-muted">${recipe.description}</p>` : ''}
        <div class="recipe-meta">
          ${recipe.prepTime ? `<div class="meta-item"><div class="label">Prep</div><div class="value">${recipe.prepTime}</div></div>` : ''}
          ${recipe.cookTime ? `<div class="meta-item"><div class="label">Cook</div><div class="value">${recipe.cookTime}</div></div>` : ''}
          ${recipe.totalTime ? `<div class="meta-item"><div class="label">Total</div><div class="value">${recipe.totalTime}</div></div>` : ''}
          ${recipe.servings ? `<div class="meta-item"><div class="label">Servings</div><div class="value">${recipe.servings}</div></div>` : ''}
        </div>
        ${recipe.tags && recipe.tags.length > 0 ? `
          <div class="tags">
            ${recipe.tags.map(tag => `<span class="tag tag-primary">${tag}</span>`).join('')}
          </div>
        ` : ''}
        ${renderRecipeCollectionsSection(slug, recipeCollections)}
      </div>
    </div>

    <div class="two-col">
      <div>
        <div class="card">
          <div class="card-body">
            <div class="ingredients-header">
              <h2>Ingredients</h2>
            </div>
            ${renderScalingControls()}
            <ul class="ingredient-list" id="ingredient-list">
              ${(recipe.ingredients || []).map((ing, i) => `
                <li onclick="this.classList.toggle('checked')">
                  <input type="checkbox" id="ing-${i}">
                  <span class="text">${ing}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-body instructions">
            <h2>Instructions</h2>
            <ol>
              ${(recipe.instructions || []).map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        </div>

        ${recipe.notes ? `
          <div class="card mt-2">
            <div class="card-body">
              <h2>Notes</h2>
              <p>${recipe.notes}</p>
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="rating-notes-section">
      <div class="card">
        <div class="card-body">
          <div class="rating-container">
            <h3>My Rating</h3>
            <div class="star-rating" data-slug="${slug}" data-rating="${recipe.rating || 0}">
              ${renderStars(recipe.rating || 0, slug)}
            </div>
          </div>
          <div class="notes-container">
            <h3>My Notes</h3>
            <textarea id="personal-notes" class="form-input" rows="4" placeholder="Add your personal notes about this recipe...">${recipe.personalNotes || ''}</textarea>
            <button onclick="savePersonalNotes('${slug}')" class="btn btn-primary btn-small mt-1" id="save-notes-btn">Save Notes</button>
            <span id="notes-status" class="notes-status"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions-bar">
      <button onclick="startCookMode('${slug}')" class="btn btn-cook-mode">👨‍🍳 Start Cooking</button>
      <button onclick="toggleFavoriteDetail('${slug}')" class="btn ${recipe.favorite ? 'btn-primary' : 'btn-secondary'}" id="favorite-btn">
        ${recipe.favorite ? '★ Favorited' : '☆ Add to Favorites'}
      </button>
      <a href="/edit-recipe.html?slug=${slug}" class="btn btn-secondary">✏️ Edit Recipe</a>
      <button onclick="window.print()" class="btn btn-secondary print-btn">🖨️ Print Recipe</button>
      ${recipe.source ? `<a href="${recipe.source}" target="_blank" class="btn btn-secondary">View Original →</a>` : ''}
      <button onclick="deleteRecipe('${slug}')" class="btn btn-danger">Delete Recipe</button>
    </div>
  `;
}

async function toggleFavoriteDetail(slug) {
  try {
    const result = await api(`/recipes/${slug}/favorite`, { method: 'PATCH' });
    if (result.success) {
      const btn = document.getElementById('favorite-btn');
      if (result.data.favorite) {
        btn.className = 'btn btn-primary';
        btn.innerHTML = '★ Favorited';
      } else {
        btn.className = 'btn btn-secondary';
        btn.innerHTML = '☆ Add to Favorites';
      }
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
  }
}

// Star Rating Functions
function renderStars(rating, slug) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    html += `<span class="star ${filled ? 'filled' : ''}" data-value="${i}" onclick="setRating('${slug}', ${i})">★</span>`;
  }
  return html;
}

async function setRating(slug, rating) {
  try {
    const result = await api(`/recipes/${slug}/rating`, { 
      method: 'PATCH',
      body: { rating }
    });
    if (result.success) {
      // Update star display
      const container = document.querySelector('.star-rating');
      container.dataset.rating = rating;
      container.innerHTML = renderStars(rating, slug);
    }
  } catch (err) {
    console.error('Failed to set rating:', err);
  }
}

// Personal Notes Functions
async function savePersonalNotes(slug) {
  const textarea = document.getElementById('personal-notes');
  const btn = document.getElementById('save-notes-btn');
  const status = document.getElementById('notes-status');
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  status.textContent = '';
  
  try {
    const result = await api(`/recipes/${slug}/notes`, {
      method: 'PATCH',
      body: { personalNotes: textarea.value }
    });
    if (result.success) {
      status.textContent = '✓ Saved';
      status.className = 'notes-status success';
      setTimeout(() => { status.textContent = ''; }, 2000);
    } else {
      status.textContent = 'Failed to save';
      status.className = 'notes-status error';
    }
  } catch (err) {
    console.error('Failed to save notes:', err);
    status.textContent = 'Failed to save';
    status.className = 'notes-status error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Notes';
  }
}

async function deleteRecipe(slug) {
  if (!confirm('Are you sure you want to delete this recipe?')) return;
  
  const result = await api(`/recipes/${slug}`, { method: 'DELETE' });
  
  if (result.success) {
    showToast('Recipe deleted successfully', 'success');
    setTimeout(() => {
      window.location.href = '/recipes.html';
    }, 500);
  } else {
    showToast(result.error || 'Failed to delete recipe', 'error');
  }
}

// Import Form
function setupImportForm() {
  const form = document.getElementById('import-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlInput = document.getElementById('recipe-url');
    const btn = document.getElementById('import-btn');
    const messageDiv = document.getElementById('import-message');
    
    const url = urlInput.value.trim();
    if (!url) return;
    
    btn.disabled = true;
    btn.textContent = 'Importing...';
    messageDiv.className = 'mt-1 hidden';
    
    try {
      const result = await api('/scrape', {
        method: 'POST',
        body: { url }
      });
      
      if (result.success) {
        messageDiv.className = 'mt-1 message message-success';
        messageDiv.textContent = `Successfully imported "${result.data.title}"!`;
        urlInput.value = '';
        
        // Redirect to the new recipe after a short delay
        setTimeout(() => {
          window.location.href = `/recipe.html?slug=${result.data.slug}`;
        }, 1000);
      } else {
        messageDiv.className = 'mt-1 message message-error';
        messageDiv.textContent = result.error || 'Failed to import recipe';
      }
    } catch (err) {
      messageDiv.className = 'mt-1 message message-error';
      messageDiv.textContent = 'Network error. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Import Recipe';
    }
  });
}

// Shopping List Functions
// Global state for shopping list
let currentListId = null;
let currentListData = null;
let collapsedCategories = new Set();

async function loadShoppingLists() {
  const container = document.getElementById('lists-container');
  try {
    const result = await api('/shopping-lists');
    
    if (!result.success || result.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <p>No shopping lists yet.</p>
          <a href="/shopping-list-new.html" class="btn btn-primary mt-2">Create Your First List</a>
        </div>
      `;
      return;
    }
  
    container.innerHTML = result.data.map(list => {
      const total = list.items.length;
      const checked = list.items.filter(i => i.checked).length;
      const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
      
      return `
        <a href="/shopping-list.html?id=${list.id}" class="shopping-list-card card">
          <div class="card-body">
            <h3 class="card-title">${list.name}</h3>
            <div class="meta">${total} items · ${checked} completed</div>
            <div class="progress-bar">
              <div class="fill" style="width: ${percent}%"></div>
            </div>
          </div>
        </a>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load shopping lists. Please refresh the page.</div>';
  }
}

async function loadShoppingList(id) {
  const container = document.getElementById('list-content');
  currentListId = id;
  
  const result = await api(`/shopping-lists/${id}`);
  
  if (!result.success) {
    container.innerHTML = `<div class="message message-error">${result.error || 'Shopping list not found'}</div>`;
    return;
  }
  
  const list = result.data;
  currentListData = list;
  document.title = `${list.name} - Recipe Keeper`;
  
  // Calculate completion stats
  const allItems = list.processedItems || list.items || [];
  const total = allItems.length;
  const checked = allItems.filter(i => i.checked).length;
  
  // Use grouped items for display
  const groupedItems = list.groupedItems || [];
  
  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <div class="shopping-list-header">
          <h1>${list.name}</h1>
          <span class="completion-badge">${checked}/${total} completed</span>
        </div>
        
        <!-- Custom Item Input -->
        <div class="custom-item-form">
          <div class="custom-item-input-group">
            <input type="text" id="custom-item-input" class="form-input" placeholder="Add custom item (e.g., paper towels, dish soap)">
            <button onclick="addCustomItem('${id}')" class="btn btn-primary">+ Add</button>
          </div>
        </div>
        
        <div id="items-list">
          ${groupedItems.length > 0 ? groupedItems.map(group => renderCategoryGroup(id, group)).join('') : '<p class="text-muted text-center">No items in this list.</p>'}
        </div>
        
        <div class="actions-bar">
          <button onclick="clearCheckedItems('${id}')" class="btn btn-secondary">Clear Checked Items</button>
          <button onclick="deleteShoppingList('${id}')" class="btn btn-danger">Delete List</button>
        </div>
      </div>
    </div>
  `;
  
  // Setup custom item input enter key
  const customInput = document.getElementById('custom-item-input');
  if (customInput) {
    customInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomItem(id);
      }
    });
  }
}

function renderCategoryGroup(listId, group) {
  const isCollapsed = collapsedCategories.has(group.category);
  const checkedCount = group.items.filter(i => i.checked).length;
  const totalCount = group.items.length;
  const allChecked = checkedCount === totalCount;
  
  return `
    <div class="category-group ${isCollapsed ? 'collapsed' : ''}" data-category="${group.category}">
      <div class="category-header" onclick="toggleCategory('${group.category}')">
        <div class="category-title">
          <span class="category-icon">${group.icon}</span>
          <span class="category-name">${group.displayName}</span>
          <span class="category-count ${allChecked ? 'complete' : ''}">${checkedCount}/${totalCount}</span>
        </div>
        <span class="category-toggle">${isCollapsed ? '▶' : '▼'}</span>
      </div>
      <ul class="checkbox-list category-items" style="${isCollapsed ? 'display: none;' : ''}">
        ${group.items.map(item => renderShoppingItem(listId, item)).join('')}
      </ul>
    </div>
  `;
}

function toggleCategory(category) {
  if (collapsedCategories.has(category)) {
    collapsedCategories.delete(category);
  } else {
    collapsedCategories.add(category);
  }
  
  const group = document.querySelector(`.category-group[data-category="${category}"]`);
  if (group) {
    group.classList.toggle('collapsed');
    const items = group.querySelector('.category-items');
    const toggle = group.querySelector('.category-toggle');
    if (items) {
      items.style.display = items.style.display === 'none' ? '' : 'none';
    }
    if (toggle) {
      toggle.textContent = collapsedCategories.has(category) ? '▶' : '▼';
    }
  }
}

function renderShoppingItem(listId, item) {
  const sourceInfo = item.sources && item.sources.length > 1 
    ? ` <span class="item-sources">(from ${item.sources.length} recipes)</span>`
    : item.recipeTitle && !item.isCustom
    ? ` <span class="item-source">from ${item.recipeTitle}</span>`
    : '';
  
  const customBadge = item.isCustom ? '<span class="custom-badge">custom</span>' : '';
  
  return `
    <li class="shopping-item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
      <input type="checkbox" 
             ${item.checked ? 'checked' : ''} 
             onchange="toggleShoppingItem('${listId}', '${item.id}', this.checked)">
      <span class="item-name">${item.name}</span>
      ${customBadge}
      ${sourceInfo}
      ${item.isCustom ? `<button class="item-delete-btn" onclick="deleteShoppingItem('${listId}', '${item.id}')" title="Remove item">×</button>` : ''}
    </li>
  `;
}

async function addCustomItem(listId) {
  const input = document.getElementById('custom-item-input');
  const itemName = input.value.trim();
  
  if (!itemName) return;
  
  try {
    const result = await api(`/shopping-lists/${listId}/custom-item`, {
      method: 'POST',
      body: { itemName }
    });
    
    if (result.success) {
      input.value = '';
      showToast('Item added to list', 'success');
      loadShoppingList(listId);
    } else {
      showToast(result.error || 'Failed to add item', 'error');
    }
  } catch (err) {
    console.error('Failed to add custom item:', err);
    showToast('Failed to add item', 'error');
  }
}

async function deleteShoppingItem(listId, itemId) {
  try {
    const result = await api(`/shopping-lists/${listId}/item/${itemId}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      loadShoppingList(listId);
    }
  } catch (err) {
    console.error('Failed to delete item:', err);
  }
}

async function toggleShoppingItem(listId, itemId, checked) {
  // Update UI immediately for responsiveness
  const itemEl = document.querySelector(`[data-item-id="${itemId}"]`);
  if (itemEl) {
    itemEl.classList.toggle('checked', checked);
    const nameEl = itemEl.querySelector('.item-name');
    if (nameEl) {
      nameEl.style.textDecoration = checked ? 'line-through' : 'none';
      nameEl.style.color = checked ? '#999' : '';
    }
  }
  
  // Get raw list data to update the actual item
  const rawResult = await api(`/shopping-lists/${listId}/raw`);
  if (!rawResult.success) return;
  
  const list = rawResult.data;
  const item = list.items.find(i => i.id === itemId);
  if (item) {
    item.checked = checked;
  }
  
  await api(`/shopping-lists/${listId}`, {
    method: 'PUT',
    body: { items: list.items }
  });
  
  // Update the counter
  updateCompletionCounter();
}

function updateCompletionCounter() {
  const items = document.querySelectorAll('.shopping-item');
  const total = items.length;
  const checked = document.querySelectorAll('.shopping-item.checked').length;
  
  const counter = document.querySelector('.completion-badge');
  if (counter) {
    counter.textContent = `${checked}/${total} completed`;
  }
  
  // Update category counts
  document.querySelectorAll('.category-group').forEach(group => {
    const categoryItems = group.querySelectorAll('.shopping-item');
    const categoryTotal = categoryItems.length;
    const categoryChecked = group.querySelectorAll('.shopping-item.checked').length;
    const countEl = group.querySelector('.category-count');
    if (countEl) {
      countEl.textContent = `${categoryChecked}/${categoryTotal}`;
      countEl.classList.toggle('complete', categoryChecked === categoryTotal);
    }
  });
}

async function clearCheckedItems(listId) {
  if (!confirm('Remove all checked items from the list?')) return;
  
  const rawResult = await api(`/shopping-lists/${listId}/raw`);
  if (!rawResult.success) return;
  
  const list = rawResult.data;
  const unchecked = list.items.filter(i => !i.checked);
  
  await api(`/shopping-lists/${listId}`, {
    method: 'PUT',
    body: { items: unchecked }
  });
  
  loadShoppingList(listId);
}

async function deleteShoppingList(id) {
  if (!confirm('Are you sure you want to delete this shopping list?')) return;
  
  const result = await api(`/shopping-lists/${id}`, { method: 'DELETE' });
  
  if (result.success) {
    showToast('Shopping list deleted', 'success');
    setTimeout(() => {
      window.location.href = '/shopping-lists.html';
    }, 500);
  } else {
    showToast(result.error || 'Failed to delete shopping list', 'error');
  }
}

// Create Shopping List Form
async function loadRecipesForSelection() {
  const container = document.getElementById('recipe-selection');
  const result = await api('/recipes');
  
  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<p class="text-muted">No recipes available. Import some recipes first!</p>';
    return;
  }
  
  container.innerHTML = result.data.map(recipe => `
    <label class="recipe-select-item">
      <input type="checkbox" name="recipes" value="${recipe.slug}" onchange="this.parentElement.classList.toggle('selected', this.checked)">
      <strong>${recipe.title}</strong>
      ${recipe.ingredients ? `<div class="text-muted" style="font-size: 0.875rem;">${recipe.ingredients.length} ingredients</div>` : ''}
    </label>
  `).join('');
}

function setupCreateListForm() {
  const form = document.getElementById('create-list-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('list-name');
    const btn = document.getElementById('create-btn');
    const messageDiv = document.getElementById('create-message');
    
    const name = nameInput.value.trim();
    if (!name) return;
    
    const selectedRecipes = Array.from(document.querySelectorAll('input[name="recipes"]:checked'))
      .map(input => input.value);
    
    btn.disabled = true;
    btn.textContent = 'Creating...';
    messageDiv.className = 'mt-2 hidden';
    
    try {
      // Create the list
      const createResult = await api('/shopping-lists', {
        method: 'POST',
        body: { name }
      });
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create list');
      }
      
      const listId = createResult.data.id;
      
      // Add recipes to the list
      for (const slug of selectedRecipes) {
        await api(`/shopping-lists/${listId}/add-recipe`, {
          method: 'POST',
          body: { recipeSlug: slug }
        });
      }
      
      // Redirect to the new list
      window.location.href = `/shopping-list.html?id=${listId}`;
    } catch (err) {
      messageDiv.className = 'mt-2 message message-error';
      messageDiv.textContent = err.message || 'Failed to create shopping list';
      btn.disabled = false;
      btn.textContent = 'Create Shopping List';
    }
  });
}

// Add Recipe Form
function setupAddRecipeForm() {
  const form = document.getElementById('add-recipe-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('save-btn');
    const messageDiv = document.getElementById('form-message');
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const prepTime = document.getElementById('prepTime').value.trim();
    const cookTime = document.getElementById('cookTime').value.trim();
    const servings = document.getElementById('servings').value.trim();
    const tagsInput = document.getElementById('tags').value.trim();
    const source = document.getElementById('source').value.trim();
    const image = document.getElementById('image').value.trim();
    const ingredientsText = document.getElementById('ingredients').value.trim();
    const instructionsText = document.getElementById('instructions').value.trim();
    
    // Client-side validation
    if (!title) {
      showFormMessage(messageDiv, 'Please enter a recipe title.', 'error');
      return;
    }
    
    if (!ingredientsText) {
      showFormMessage(messageDiv, 'Please enter at least one ingredient.', 'error');
      return;
    }
    
    if (!instructionsText) {
      showFormMessage(messageDiv, 'Please enter at least one instruction.', 'error');
      return;
    }
    
    // Parse ingredients and instructions (one per line)
    const ingredients = ingredientsText.split('\n').map(line => line.trim()).filter(Boolean);
    const instructions = instructionsText.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Parse tags (comma separated)
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    messageDiv.className = 'mt-1 hidden';
    
    try {
      const result = await api('/recipes', {
        method: 'POST',
        body: {
          title,
          description,
          prepTime,
          cookTime,
          servings,
          tags,
          source,
          image,
          ingredients,
          instructions
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save recipe');
      }
      
      // Redirect to the new recipe page
      window.location.href = `/recipe.html?slug=${result.data.slug}`;
    } catch (err) {
      showFormMessage(messageDiv, err.message || 'Failed to save recipe. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = 'Save Recipe';
    }
  });
}

function showFormMessage(element, message, type) {
  element.textContent = message;
  element.className = `mt-1 message message-${type}`;
}

// Edit Recipe Form
async function setupEditRecipeForm(slug) {
  const form = document.getElementById('edit-recipe-form');
  const cancelBtn = document.getElementById('cancel-btn');
  
  if (!form) return;
  
  // Update cancel button to go back to the recipe
  cancelBtn.href = `/recipe.html?slug=${slug}`;
  
  // Fetch the recipe data
  try {
    const result = await api(`/recipes/${slug}`);
    
    if (!result.success) {
      document.querySelector('.card-body').innerHTML = `<div class="message message-error">${result.error || 'Recipe not found'}</div>`;
      return;
    }
    
    const recipe = result.data;
    
    // Pre-populate form fields
    document.getElementById('originalSlug').value = slug;
    document.getElementById('title').value = recipe.title || '';
    document.getElementById('description').value = recipe.description || '';
    document.getElementById('prepTime').value = recipe.prepTime || '';
    document.getElementById('cookTime').value = recipe.cookTime || '';
    document.getElementById('servings').value = recipe.servings || '';
    document.getElementById('tags').value = (recipe.tags || []).join(', ');
    document.getElementById('source').value = recipe.source || '';
    document.getElementById('image').value = recipe.image || '';
    
    // Convert arrays back to one-per-line format
    document.getElementById('ingredients').value = (recipe.ingredients || []).join('\n');
    document.getElementById('instructions').value = (recipe.instructions || []).join('\n');
    
    // Update page title
    document.title = `Edit ${recipe.title} - Recipe Keeper`;
    
  } catch (err) {
    document.querySelector('.card-body').innerHTML = '<div class="message message-error">Failed to load recipe. Please try again.</div>';
    return;
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('save-btn');
    const messageDiv = document.getElementById('form-message');
    const originalSlug = document.getElementById('originalSlug').value;
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const prepTime = document.getElementById('prepTime').value.trim();
    const cookTime = document.getElementById('cookTime').value.trim();
    const servings = document.getElementById('servings').value.trim();
    const tagsInput = document.getElementById('tags').value.trim();
    const source = document.getElementById('source').value.trim();
    const image = document.getElementById('image').value.trim();
    const ingredientsText = document.getElementById('ingredients').value.trim();
    const instructionsText = document.getElementById('instructions').value.trim();
    
    // Client-side validation
    if (!title) {
      showFormMessage(messageDiv, 'Please enter a recipe title.', 'error');
      return;
    }
    
    if (!ingredientsText) {
      showFormMessage(messageDiv, 'Please enter at least one ingredient.', 'error');
      return;
    }
    
    if (!instructionsText) {
      showFormMessage(messageDiv, 'Please enter at least one instruction.', 'error');
      return;
    }
    
    // Parse ingredients and instructions (one per line)
    const ingredients = ingredientsText.split('\n').map(line => line.trim()).filter(Boolean);
    const instructions = instructionsText.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Parse tags (comma separated)
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    messageDiv.className = 'mt-1 hidden';
    
    try {
      const result = await api(`/recipes/${originalSlug}`, {
        method: 'PUT',
        body: {
          title,
          description,
          prepTime,
          cookTime,
          servings,
          tags,
          source,
          image,
          ingredients,
          instructions
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save recipe');
      }
      
      // Redirect to the recipe page (use new slug in case title changed)
      window.location.href = `/recipe.html?slug=${result.data.slug}`;
    } catch (err) {
      showFormMessage(messageDiv, err.message || 'Failed to save recipe. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });
}

// ==========================================
// Cook Mode Functions
// ==========================================

let cookModeState = {
  recipe: null,
  currentStep: 0,
  totalSteps: 0,
  ingredientsSidebarOpen: false,
  touchStartX: 0,
  touchEndX: 0
};

async function initCookMode(slug) {
  const container = document.getElementById('cook-mode-app');
  
  try {
    const result = await api(`/recipes/${slug}`);
    
    if (!result.success) {
      container.innerHTML = `<div class="cook-mode-error">${result.error || 'Recipe not found'}</div>`;
      return;
    }
    
    cookModeState.recipe = result.data;
    cookModeState.currentStep = 0;
    cookModeState.totalSteps = (result.data.instructions || []).length;
    
    if (cookModeState.totalSteps === 0) {
      container.innerHTML = `<div class="cook-mode-error">This recipe has no instructions</div>`;
      return;
    }
    
    document.title = `Cook Mode: ${result.data.title}`;
    renderCookMode();
    setupCookModeEvents();
  } catch (err) {
    container.innerHTML = `<div class="cook-mode-error">Failed to load recipe</div>`;
  }
}

function renderCookMode() {
  const container = document.getElementById('cook-mode-app');
  const recipe = cookModeState.recipe;
  const step = cookModeState.currentStep;
  const total = cookModeState.totalSteps;
  const instruction = recipe.instructions[step];
  
  container.innerHTML = `
    <div class="cook-mode-container">
      <!-- Header -->
      <div class="cook-mode-header">
        <button class="cook-mode-exit-btn" onclick="exitCookMode()" title="Exit Cook Mode">
          ✕ Exit
        </button>
        <h1 class="cook-mode-title">${recipe.title}</h1>
        <button class="cook-mode-ingredients-toggle" onclick="toggleIngredientsSidebar()" title="Show Ingredients">
          🥗 Ingredients
        </button>
      </div>
      
      <!-- Step Counter -->
      <div class="cook-mode-step-counter">
        Step ${step + 1} of ${total}
      </div>
      
      <!-- Progress Bar -->
      <div class="cook-mode-progress">
        <div class="cook-mode-progress-fill" style="width: ${((step + 1) / total) * 100}%"></div>
      </div>
      
      <!-- Instruction Content -->
      <div class="cook-mode-content" id="cook-mode-content">
        <p class="cook-mode-instruction">${instruction}</p>
      </div>
      
      <!-- Navigation -->
      <div class="cook-mode-nav">
        <button class="cook-mode-nav-btn cook-mode-prev" onclick="cookModePrev()" ${step === 0 ? 'disabled' : ''}>
          ← Previous
        </button>
        <button class="cook-mode-nav-btn cook-mode-next" onclick="cookModeNext()">
          ${step === total - 1 ? '✓ Finish' : 'Next →'}
        </button>
      </div>
      
      <!-- Ingredients Sidebar -->
      <div class="cook-mode-sidebar ${cookModeState.ingredientsSidebarOpen ? 'open' : ''}" id="cook-mode-sidebar">
        <div class="cook-mode-sidebar-header">
          <h2>Ingredients</h2>
          <button class="cook-mode-sidebar-close" onclick="toggleIngredientsSidebar()">✕</button>
        </div>
        <ul class="cook-mode-ingredients-list">
          ${(recipe.ingredients || []).map(ing => `<li>${ing}</li>`).join('')}
        </ul>
      </div>
      
      <!-- Sidebar Overlay -->
      <div class="cook-mode-overlay ${cookModeState.ingredientsSidebarOpen ? 'open' : ''}" onclick="toggleIngredientsSidebar()"></div>
    </div>
  `;
}

function setupCookModeEvents() {
  // Keyboard navigation
  document.addEventListener('keydown', handleCookModeKeydown);
  
  // Touch/swipe support
  const content = document.getElementById('cook-mode-content');
  if (content) {
    content.addEventListener('touchstart', handleTouchStart, { passive: true });
    content.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
}

function handleCookModeKeydown(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    cookModeNext();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    cookModePrev();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    exitCookMode();
  } else if (e.key === 'i' || e.key === 'I') {
    e.preventDefault();
    toggleIngredientsSidebar();
  }
}

function handleTouchStart(e) {
  cookModeState.touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  cookModeState.touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const diff = cookModeState.touchStartX - cookModeState.touchEndX;
  const threshold = 50; // minimum swipe distance
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // Swipe left - next step
      cookModeNext();
    } else {
      // Swipe right - previous step
      cookModePrev();
    }
  }
}

function cookModeNext() {
  if (cookModeState.currentStep < cookModeState.totalSteps - 1) {
    cookModeState.currentStep++;
    renderCookMode();
  } else {
    // Last step - exit cook mode
    exitCookMode();
  }
}

function cookModePrev() {
  if (cookModeState.currentStep > 0) {
    cookModeState.currentStep--;
    renderCookMode();
  }
}

function toggleIngredientsSidebar() {
  cookModeState.ingredientsSidebarOpen = !cookModeState.ingredientsSidebarOpen;
  
  const sidebar = document.getElementById('cook-mode-sidebar');
  const overlay = document.querySelector('.cook-mode-overlay');
  
  if (sidebar) {
    sidebar.classList.toggle('open', cookModeState.ingredientsSidebarOpen);
  }
  if (overlay) {
    overlay.classList.toggle('open', cookModeState.ingredientsSidebarOpen);
  }
}

function exitCookMode() {
  // Remove event listeners
  document.removeEventListener('keydown', handleCookModeKeydown);
  
  // Navigate back to recipe
  const slug = cookModeState.recipe?.slug || new URLSearchParams(window.location.search).get('slug');
  window.location.href = `/recipe.html?slug=${slug}`;
}

function startCookMode(slug) {
  window.location.href = `/cook-mode.html?slug=${slug}`;
}

// =====================
// Collection Functions
// =====================

// Global state for collections
let allCollectionsCache = [];
let currentCollectionId = null;

// Load all collections for the collections page
async function loadCollections() {
  const container = document.getElementById('collections-list');
  if (!container) return;
  
  try {
    const result = await api('/collections');
    
    if (!result.success || result.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📚</div>
          <p>No collections yet. Create your first collection to organize your recipes!</p>
        </div>
      `;
      allCollectionsCache = [];
      return;
    }
    
    allCollectionsCache = result.data;
    container.innerHTML = result.data.map(renderCollectionCard).join('');
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load collections. Please refresh the page.</div>';
  }
}

// Render a collection card
function renderCollectionCard(collection) {
  const recipeCount = collection.recipeSlugs ? collection.recipeSlugs.length : 0;
  
  return `
    <div class="collection-card card">
      <a href="/collection.html?id=${collection.id}" class="card-link">
        <div class="card-body">
          <div class="collection-icon">📚</div>
          <h3 class="card-title">${collection.name}</h3>
          ${collection.description ? `<p class="collection-description">${collection.description}</p>` : ''}
          <div class="collection-meta">
            <span class="recipe-count">${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </a>
      <div class="collection-card-actions">
        <button onclick="event.preventDefault(); showEditCollectionModal('${collection.id}')" class="btn btn-small btn-secondary" title="Edit">✏️</button>
        <button onclick="event.preventDefault(); confirmDeleteCollection('${collection.id}', '${collection.name.replace(/'/g, "\\'")}')" class="btn btn-small btn-danger" title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

// Load a single collection with its recipes
async function loadCollection(id) {
  const container = document.getElementById('collection-content');
  if (!container) return;
  
  currentCollectionId = id;
  
  try {
    const result = await api(`/collections/${id}`);
    
    if (!result.success) {
      container.innerHTML = `<div class="message message-error">${result.error || 'Collection not found'}</div>`;
      return;
    }
    
    const collection = result.data;
    document.title = `${collection.name} - Recipe Keeper`;
    
    const recipesHtml = collection.recipes && collection.recipes.length > 0
      ? `<div class="grid grid-3">${collection.recipes.map(recipe => renderCollectionRecipeCard(recipe, collection.id)).join('')}</div>`
      : `<div class="empty-state"><div class="icon">📖</div><p>No recipes in this collection yet. Add recipes from the recipe detail page!</p></div>`;
    
    container.innerHTML = `
      <div class="collection-header">
        <div class="collection-header-info">
          <h1>${collection.name}</h1>
          ${collection.description ? `<p class="collection-description-large">${collection.description}</p>` : ''}
          <div class="collection-stats">
            <span>${collection.recipes ? collection.recipes.length : 0} recipe${collection.recipes?.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="collection-header-actions">
          <button onclick="showEditCollectionModal('${collection.id}')" class="btn btn-secondary">✏️ Edit Collection</button>
          <button onclick="confirmDeleteCollection('${collection.id}', '${collection.name.replace(/'/g, "\\'")}')" class="btn btn-danger">🗑️ Delete Collection</button>
        </div>
      </div>
      
      <div id="collection-recipes">
        ${recipesHtml}
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="message message-error">Failed to load collection. Please refresh the page.</div>';
  }
}

// Render a recipe card within a collection (with remove button)
function renderCollectionRecipeCard(recipe, collectionId) {
  const image = recipe.image 
    ? `<img src="${recipe.image}" alt="${recipe.title}">`
    : '🍽️';
  
  const slug = recipe.slug || recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  return `
    <div class="recipe-card card collection-recipe-card">
      <a href="/recipe.html?slug=${slug}" class="card-link">
        <div class="card-image">${image}</div>
        <div class="card-body">
          <h3 class="card-title">${recipe.title}</h3>
          <div class="meta">
            ${recipe.prepTime ? `<span>⏱️ ${recipe.prepTime}</span>` : ''}
            ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime}</span>` : ''}
          </div>
        </div>
      </a>
      <button onclick="event.preventDefault(); removeRecipeFromCollection('${collectionId}', '${slug}')" class="remove-from-collection-btn" title="Remove from collection">✕</button>
    </div>
  `;
}

// Show create collection modal
function showCreateCollectionModal() {
  document.getElementById('modal-title').textContent = 'New Collection';
  document.getElementById('collection-name').value = '';
  document.getElementById('collection-description').value = '';
  document.getElementById('collection-id').value = '';
  document.getElementById('save-collection-btn').textContent = 'Create Collection';
  document.getElementById('collection-modal').classList.remove('hidden');
}

// Show edit collection modal
async function showEditCollectionModal(id) {
  // First, try to find in cache
  let collection = allCollectionsCache.find(c => c.id === id);
  
  // If not in cache, fetch it
  if (!collection) {
    const result = await api(`/collections/${id}`);
    if (result.success) {
      collection = result.data;
    }
  }
  
  if (!collection) {
    showToast('Collection not found', 'error');
    return;
  }
  
  document.getElementById('modal-title').textContent = 'Edit Collection';
  document.getElementById('collection-name').value = collection.name;
  document.getElementById('collection-description').value = collection.description || '';
  document.getElementById('collection-id').value = collection.id;
  document.getElementById('save-collection-btn').textContent = 'Save Changes';
  document.getElementById('collection-modal').classList.remove('hidden');
}

// Close collection modal
function closeCollectionModal() {
  document.getElementById('collection-modal').classList.add('hidden');
}

// Save collection (create or update)
async function saveCollection(event) {
  event.preventDefault();
  
  const id = document.getElementById('collection-id').value;
  const name = document.getElementById('collection-name').value.trim();
  const description = document.getElementById('collection-description').value.trim();
  const btn = document.getElementById('save-collection-btn');
  
  if (!name) {
    showToast('Name is required', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    let result;
    if (id) {
      // Update existing
      result = await api(`/collections/${id}`, {
        method: 'PUT',
        body: { name, description }
      });
    } else {
      // Create new
      result = await api('/collections', {
        method: 'POST',
        body: { name, description }
      });
    }
    
    if (result.success) {
      closeCollectionModal();
      showToast(id ? 'Collection updated' : 'Collection created', 'success');
      // Reload the appropriate page
      if (currentCollectionId) {
        loadCollection(currentCollectionId);
      } else {
        loadCollections();
      }
    } else {
      showToast(result.error || 'Failed to save collection', 'error');
    }
  } catch (err) {
    showToast('Failed to save collection. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Save Changes' : 'Create Collection';
  }
}

// Confirm and delete collection
function confirmDeleteCollection(id, name) {
  if (confirm(`Delete collection "${name}"? This will NOT delete the recipes, just the collection.`)) {
    deleteCollection(id);
  }
}

// Delete a collection
async function deleteCollection(id) {
  try {
    const result = await api(`/collections/${id}`, { method: 'DELETE' });
    
    if (result.success) {
      showToast('Collection deleted', 'success');
      // If we're on the collection detail page, redirect to collections list
      if (currentCollectionId === id) {
        setTimeout(() => {
          window.location.href = '/collections.html';
        }, 500);
      } else {
        loadCollections();
      }
    } else {
      showToast(result.error || 'Failed to delete collection', 'error');
    }
  } catch (err) {
    showToast('Failed to delete collection. Please try again.', 'error');
  }
}

// Remove a recipe from a collection
async function removeRecipeFromCollection(collectionId, recipeSlug) {
  if (!confirm('Remove this recipe from the collection?')) return;
  
  try {
    const result = await api(`/collections/${collectionId}/recipes/${recipeSlug}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      showToast('Recipe removed from collection', 'success');
      loadCollection(collectionId);
    } else {
      showToast(result.error || 'Failed to remove recipe', 'error');
    }
  } catch (err) {
    showToast('Failed to remove recipe. Please try again.', 'error');
  }
}

// =====================
// Recipe Detail - Collection Management
// =====================

// Load collections dropdown for recipe detail page
async function loadCollectionsForRecipe(recipeSlug) {
  try {
    // Get all collections and the recipe's current collections
    const [allResult, recipeResult] = await Promise.all([
      api('/collections'),
      api(`/collections/for-recipe/${recipeSlug}`)
    ]);
    
    if (!allResult.success) return;
    
    const allCollections = allResult.data;
    const recipeCollections = recipeResult.success ? recipeResult.data : [];
    const recipeCollectionIds = recipeCollections.map(c => c.id);
    
    return { allCollections, recipeCollectionIds };
  } catch (err) {
    console.error('Failed to load collections for recipe:', err);
    return null;
  }
}

// Show collections dropdown/modal on recipe detail page
async function showAddToCollectionModal(recipeSlug) {
  const data = await loadCollectionsForRecipe(recipeSlug);
  
  if (!data) {
    showToast('Failed to load collections', 'error');
    return;
  }
  
  const { allCollections, recipeCollectionIds } = data;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('add-to-collection-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-to-collection-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="closeAddToCollectionModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add to Collection</h2>
          <button onclick="closeAddToCollectionModal()" class="modal-close">&times;</button>
        </div>
        <div id="collections-checklist" class="collections-checklist"></div>
        <div class="modal-actions">
          <button type="button" onclick="closeAddToCollectionModal()" class="btn btn-secondary">Cancel</button>
          <button type="button" onclick="saveRecipeCollections('${recipeSlug}')" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Populate the checklist
  const checklist = document.getElementById('collections-checklist');
  
  if (allCollections.length === 0) {
    checklist.innerHTML = `
      <div class="no-collections-message">
        <p>No collections yet.</p>
        <a href="/collections.html" class="btn btn-primary btn-small">Create a Collection</a>
      </div>
    `;
  } else {
    checklist.innerHTML = allCollections.map(collection => `
      <label class="collection-checkbox">
        <input type="checkbox" value="${collection.id}" ${recipeCollectionIds.includes(collection.id) ? 'checked' : ''}>
        <span class="collection-checkbox-name">${collection.name}</span>
        <span class="collection-checkbox-count">(${collection.recipeSlugs?.length || 0} recipes)</span>
      </label>
    `).join('');
  }
  
  // Update save button with correct slug
  const saveBtn = modal.querySelector('.modal-actions .btn-primary');
  saveBtn.setAttribute('onclick', `saveRecipeCollections('${recipeSlug}')`);
  
  modal.classList.remove('hidden');
}

// Close add to collection modal
function closeAddToCollectionModal() {
  const modal = document.getElementById('add-to-collection-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Save recipe's collection memberships
async function saveRecipeCollections(recipeSlug) {
  const checklist = document.getElementById('collections-checklist');
  const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');
  
  const collectionIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      collectionIds.push(cb.value);
    }
  });
  
  try {
    const result = await api(`/collections/for-recipe/${recipeSlug}`, {
      method: 'PUT',
      body: { collectionIds }
    });
    
    if (result.success) {
      closeAddToCollectionModal();
      showToast('Collections updated', 'success');
      // Update the collections display on the recipe page
      updateRecipeCollectionsDisplay(result.data);
    } else {
      showToast(result.error || 'Failed to update collections', 'error');
    }
  } catch (err) {
    showToast('Failed to update collections. Please try again.', 'error');
  }
}

// Update the collections display on recipe detail page
function updateRecipeCollectionsDisplay(collections) {
  const container = document.getElementById('recipe-collections-display');
  if (!container) return;
  
  if (collections.length === 0) {
    container.innerHTML = '<span class="no-collections">Not in any collections</span>';
  } else {
    container.innerHTML = collections.map(c => 
      `<a href="/collection.html?id=${c.id}" class="collection-badge">${c.name}</a>`
    ).join('');
  }
}

// Render collections section for recipe detail page
function renderRecipeCollectionsSection(recipeSlug, collections) {
  const collectionsHtml = collections.length > 0
    ? collections.map(c => `<a href="/collection.html?id=${c.id}" class="collection-badge">${c.name}</a>`).join('')
    : '<span class="no-collections">Not in any collections</span>';
  
  return `
    <div class="recipe-collections-section">
      <div class="recipe-collections-header">
        <span class="collections-label">📚 Collections:</span>
        <button onclick="showAddToCollectionModal('${recipeSlug}')" class="btn btn-small btn-secondary">Manage</button>
      </div>
      <div id="recipe-collections-display" class="recipe-collections-list">
        ${collectionsHtml}
      </div>
    </div>
  `;
}

