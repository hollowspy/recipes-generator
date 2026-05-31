export type SelectedIngredients = {
    id: number;
    isPantryStaple: boolean;
    name: string;
}

export type Ingredients = {
    recipeId: number;
    ingredientId: number;
    rawText: string;
}


export type Recipe = {
    id: number,
    title: string;
    cookTime: number,
    prepTime: number,
    rating: number;
    category: string;
    cuisine: string | null;
    imageUrl: string;
    ingredients: Ingredients[]
};


export type MatchingRecipe = {
    id: number;
    imageUrl: string;
    matched_count: number;
    result_count: number;
    title: string;
    total_count: number;
}

export type MetadataPagination = {
    _current_page: number;
    _max_per_page: number;
    _total_page: 1
}