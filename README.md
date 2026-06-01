# Recipe Finder

A web app to find recipes matching the ingredients you have at home.

🔗 **Live demo**: https://recipe-finder-pennylane.netlify.app/  
🔗 **API**: https://recipes-generator-api.onrender.com

Author : NIEDZWIECKI Julien

Built as a technical test for Pennylane (EM position).

---

## User Stories

### User Story 1

As a home cook with limited time, I want to find a recipe with the ingredients I have at home, so that I don't have to lose time to scroll or to think about it.

**Acceptance criteria:**

- Ability to enter ingredients manually with an autocomplete dropdown of available options
- Store the selected ingredients
- Possibility to remove 1 to N ingredients from the selected ingredients
- The user must at least enter 2 characters before fetching available ingredients
- Don't display the pantry staple ingredients (not useful to search olive oil because we assume the user has it - and could be replaced by another kind of oil)

### User Story 2

As a home cook with limited time, I want to consult a list of recipes which have the best match with the ingredients I've selected in order to decide what to cook. The result must be ordered by number of matching ingredients in first. Even if I don't have all the ingredients, I can still view the recipe.

**Acceptance criteria:**

- Display a listing of recipes (result of recipes based on a matching ingredients)
- Matching is only based on non pantry staple ingredients (e.g. olive oil or salt is supposed to be available in user's home, so we don't include them for the matching score)
- A pagination must be set (Don't display all recipes in first in order not to lose the user)
- Clearly display how many ingredients the user has (or if the user has got all ingredients) inside the listing
- Display a picture of the recipe

### User Story 3

As a home cook, I want to have all information and necessary ingredients for a specific recipe. I want to know how much time I need to cook, and see all ingredients, so that I could decide if I can cook this recipe or not.

**Acceptance criteria:**

- Create a dedicated page for one full recipe (ingredients + other information)
- Provide a list with all ingredients (even if the PantryStaple ingredients)
- Display the original recipe Image near to the list of ingredients

---

## Stack and Architecture Choice

- **PostgreSQL database**: Database is hosted on Neon (https://neon.com): Serverless, scale to zero and free. Easy to use. No need a more complex hosted database like AWS RDS or Supabase for a prototype of this scale.

- **BackEnd**: NodeJS + NestJS framework: As mentioned on your instructions, this position is for a managerial role and I don't know Ruby on Rails. That's why I decided to develop the back-end with NestJS.

- **Front End**: ReactJS (v19) + vite / tanstack Query for API call + cache / MaterialUI for easy CSS framework.

---

## How to run locally

### Prerequisites

- Node.js 20+ ([install](https://nodejs.org/en))
- A PostgreSQL database — either:
    - **Local Postgres** (16+) via Docker:
      ```bash
      docker run --name recipe-db \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=recipes \
        -p 5432:5432 -d postgres:16
      ```
    - **Or a remote Postgres** (e.g., a free Neon project at https://neon.com)

### 1. Clone the repository

```bash
git clone <repo-url>
cd recipes-generator
```

### 2. Backend setup (recipe-finder-api/)

```bash
cd recipe-finder-api
npm install
```

Create a `.env` file at the root of `recipe-finder-api/` with your database URLs:

```env
# Used for runtime queries and migrations (pooled connection)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Used by the seed script only (direct connection, avoids PgBouncer limits)
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

> **Note**: DIRECT_URL is used by the seed script to bypass connection pooling (the seed performs thousands of sequential inserts that would otherwise saturate the PgBouncer pool). For Neon, use the pooled URL with -pooler in the hostname for DATABASE_URL, and the direct URL for DIRECT_URL

> **Note**: For a local Docker Postgres, both URLs are identical:  
> `postgresql://postgres:postgres@localhost:5432/recipes`.  


### 3. Download the recipes dataset

The dataset (`prisma/recipes-en.json`, ~5.6 MB) is committed to the repository
for convenience. No additional download is required.

### 4. Apply migrations and seed the database

```bash
npx prisma migrate deploy
npx prisma db seed
```

> **Note**: The seed processes ~10,000 recipes and takes 1–2 minutes locally, or 10–15 minutes against a remote database (network latency on each insert). The script is idempotent — it clears existing data before re-inserting.

### 5. Start the API

```bash
npm run start:dev
```

The API runs on `http://localhost:3000`. You can test it with:

```bash
curl "http://localhost:3000/ingredients?_page=1&_max_per_page=5&s=tomato"
```

### 6. Frontend setup (recipe-finder-front/)

In a separate terminal:

```bash
cd recipe-finder-front
npm install
```

Create a `.env` file at the root of `recipe-finder-front/`:

```env
VITE_API_FINDER_RECIPE_URL="http://localhost:3000"
```

Start the app:

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

---

## AI Tools

As mentioned on your instructions, we could ask the support of one AI in order to create this project. I've used claude.ai in order to help me on this following points:

### File seed: recipe-finder-api/prisma/seed.ts

This file is a TS script in order to extract all ingredients for your JSON database and to insert into the PostgreSQL database. Different rules were established in order to extract the most properly the ingredients and to insert them in database. The more ingredients I discovered, the more rules were created in order to have the better database we can. Here are these rules:

**Acceptance criteria:**

- Try to extract only the ingredients which are inside a real sentence. I was not interested in the units, brands, some adjectives. The decision was to create some regex rule in order to extract as much as possible some unique ingredients. Based on the regex (non-exhaustive list), I succeeded to extract approximately 6500 unique ingredients
- Try to identify some ingredients supposed to be available for everyone (salt, olive oil, etc..) => I consider the kind of ingredients like Pantry staple Ingredients

The rules I'm talking:

- Remove Trademarks
- Remove units / fraction / numbers
- Remove Adjective (prep_words)
- Remove brands
- Remove punctuation and keywords (like OR)
- Add a flag for pantry staple ingredients

Once this task was finished, the rest of the file is to insert all these ingredients into the postgresSQL database (thanks prisma as ORM). This file was created by Claude.ai.

### recipe-finder-api/src/recipe/recipe.service.ts: Function getRecipesByIngredients

This function is called in order to check how many recipe could match with a listing of ingredientsIds and to return a list of recipes (with title, imageUrl, how many ingredients are matching for each recipe, how many ingredients there are inside each recipe). For all SQL request, I've used Prisma as ORM (easy to implement, migration plan are triggered very fast, that's why I didn't need another ORM like typeORM).

All the others SQL queries are triggered natively by prisma, but this one is too complex. That's why I've used the `$queryRaw` method (exposed by Prisma) in order to hardcode a SQL query.

This SQL query was created by Claude.ai because a little bit complex. And because I wanted to avoid some unnecessary API call (and have the result is a single SQL request - because easier and faster thanks to the indexes).

### Other usages

For the rest of the code, Claude.ai was used for some little feature or for debugging some code (ex: Add a useDebouce hook or decode the url image in `utils/resolveImageUrl.ts`) and used as a code review.

---

## Known Limitations

**Improvement**: For this project, we still have too many missing match between ingredients you have and recipe you can do. Because I think the key of this project is how we could extract the ingredients from the JSON file and to find a better way. Obviously, having some rules handle by regex could be a good option (but regex have to be updated), but I suggest to use some LLM or AI API in order to:

- Either use it when a user provide the ingredients (based on a sentence)
- To create a prompt in order to extract the unique ingredients, and create a loop and parse it for each recipe => ⚠️ You could have a high cost to that and you have to think about new recipes and / or updated recipes


