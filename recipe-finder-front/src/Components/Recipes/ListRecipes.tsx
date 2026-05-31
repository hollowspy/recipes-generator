import {Grid} from "@mui/material";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import { Link } from "react-router";
import {resolveImageUrl} from "../../Utils/resolveImageUrl.ts";
import type {MatchingRecipe, MetadataPagination} from "../../types.ts";


type ListRecipesProps = {
    listingRecipes: MatchingRecipe[],
    onChangePage: (page: number) => void,
    metadata: MetadataPagination,
}

export const ListRecipes = ({listingRecipes, onChangePage, metadata}: ListRecipesProps) => {

    const handleChange = (value: number) => {
        onChangePage(value)
    }


    const calcIngredients = (recipe: MatchingRecipe) => {
        const hasAllIndredients = recipe.matched_count === recipe.total_count
        return (
            <div>

                <Typography variant="body1" component="div">
                    {hasAllIndredients
                        ? '✅You have all ingredients'
                        : `${recipe.matched_count} / ${recipe.total_count} ingredients`

                    }
                </Typography>
            </div>
        )
    }

    return (
        <>
            <Typography variant="h6" gutterBottom>
                Choose the recipe !!
            </Typography>
            <Grid container spacing={4}>
                {listingRecipes?.map((recipe: MatchingRecipe) => {
                    return (
                        <Grid size={4}>
                            <Card sx={{height: '320px'}}>
                                <CardContent>
                                    <Typography sx={{height: '65px', fontWeight: 'bold'}} variant="subtitle1" component="div">
                                        {recipe.title}
                                    </Typography>
                                    {calcIngredients(recipe)}
                                    <CardMedia
                                        component="img"
                                        height="150"
                                        image={resolveImageUrl(recipe.imageUrl)}
                                        alt={recipe.title}
                                    />
                                </CardContent>
                                <CardActions>
                                    <Link to={`/recipe/${recipe.id}`}>
                                        <Button size="small">See Details</Button>
                                    </Link>

                                </CardActions>
                            </Card>
                        </Grid>

                    )
                })}
            </Grid>
            {listingRecipes && listingRecipes.length > 0 &&
                <Pagination page={metadata._current_page} onChange={(_, value) => handleChange(value)}
                            count={metadata._total_page}/>}
        </>
    )
}