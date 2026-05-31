import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useIngredients = (search: string) => {
    const url = `${import.meta.env.VITE_API_FINDER_RECIPE_URL}/ingredients`;
    return useInfiniteQuery({
        queryKey: ['ingredients', search],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await axios.get(url, {
                params: { _page: pageParam, _max_per_page: 20, s: search },
            });
            return response.data;
        },
        getNextPageParam: (lastPage) => {
            const { _current_page, _total_page } = lastPage._metadata;
            return _current_page < _total_page ? _current_page + 1 : undefined;
        },
        enabled: search?.length >= 2,
    });
};