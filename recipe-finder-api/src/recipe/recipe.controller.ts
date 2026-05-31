import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { Recipe } from '../../generated/prisma/client';
import { PaginatedResponse, MatchResult, FullRecipe } from '../type';

@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  async getAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) _page: number,
    @Query('_max_per_page', new DefaultValuePipe(50), ParseIntPipe)
    _max_per_page: number,
  ): Promise<PaginatedResponse<Recipe>> {
    return this.recipeService.getRecipes(_page, _max_per_page);
  }

  @Get('matching')
  async getRecipesByIngredients(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) _page: number,
    @Query('_max_per_page', new DefaultValuePipe(50), ParseIntPipe)
    _max_per_page: number,
    @Query('i_id') ingredientsIds: string,
  ): Promise<PaginatedResponse<MatchResult>> {
    if (!ingredientsIds) {
      return {
        _data: [],
        _metadata: {
          _current_page: 1,
          _max_per_page: 0,
          _total_page: 0,
        },
      };
    }

    const ids = ingredientsIds
      .split(',')
      .map(Number)
      .filter((id: number) => !isNaN(id));

    if (ids.length > 10) {
      throw new BadRequestException('Maximum 10 ingredients allowed');
    }

    return this.recipeService.getRecipesByIngredients(
      _page,
      _max_per_page,
      ids,
    );
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<FullRecipe> {
    return this.recipeService.getRecipeById(id);
  }
}
