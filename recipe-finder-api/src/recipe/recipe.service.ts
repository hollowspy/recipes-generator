import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Recipe, Prisma } from '../../generated/prisma/client';
import { FullRecipe, MatchResult, PaginatedResponse } from '../type';

@Injectable()
export class RecipeService {
  constructor(private readonly prismaService: PrismaService) {}
  async getRecipes(
    page: number,
    max_per_page: number,
  ): Promise<PaginatedResponse<Recipe>> {
    const safeLimit = Math.min(max_per_page, 100);

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.recipe.findMany({
        take: safeLimit,
        skip: (page - 1) * safeLimit,
      }),
      this.prismaService.recipe.count(),
    ]);
    return {
      _data: data,
      _metadata: {
        _current_page: page,
        _max_per_page: safeLimit,
        _total_page: Math.ceil(total / safeLimit),
      },
    };
  }

  async getRecipeById(id: number): Promise<FullRecipe> {
    const fullRecipe = await this.prismaService.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
      },
    });
    if (!fullRecipe) {
      throw new NotFoundException(`Recipe with id ${id} not found`);
    }
    return fullRecipe;
  }

  async getRecipesByIngredients(
    page: number,
    max_per_page: number,
    ingredientsIds: number[],
  ): Promise<PaginatedResponse<MatchResult>> {
    const safeLimit = Math.min(max_per_page, 100);
    const offset = (page - 1) * safeLimit;
    const results = await this.prismaService.$queryRaw<MatchResult[]>`
      WITH recipe_totals AS (SELECT ri."recipeId", COUNT(*) ::int AS total_count
                             FROM recipes_ingredients ri
                                    JOIN ingredients i ON i.id = ri."ingredientId"
                             WHERE i."isPantryStaple" = false
                             GROUP BY ri."recipeId"),
           matched_recipes AS (SELECT ri."recipeId",
                                      COUNT(DISTINCT ri."ingredientId") ::int AS matched_count
                               FROM recipes_ingredients ri
                               WHERE ri."ingredientId" IN (${Prisma.join(ingredientsIds)})
                               GROUP BY ri."recipeId")
      SELECT r.id,
             r.title,
             r."imageUrl",
             mr.matched_count,
             rt.total_count,
             COUNT(*) OVER ()::int AS result_count
      FROM matched_recipes mr
             JOIN recipes r ON r.id = mr."recipeId"
             JOIN recipe_totals rt ON rt."recipeId" = mr."recipeId"
      ORDER BY mr.matched_count DESC, rt.total_count ASC
        LIMIT ${safeLimit}
      OFFSET ${offset};
    `;
    const total = results[0]?.result_count ?? 0;
    return {
      _data: results,
      _metadata: {
        _current_page: page,
        _max_per_page: safeLimit,
        _total_page: Math.ceil(total / safeLimit),
      },
    };
  }
}
