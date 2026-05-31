import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {IngredientsSearch} from "../../Components/Ingredients/IngredientsSearch.tsx";
import {IngredientsSelected} from "../../Components/Ingredients/IngredientsSelected.tsx";
import Button from '@mui/material/Button';
import {useState} from "react";
import {useRecipeMatching} from "../../Hooks/useRecipeMatching.ts";
import {ListRecipes} from "../../Components/Recipes/ListRecipes.tsx";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type {SelectedIngredients} from "../../types.ts";


export const HomePage = () => {

    const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredients[]>([]);
    const [submittedIngredients, setSubmittedIngredients] = useState<SelectedIngredients[]>([]);
    const [page, setPage] = useState(1);
    const {data, isFetching} = useRecipeMatching(submittedIngredients, page);
    const { _data: recipes = [], _metadata } = data ?? {};
    console.log('recipes', recipes);


    const onAddIngredient = (ingredient: SelectedIngredients) => {
        if (ingredient) {
            const isAlreadySelectedIngredient = selectedIngredients.some((i: SelectedIngredients) => i.id === ingredient.id);
            if (isAlreadySelectedIngredient) return;
            const newIngredients = [...selectedIngredients, ingredient];
            setSelectedIngredients(newIngredients);
        }
    }

    const onRemoveIngredient = (ingredient: SelectedIngredients) => {
        const filteredIngredients = selectedIngredients.filter(i => i.id !== ingredient.id);
        setSelectedIngredients(filteredIngredients);
    }

    const onSearch = () => {
        setSubmittedIngredients(selectedIngredients);
    };

    const onChangePage = (page: number) => {
        setPage(page);
    }

    return (
        <>
            <Box sx={{padding: 1, margin: 1, backgroundColor: '#BED3C6', boxShadow: 3, minHeight: '10vh'}}>
                <Grid container spacing={2}>
                    <Grid size={{xs: 12, md: 6}}>
                        <IngredientsSearch onAddIngredient={onAddIngredient}/>
                    </Grid>
                    <Grid size={{xs: 12, md: 6}}>
                        <IngredientsSelected selectedIngredients={selectedIngredients}
                                             onRemoveIngredient={onRemoveIngredient}/>
                    </Grid>
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                    <Button onClick={onSearch}
                            disabled={selectedIngredients.length === 0}
                            variant="contained">
                        Search ...</Button>
                </Grid>
            </Box>
            {isFetching &&
                <Box sx={{ display: 'flex' }}>
                    <CircularProgress aria-label="Loading…" />
                </Box>
            }
            {!isFetching && data && recipes?.length > 0  &&
                <Box sx={{padding: 3, margin: 1, backgroundColor: '#BED3C6', boxShadow: 3}}>
                    <Grid size={{xs: 12}}>
                        <Typography variant={"body1"}>No matching recipe with these ingredients.</Typography>
                    </Grid>
                </Box>
            }
            {!isFetching && recipes.length > 0 &&
                <Box sx={{padding: 3, margin: 1, backgroundColor: '#BED3C6', boxShadow: 3}}>
                    <Grid size={{xs: 12, md: 6}}>
                        <ListRecipes listingRecipes={recipes} metadata={_metadata} onChangePage={onChangePage}/>
                    </Grid>
                </Box>
            }

        </>
    )
}