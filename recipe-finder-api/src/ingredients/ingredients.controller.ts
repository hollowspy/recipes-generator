import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { Ingredient } from '../../generated/prisma/client';
import { PaginatedResponse } from '../type';

@Controller('ingredients')
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Get()
  async getAll(
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) _page: number,
    @Query('_max_per_page', new DefaultValuePipe(50), ParseIntPipe)
    _max_per_page: number,
    @Query('s') s: string,
  ): Promise<PaginatedResponse<Ingredient>> {
    return this.ingredientsService.getIngredients(_page, _max_per_page, s);
  }
}
