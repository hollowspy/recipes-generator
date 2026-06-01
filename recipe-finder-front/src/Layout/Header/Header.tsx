import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import {Link} from "react-router";


export const Header = () => {
    return (
        <Box sx={{padding: 1}}>
            <AppBar position="static" sx={{backgroundColor: '#BED3C6'}}>
                <Toolbar>
                    <Typography variant="h4" component="div" sx={{flexGrow: 1, color: 'black'}}>
                        Technical Test Pennylane
                    </Typography>
                    <Link target="_blank" to={`https://github.com/pennylane-hiring/hollowspy`}>
                        <GitHubIcon sx={{ color : 'black '}}/>
                    </Link>

                </Toolbar>
            </AppBar>
        </Box>

    )
}