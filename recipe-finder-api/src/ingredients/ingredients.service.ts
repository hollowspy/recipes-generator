import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ingredient, Prisma } from '../../generated/prisma/client';
import { PaginatedResponse } from '../type';



@Injectable()
export class IngredientsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getIngredients(
    page: number,
    max_per_page: number,
    search?: string,
  ): Promise<PaginatedResponse<Ingredient>> {
    const filters: Prisma.IngredientWhereInput = {
      isPantryStaple: false,
    };

    const safeLimit = Math.min(max_per_page, 100);

    if (search) {
      filters.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.ingredient.findMany({
        take: safeLimit,
        skip: (page - 1) * safeLimit,
        where: filters,
        orderBy: { name: 'asc' },
      }),
      this.prismaService.ingredient.count({ where: filters }),
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
}
