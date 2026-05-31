import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import DeleteIcon from '@mui/icons-material/Delete';
import type {SelectedIngredients} from "../../types.ts";

type typeIngredientsSelectedProps = {
    selectedIngredients: SelectedIngredients[],
    onRemoveIngredient: (ingredient: SelectedIngredients) => void,
}


export const IngredientsSelected = ({ selectedIngredients, onRemoveIngredient }: typeIngredientsSelectedProps) => {
    return (
        <Container maxWidth="sm">
            <Typography variant="h6">
                Ingredients selected
            </Typography>
            <Box sx={{ width: '100%' }}>
                    <List>
                        {selectedIngredients.map((ingredient: SelectedIngredients) => {
                            return (
                                <div key={ingredient.id}>
                                    <ListItem>
                                        <Typography variant="h6">
                                            {ingredient.name}
                                        </Typography>
                                        <ListItemIcon>
                                            <DeleteIcon onClick={() => onRemoveIngredient(ingredient)} />
                                        </ListItemIcon>
                                    </ListItem>
                                </div>
                            )
                        })}
                    </List>
            </Box>
        </Container>
    )
}