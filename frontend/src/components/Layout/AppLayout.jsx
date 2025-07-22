
import React, { useState } from 'react';
import { Box, CssBaseline, Drawer, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';
import ChatHistory from '../History/ChatHistory';

const NAVBAR_HEIGHT = 64;
const SIDEBAR_WIDTH = 300;

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', height: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      {/* Top Navbar */}
      <Box sx={{ flexShrink: 0, zIndex: theme.zIndex.appBar + 1 }}>
        <Navbar onMobileMenu={handleSidebarOpen} />
      </Box>
      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, height: '100%' }}>
        {/* Sidebar: permanent on desktop, Drawer on mobile */}
        {isMobile ? (
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={handleSidebarClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: SIDEBAR_WIDTH, pt: `${NAVBAR_HEIGHT}px`, boxSizing: 'border-box', bgcolor: 'background.paper' } }}
          >
            <ChatHistory onSelect={handleSidebarClose} />
          </Drawer>
        ) : (
          <Box
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              height: '100%',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <ChatHistory />
          </Box>
        )}
        {/* Main Chat Area */}
        <Box sx={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout; 