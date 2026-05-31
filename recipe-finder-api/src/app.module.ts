import { Module } from '@nestjs/common';
import { RecipeController } from './recipe/recipe.controller';
import { RecipeService } from './recipe/recipe.service';
import { PrismaService } from './prisma/prisma.service';
import { IngredientsService } from './ingredients/ingredients.service';
import { IngredientsController } from './ingredients/ingredients.controller';

@Module({
  imports: [],
  controllers: [RecipeController, IngredientsController],
  providers: [RecipeService, PrismaService, IngredientsService],
})
export class AppModule {}
