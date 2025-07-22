import React from 'react';
import { Box } from '@mui/material';
import ChatInterface from './ChatInterface';

const DualPaneChat = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <ChatInterface />
    </Box>
  );
};

export default DualPaneChat;
