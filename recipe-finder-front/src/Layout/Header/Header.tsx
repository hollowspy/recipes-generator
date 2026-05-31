import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


export const Header = () => {
    return (
        <Box sx={{padding: 1}}>
            <AppBar position="static" sx={{backgroundColor: '#BED3C6'}}>
                <Toolbar>
                    <Typography variant="h4" component="div" sx={{flexGrow: 1, color: 'black'}}>
                        Technical Test Pennylane
                    </Typography>
                    <Button color="inherit">Github</Button>
                </Toolbar>
            </AppBar>
        </Box>

    )
}