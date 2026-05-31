import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import {CssBaseline} from "@mui/material";
import {Header} from "./Layout/Header/Header.tsx";
import Box from "@mui/material/Box";
import {Recipe} from "./Pages/Recipe/Recipe.tsx";
import {HomePage} from "./Pages/Home/HomePage.tsx";

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CssBaseline/>
        <QueryClientProvider client={queryClient}>
            <Box sx={{background: '#DAFBF2', minHeight: '100vh'}}>
                <Header/>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/recipe/:recipeId" element={<Recipe/> }/>
                    </Routes>
                </BrowserRouter>,
            </Box>
        </QueryClientProvider>
    </StrictMode>,
)
