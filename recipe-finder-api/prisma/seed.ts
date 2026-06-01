/**
 * Script de seed Prisma.
 *
 * Pipeline de parsing :
 *   1. Pre-clean : retire trademarks, parenthèses, fractions, nombres, %
 *   2. Strip units (cups, tbsp, oz...)
 *   3. Strip prep words (chopped, diced, fresh, ripe...)
 *   4. Strip modifiers (baby, buffalo, fat-free, italian, organic...)
 *   5. Strip known brand names (kraft, campbell's, ball park...)
 *   6. Singularize chaque token
 *   7. Mapping canonique sur tokens individuels (parmigiano → parmesan)
 *   8. Retire le suffixe "cheese" si un nom de fromage canonique est présent
 *   9. Mapping canonique sur le résultat complet (pour les patterns multi-mots)
 */

import { PrismaClient } from '../generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import pluralize from 'pluralize';
import { PrismaPg } from '@prisma/adapter-pg';

// ─── Setup pluralize avec les exceptions mass-noun ──────────────────────────

pluralize.addUncountableRule('molasses');
pluralize.addUncountableRule('asparagus');
pluralize.addUncountableRule('hummus');
pluralize.addUncountableRule('couscous');
pluralize.addUncountableRule('watercress');

// ─── Constantes de parsing ──────────────────────────────────────────────────

const TRADEMARKS = /[®™©]/g;
const UNICODE_FRACTIONS = /[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g;
const NUMBERS = /\d+(\.\d+)?(\/\d+)?/g;

const UNITS =
  /\b(cups?|tsp|teaspoons?|tbsp|tablespoons?|oz|ounces?|lb|pounds?|g|grams?|kg|ml|l|liters?|pinch|dash|cloves?|pieces?|cans?|packages?|slices?|sticks?|jars?|bottles?|bunches?|bags?|boxes?|containers?)\b/gi;

const PREP_WORDS =
  /\b(chopped|diced|sliced|minced|shredded|grated|crushed|peeled|seeded|fresh|dried|frozen|cooked|raw|ground|finely|coarsely|thinly|roughly|large|small|medium|boneless|skinless|lean|whole|ripe|overripe|hot|cold|warm|softened|melted|beaten|cubed|mashed|packed|scalded|divided|to taste|optional|cut into)\b/gi;

// Modificateurs qui ne sont pas des préparations mais des qualificatifs
// (taille, forme, origine, diététique, qualité)
const MODIFIERS =
  /\b(baby|mini|jumbo|ball|pearl|block|wedge|buffalo|italian|greek|french|american|mexican|asian|fat-free|low-fat|nonfat|skim|light|reduced-fat|low-sodium|unsalted|salted|organic|kosher|free-range|grass-fed|wild-caught|freshly)\b/gi;

// Marques courantes (à étendre si besoin selon ce que tu observes)
const BRANDS = /\b(belgioioso|kraft|campbell's|hellmann's|heinz|ball park)\b/gi;

const PARENS = /\([^)]*\)/g;
const LEADING_OR = /^or\s+/;
const LEADING_PUNCT = /^[-–—]\s*/;

const PANTRY_STAPLES = new Set([
  'salt',
  'pepper',
  'black pepper',
  'water',
  'olive oil',
  'vegetable oil',
  'cooking oil',
  'butter',
  'all-purpose flour',
  'flour',
  'white sugar',
  'sugar',
  'baking powder',
  'baking soda',
  'garlic powder',
  'onion powder',
]);

// Noms de fromages canoniques : si présent dans les tokens et que "cheese" est en suffixe,
// on retire "cheese" (ex: "mozzarella cheese" → "mozzarella")
// MAIS on ne touche pas à "blue cheese", "cottage cheese" etc. (le mot principal est ailleurs)
const CHEESE_NAMES = new Set([
  'mozzarella',
  'parmesan',
  'cheddar',
  'feta',
  'gouda',
  'brie',
  'camembert',
  'ricotta',
  'mascarpone',
  'gruyere',
  'emmental',
  'provolone',
  'havarti',
]);

// Mapping canonique : équivalences vers une forme unique
// Appliqué une fois sur chaque token, et une fois sur le résultat complet
const CANONICAL_MAP: Record<string, string> = {
  parmigiano: 'parmesan',
  'parmigiano-reggiano': 'parmesan',
  gruyère: 'gruyere',
};

// ─── Logique de parsing ─────────────────────────────────────────────────────

function singularize(word: string): string {
  return pluralize.singular(word);
}

