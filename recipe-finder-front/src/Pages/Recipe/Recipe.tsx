import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from "@mui/material/Typography";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder'
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import { useParams } from "react-router";
import {useRecipeById} from "../../Hooks/useRecipeById.ts";
import CircularProgress from '@mui/material/CircularProgress';
import {resolveImageUrl} from "../../Utils/resolveImageUrl.ts";
import type {Ingredients} from "../../types.ts";
import Snackbar from "@mui/material/Snackbar";



export const Recipe = () => {
    const { recipeId } = useParams();
    const { data, error, isFetching} = useRecipeById(recipeId);
    return (
        <Box sx={{padding: 4, margin: 1, backgroundColor: '#BED3C6', boxShadow: 3, minHeight: '10vh'}}>
            {isFetching &&
                <Box sx={{ display: 'flex' }}>
                    <CircularProgress aria-label="Loading…" />
                </Box>
            }
            {error &&
                <Snackbar
                    open={true}
                    autoHideDuration={5000}
                    message="Error on fetch recipe by Id"
                />
            }
            {!isFetching && !error && data &&
                <>
                    <Grid sx={{marginBottom: 2}} container spacing={4}>
                        <Grid size={10}>
                            <Typography variant={"h5"}>{data.title}</Typography>
                        </Grid>
                        <Grid sx={{display: "flex", alignItems: 'center'}} size={2}>
                            <StarIcon />
                            <Typography sx={{marginLeft: 1}} variant={"body1"}>{data.rating}</Typography>
                        </Grid>
                    </Grid>
                    <Divider/>
                    <Grid sx={{padding: 2}} container spacing={4}>
                        <Grid sx={{display: "flex"}} size={4}>
                            <QueryBuilderIcon />
                            <Typography sx={{marginLeft: 1}} variant={"body1"}>Prep : {data.prepTime} min.</Typography>
                        </Grid>
                        <Grid sx={{display: "flex"}} size={4}>
                            <WhatshotIcon />
                            <Typography sx={{marginLeft: 1}} variant={"body1"}>Cook : {data.cookTime} min.</Typography>
                        </Grid>
                        <Grid size={4}>
                            <div>{data?.category}</div>
                        </Grid>
                    </Grid>
                    <Divider/>
                    <Grid sx={{padding: 4}} container spacing={4}>
                        <Grid size={6}>
                            <CardMedia
                                component="img"
                                image={resolveImageUrl(data.imageUrl)}
                                alt={data.title}
                            />
                        </Grid>
                        <Grid size={6}>
                            <Box sx={{width: '100%'}}>
                                <Typography sx={{fontWeight: 'bold'}} variant="subtitle1" component="div">
                                    INGREDIENTS
                                </Typography>
                                <List>
                                    {data.ingredients.map((ingredient: Ingredients) => {
                                        return (
                                            <ListItem key={`${ingredient.recipeId}-${ingredient.ingredientId}`} sx={{padding: 1}}>
                                                <ListItemIcon>
                                                    <FiberManualRecordIcon/>
                                                </ListItemIcon>
                                                <Typography>
                                                    {ingredient.rawText}
                                                </Typography>
                                            </ListItem>
                                        )
                                    })}
                                </List>
                            </Box>
                        </Grid>
                    </Grid>
                </>
            }
        </Box>
    )
}