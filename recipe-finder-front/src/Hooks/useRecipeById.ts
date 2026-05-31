import {useQuery} from "@tanstack/react-query";
import axios from "axios";


export const useRecipeById = (id: string | undefined) => {
    const url = `${import.meta.env.VITE_API_FINDER_RECIPE_URL}/recipe/${id}`;
    return useQuery({
        queryKey: ['recipe', id],
        queryFn: async () => {
            const response = await axios.get(url , {
            });
            return response.data;
        },
        enabled: !!id
    });
};