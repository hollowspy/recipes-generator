/**
 * Script de seed Prisma — V5 (FINAL, ne plus itérer au-delà)
 *
 * Pipeline de parsing :
 *   1. Pre-clean : trademarks, parenthèses fermées et orphelines, fractions, nombres
 *   2. Strip units (cups, tbsp, baskets, heads, stalks, pints, each...)
 *   3. Strip modifiers (catch les hyphénés en entier AVANT prep_words)
 *   4. Strip prep words (chopped, drained, halved, half, thin, style, cut...)
 *   5. Strip storage forms (canned, jarred, pickled, smoked, cured...)
 *   6. Strip known brand names (contadina, hunt's, kraft, swanson...)
 *   7. Strip trailing "with X" (juice, liquid, basil, green chiles...)
 *   8. Cleanup orphan hyphens
 *   9. Singularize chaque token
 *  10. Filtre POST-singularisation pour les stopwords créés par la pluralisation inverse
 *  11. Mapping canonique sur tokens individuels (parmigiano → parmesan)
 *  12. Retire le suffixe "cheese" si un nom de fromage canonique est présent
 *  13. Mapping canonique sur le résultat complet (pour les patterns multi-mots)
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
  /\b(cups?|tsp|teaspoons?|tbsp|tablespoons?|oz|ounces?|lb|pounds?|g|grams?|kg|ml|l|liters?|pinch|dash|cloves?|pieces?|cans?|packages?|slices?|sticks?|jars?|bottles?|bunches?|bags?|boxes?|containers?|quarts?|cartons?|cubes?|baskets?|heads?|stalks?|sprigs?|pints?|each)\b/gi;

// Modificateurs : appliqué AVANT PREP_WORDS pour préserver les hyphénés (sun-dried, fire-roasted, dry-pack)
const MODIFIERS =
  /\b(baby|mini|jumbo|ball|pearl|block|wedge|buffalo|italian|greek|french|american|mexican|asian|fat-free|low-fat|nonfat|skim|light|reduced-fat|low-sodium|unsalted|salted|organic|kosher|free-range|grass-fed|wild-caught|freshly|chunky|smooth|creamy|lumpy|crunchy|chilled|room-temperature|chili-style|deep-fried|pan-fried|sun-dried|oven-dried|air-dried|hard-boiled|soft-boiled|fire-roasted|petite|extra-virgin|no-salt-added|vine-ripened|stone-ground|old-fashioned|dry-pack)\b/gi;

// Prep words : actions / états de préparation
const PREP_WORDS =
  /\b(chopped|diced|sliced|minced|shredded|grated|crushed|peeled|seeded|fresh|dried|frozen|cooked|raw|ground|finely|coarsely|thinly|thin|roughly|large|small|medium|boneless|skinless|lean|whole|ripe|overripe|hot|cold|warm|softened|melted|beaten|cubed|mashed|packed|scalded|divided|to taste|optional|cut into|cut|drained|undrained|halved|half|rinsed|crumbled|juiced|pitted|prepared|thawed|toasted|trimmed|uncooked|quartered|cored|removed|roasted|deveined|zested|as needed|bone-in|skin-on|lightly|flaked|stewed|style)\b/gi;

// Formes de stockage / conservation
const STORAGE_FORMS =
  /\b(canned|jarred|bottled|pickled|preserved|fermented|smoked|cured|brined)\b/gi;

// Marques courantes (étendu via analyse data-driven)
const BRANDS =
  /\b(belgioioso|kraft|campbell's|hellmann's|heinz|ball park|swanson|contadina|tabasco|pillsbury|goya|bisquick|frank's|miracle whip|hunt's)\b/gi;

// Suffixes "with X" — patterns observés dans le dataset
const TRAILING_WITH =
  /\s+with\s+(their\s+)?(juices?|liquid|water|oil|sauce|skin|leaves|tops|basil|garlic|active cultures|green chiles?|green chile pepper)\b.*$/i;

const PARENS = /\([^)]*\)/g;
const LEFTOVER_OPEN_PAREN = /\s*\([^)]*$/;
const LEADING_OR = /^or\s+/;
const LEADING_PUNCT = /^[-–—]\s*/;
const ORPHAN_HYPHEN = /-(?=\s|$)|(?<=\s)-/g;

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

// Stopwords à filtrer APRÈS la singularisation (pluralize peut recréer ces mots à partir de pluriels).
// Exemple : "halves" → "half" (qui réapparaît même si on avait strippé "half" en regex).
const POST_SINGULAR_STOPWORDS = new Set(['half', 'piece', 'each']);

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
  // Étape 1 : ne garder que ce qui est avant la première virgule (et avant "or/and/&/")
  const beforeOr = raw.split(/\s+(?:or|and|&|\/)\s+/i)[0];
  const beforeComma = beforeOr.split(',')[0];

  // Étape 2 : nettoyage par regex successives
  // IMPORTANT : MODIFIERS AVANT PREP_WORDS pour préserver les hyphénés type sun-dried / fire-roasted
  const cleaned = beforeComma
    .toLowerCase()
    .replace(TRADEMARKS, '')
    .replace(PARENS, '')
    .replace(LEFTOVER_OPEN_PAREN, '')
    .replace(UNICODE_FRACTIONS, '')
    .replace(NUMBERS, '')
    .replace(/%/g, '')
    .replace(UNITS, '')
    .replace(MODIFIERS, '')
    .replace(PREP_WORDS, '')
    .replace(STORAGE_FORMS, '')
    .replace(BRANDS, '')
    .replace(TRAILING_WITH, '')
    .replace(/[.]/g, ' ')
    .replace(ORPHAN_HYPHEN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Étape 3 : retire les leading 'or' et la ponctuation
  const stripped = cleaned.replace(LEADING_OR, '').replace(LEADING_PUNCT, '');

  // Étape 4 : tokenisation + singularisation, en filtrant les tokens vides
  let tokens = stripped.split(' ').filter(Boolean).map(singularize);

  // Étape 5 : filtre POST-singularisation pour les stopwords (halves → half, etc.)
  tokens = tokens.filter((t) => !POST_SINGULAR_STOPWORDS.has(t));

  // Étape 6 : applique le mapping canonique sur chaque token individuel
  tokens = tokens.map((t) => CANONICAL_MAP[t] ?? t);

  // Étape 7 : retire le suffixe "cheese" si un nom de fromage canonique est dans les tokens
  if (
    tokens.length > 1 &&
    tokens[tokens.length - 1] === 'cheese' &&
    tokens.some((t) => CHEESE_NAMES.has(t))
  ) {
    tokens.pop();
  }

  const result = tokens.join(' ').trim();

  // Étape 8 : mapping canonique sur le résultat complet (pour les patterns multi-mots)
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

  console.log('🧹 Clearing existing data...');
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();

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

  const allIngredients = await prisma.ingredient.findMany({
    select: { id: true, name: true },
  });
  const idByName = new Map(allIngredients.map((i) => [i.name, i.id]));

  console.log('🍳 Inserting recipes...');
  let insertedCount = 0;

  for (const recipe of recipes) {
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
