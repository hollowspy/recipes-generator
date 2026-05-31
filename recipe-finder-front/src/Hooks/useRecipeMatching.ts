import {useQuery} from "@tanstack/react-query";
import axios from "axios";
import type {SelectedIngredients} from "../types.ts";

export const useRecipeMatching = (ingredients:SelectedIngredients[], page:number) => {
    const ids = ingredients.map((ingredient:SelectedIngredients) => ingredient.id);
    const idsJoins = ids.join(',');
    const url = `${import.meta.env.VITE_API_FINDER_RECIPE_URL}/recipe/matching`;
    return useQuery({
        queryKey: ['recipe', 'matching', {ids, page}],
        queryFn: async () => {
            const response = await axios.get(url, {
                params: { _page: page, _max_per_page: 30, i_id: idsJoins },
            });
            return response.data;
        },
        enabled: ingredients.length > 0,
    });
};