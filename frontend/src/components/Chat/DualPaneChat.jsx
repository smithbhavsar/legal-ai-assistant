import React from 'react';
import { Grid } from '@mui/material';
import ChatHistory from '../History/ChatHistory';
import ChatInterface from './ChatInterface';

const DualPaneChat = () => {
  return (
    <Grid container spacing={3} sx={{ height: 'calc(100vh - 64px)' }}>
      <Grid
        item
        xs={12}
        md={4}
        sx={{
          borderRight: '1px solid',
          borderColor: 'divider',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <ChatHistory />
      </Grid>
      <Grid item xs={12} md={8} sx={{ height: '100%' }}>
        <ChatInterface />
      </Grid>
    </Grid>
  );
};

export default DualPaneChat;
