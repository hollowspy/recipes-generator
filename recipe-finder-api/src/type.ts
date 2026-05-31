import {
  Recipe,
  RecipeIngredient,
} from '../generated/prisma/client';

export type PaginatedResponse<T> = {
  _data: T[];
  _metadata: {
    _current_page: number;
    _max_per_page: number;
    _total_page: number;
  };
};


export type MatchResult = {
  id: number;
  title: string;
  imageUrl: string | null;
  matched_count: number;
  total_count: number;
  result_count: number;
};


export type FullRecipe = Recipe & {
  ingredients: RecipeIngredient[];
};
