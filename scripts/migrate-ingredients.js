const { getAllRecipes, migrateRecipeIngredients, isStructuredIngredients } = require('../lib/recipes');

async function migrateAllRecipes() {
  console.log('Starting ingredient migration...\n');
  
  const recipes = await getAllRecipes();
  let migrated = 0;
  let alreadyDone = 0;
  let failed = [];
  
  for (const recipe of recipes) {
    try {
      if (isStructuredIngredients(recipe.ingredients)) {
        alreadyDone++;
        console.log(`✓ ${recipe.title} - already structured`);
      } else {
        await migrateRecipeIngredients(recipe.slug);
        migrated++;
        console.log(`✓ ${recipe.title} - migrated`);
      }
    } catch (err) {
      failed.push({ slug: recipe.slug, error: err.message });
      console.log(`✗ ${recipe.title} - FAILED: ${err.message}`);
    }
  }
  
  console.log('\n--- Migration Complete ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Already done: ${alreadyDone}`);
  console.log(`Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed recipes:');
    failed.forEach(f => console.log(`  - ${f.slug}: ${f.error}`));
  }
}

migrateAllRecipes().catch(console.error);
