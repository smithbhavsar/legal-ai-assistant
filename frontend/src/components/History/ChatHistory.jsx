import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { useChat } from '../../context/ChatContext';
import AddIcon from '@mui/icons-material/Add';

const ChatHistory = () => {
  const { sessions, currentSession, selectSession, startNewSession } = useChat();

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div">
          History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => startNewSession(`New Chat ${new Date().toLocaleTimeString()}`)}
        >
          New Chat
        </Button>
      </Box>
      <Divider />
      <List>
        {sessions.map((session) => (
          <ListItem key={session.id} disablePadding>
            <ListItemButton
              selected={currentSession?.id === session.id}
              onClick={() => selectSession(session.id)}
            >
              <ListItemText primary={session.name || `Chat on ${new Date(session.createdAt).toLocaleDateString()}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ChatHistory;