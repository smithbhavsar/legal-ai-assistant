import React, { useState } from 'react';
import { Grid, Box, Drawer, useMediaQuery, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import ChatHistory from '../History/ChatHistory';
import ChatInterface from './ChatInterface';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

const MOBILE_TOPBAR_HEIGHT = 64;

const DualPaneChat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [historyOpen, setHistoryOpen] = useState(false);

  // Handler to close drawer when a history item is selected
  const handleHistorySelect = () => {
    if (isMobile) setHistoryOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Mobile Top Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
          sx={{
            height: `${MOBILE_TOPBAR_HEIGHT}px`,
            minHeight: `${MOBILE_TOPBAR_HEIGHT}px`,
            bgcolor: 'background.paper',
            zIndex: theme.zIndex.appBar + 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Toolbar sx={{ minHeight: `${MOBILE_TOPBAR_HEIGHT}px`, px: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={() => setHistoryOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 700, letterSpacing: 0.5 }}
            >
              Legal Assistant
            </Typography>
            {/* Spacer to keep title centered */}
            <Box sx={{ width: 40, ml: 'auto' }} />
          </Toolbar>
        </AppBar>
      )}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          pt: isMobile ? `${MOBILE_TOPBAR_HEIGHT}px` : 0,
          overflow: 'hidden',
        }}
      >
        {/* Desktop: History Panel (fixed 3/12) */}
        {!isMobile && (
          <Box
            sx={{
              width: { md: '20%', xs: '100%' },
              minWidth: 0,
              maxWidth: { md: '20%' },
              borderRight: { md: '1px solid' },
              borderColor: 'divider',
              height: '100%',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 0,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ChatHistory onSelect={handleHistorySelect} />
          </Box>
        )}
        {/* Chat Panel (fixed 9/12) */}
        <Box
          sx={{
            width: { md: '80%', xs: '100%' },
            minWidth: 0,
            maxWidth: { md: '80%' },
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 0,
            boxShadow: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <ChatInterface />
        </Box>
      </Box>
      {/* Mobile: History Drawer */}
      <Drawer
        anchor="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sx={{ zIndex: theme.zIndex.drawer + 2 }}
        PaperProps={{
          sx: {
            width: 280,
            pt: `${MOBILE_TOPBAR_HEIGHT}px`,
            bgcolor: 'background.paper',
            height: '100vh',
            boxSizing: 'border-box',
          },
        }}
      >
        <ChatHistory onSelect={handleHistorySelect} />
      </Drawer>
    </Box>
  );
};

export default DualPaneChat;
