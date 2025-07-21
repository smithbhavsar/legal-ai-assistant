
import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';

const NAVBAR_HEIGHT = 64;

const AppLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <Navbar />
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: `${NAVBAR_HEIGHT + 8}px`, sm: `${NAVBAR_HEIGHT + 16}px` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout; 