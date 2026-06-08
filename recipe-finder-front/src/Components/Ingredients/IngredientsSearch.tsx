import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {useState} from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import {useIngredients} from "../../Hooks/useIngredients.ts";
import {useDebounce} from "../../Hooks/useDebounce.ts";
import type {SelectedIngredients} from "../../types.ts";
import Snackbar from "@mui/material/Snackbar";

type IngredientsSearchProps = {
    onAddIngredient: (ingredient: SelectedIngredients) => void,
}


export const IngredientsSearch = ({onAddIngredient}: IngredientsSearchProps) => {
    const [open, setOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    const debouncedSearch = useDebounce(search, 300);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
        error
    } = useIngredients(debouncedSearch);
    const options = data?.pages.flatMap(p => p._data) ?? [];

    const onSearchIngredient = (query: string) => {
        setSearch(query);
        setOpen(true);
    }

    const onSelectIngredient = (ingredient: SelectedIngredients | null) => {
        if (ingredient) {
            setSearch('');
            onAddIngredient(ingredient)
            setOpen(false);
        }
    }

    const handleScroll = (event: React.UIEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const reachedBottom =
            target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

        if (reachedBottom && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };


    return (
        <>
            {error &&
                <Snackbar
                    open={true}
                    autoHideDuration={5000}
                    message="Error on fetch ingredients"
                />
            }
            <Container sx={{padding: 2}} maxWidth="sm">
                <Typography variant="h6" gutterBottom>
                    Search Ingredients
                </Typography>
                <Autocomplete
                    sx={{width: '100%'}}
                    open={open}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    options={options}
                    loading={isFetching}
                    value={null}
                    inputValue={search}
                    onInputChange={(_, value) => onSearchIngredient(value)}
                    onChange={(_, value: SelectedIngredients | null) => onSelectIngredient(value)}
                    slotProps={{
                        listbox: {onScroll: handleScroll},
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Ingredients"
                            placeholder="Search Ingredients"
                            slotProps={{
                                ...params.slotProps,
                                input: {
                                    ...params.slotProps.input,
                                    endAdornment: (
                                        <>
                                            {isFetching ? <CircularProgress color="inherit" size={20}/> : null}
                                            {params.slotProps.input.endAdornment}
                                        </>
                                    ),
                                },
                            }}
                        />
                    )}
                />
            </Container>
        </>
    )
}