function parseIngredient(raw: string): string {
  // Étape 1 : ne garder que ce qui est avant la première virgule
  const beforeOr = raw.split(/\s+(?:or|and|&|\/)\s+/i)[0];
  const beforeComma = beforeOr.split(',')[0];

  // Étape 2 : nettoyage par regex successives
  const cleaned = beforeComma
    .toLowerCase()
    .replace(TRADEMARKS, '')
    .replace(PARENS, '')
    .replace(UNICODE_FRACTIONS, '')
    .replace(NUMBERS, '')
    .replace(/%/g, '')
    .replace(UNITS, '')
    .replace(PREP_WORDS, '')
    .replace(MODIFIERS, '')
    .replace(BRANDS, '')
    .replace(/[.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Étape 3 : retire les leading 'or' et la ponctuation
  const stripped = cleaned.replace(LEADING_OR, '').replace(LEADING_PUNCT, '');

  // Étape 4 : tokenisation + singularisation, en filtrant les tokens vides
  let tokens = stripped.split(' ').filter(Boolean).map(singularize);

  // Étape 5 : applique le mapping canonique sur chaque token individuel
  // (ex: "parmigiano" devient "parmesan" avant la suite du traitement)
  tokens = tokens.map((t) => CANONICAL_MAP[t] ?? t);

  // Étape 6 : retire le suffixe "cheese" si un nom de fromage canonique est dans les tokens
  // (ex: "mozzarella cheese" → "mozzarella", mais "blue cheese" reste intact)
  if (
    tokens.length > 1 &&
    tokens[tokens.length - 1] === 'cheese' &&
    tokens.some((t) => CHEESE_NAMES.has(t))
  ) {
    tokens.pop();
  }

  const result = tokens.join(' ').trim();

  // Étape 7 : mapping canonique sur le résultat complet (pour les patterns multi-mots)
  return CANONICAL_MAP[result] ?? result;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawRecipe {
  title: string;
  cook_time: number | null;
  prep_time: number | null;
  ingredients: string[];
  ratings: number;
  cuisine: string;
  category: string;
  author: string;
  image: string;
}

// ─── Seed ───────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, 'recipes-en.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `❌ File not found: ${filePath}\n   Place recipes-en.json in the prisma/ folder.`,
    );
  }

  const recipes: RawRecipe[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📄 Loaded ${recipes.length} recipes from JSON`);

  // ─── Phase 1 : nettoyer les tables pour rendre le seed idempotent ─────────
  console.log('🧹 Clearing existing data...');
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();

  // ─── Phase 2 : extraire et insérer en bulk tous les ingrédients uniques ───
  console.log('📦 Extracting unique ingredients...');
  const uniqueIngredients = new Set<string>();
  for (const recipe of recipes) {
    for (const raw of recipe.ingredients) {
      const parsed = parseIngredient(raw);
      if (parsed) uniqueIngredients.add(parsed);
    }
  }
  console.log(`   ${uniqueIngredients.size} unique ingredients found`);

  await prisma.ingredient.createMany({
    data: [...uniqueIngredients].map((name) => ({
      name,
      isPantryStaple: PANTRY_STAPLES.has(name),
    })),
  });
  console.log(`✅ Bulk-inserted ${uniqueIngredients.size} ingredients`);

  // ─── Phase 3 : récupérer le mapping nom → id pour les jointures ───────────
  const allIngredients = await prisma.ingredient.findMany({
    select: { id: true, name: true },
  });
  const idByName = new Map(allIngredients.map((i) => [i.name, i.id]));

  // ─── Phase 4 : insérer chaque recette avec ses lignes de jointure ─────────
  console.log('🍳 Inserting recipes...');
  let insertedCount = 0;

  for (const recipe of recipes) {
    // Déduplique les ingrédients à l'intérieur de cette recette
    // (ex: "1 cup white sugar" + "½ cup white sugar" → un seul "white sugar")
    const seenNames = new Set<string>();
    const junctionData: { ingredientId: number; rawText: string }[] = [];

    for (const raw of recipe.ingredients) {
      const parsed = parseIngredient(raw);
      if (!parsed || seenNames.has(parsed)) continue;

      const id = idByName.get(parsed);
      if (id === undefined) continue;

      seenNames.add(parsed);
      junctionData.push({ ingredientId: id, rawText: raw });
    }

    if (junctionData.length === 0) continue;

    await prisma.recipe.create({
      data: {
        title: recipe.title,
        cookTime: recipe.cook_time,
        prepTime: recipe.prep_time,
        rating: recipe.ratings,
        category: recipe.category || null,
        cuisine: recipe.cuisine || null,
        imageUrl: recipe.image || null,
        ingredients: {
          create: junctionData,
        },
      },
    });

    insertedCount++;
    if (insertedCount % 500 === 0) {
      console.log(`   ${insertedCount} / ${recipes.length}`);
    }
  }

  console.log(`\n✅ Done. Inserted ${insertedCount} recipes.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
