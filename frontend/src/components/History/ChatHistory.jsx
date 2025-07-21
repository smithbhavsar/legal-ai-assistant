import React, { useState, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useChat } from '../../context/ChatContext';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import dayjs from 'dayjs';

const ChatHistory = ({ onSelect }) => {
  const { sessions, currentSession, selectSession, startNewSession, deleteSession } = useChat();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuSessionId, setMenuSessionId] = useState(null);
  const [hoveredSessionId, setHoveredSessionId] = useState(null);

  const handleMenuOpen = (event, sessionId) => {
    setMenuAnchor(event.currentTarget);
    setMenuSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSessionId(null);
  };

  const handleDelete = async () => {
    if (menuSessionId) {
      await deleteSession(menuSessionId);
      handleMenuClose();
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">History</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => startNewSession(`New Chat ${new Date().toLocaleTimeString()}`)}
        >
          New Chat
        </Button>
      </Box>
      <Divider sx={{ mb: 1 }} />

      <List>
        {sessions.map((session) => {
          const label = session.first_message
            ? session.first_message.length > 25
              ? session.first_message.slice(0, 25) + '...'
              : session.first_message
            : `Chat on ${dayjs(session.createdAt).isValid() ? dayjs(session.createdAt).format('MMM D, YYYY h:mm A') : 'Unknown Date'}`;

          return (
            <ListItem
              key={session.id}
              disablePadding
              onMouseEnter={() => setHoveredSessionId(session.id)}
              onMouseLeave={() => setHoveredSessionId(null)}
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ListItemButton
                  selected={currentSession?.id === session.id}
                  onClick={() => {
                    selectSession(session.id);
                    if (onSelect) onSelect();
                  }}
                >
                  <ListItemText primary={label} />
                </ListItemButton>
              </Box>

              {hoveredSessionId === session.id && (
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuOpen(e, session.id)}
                  sx={{ ml: 1 }}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
            </ListItem>
          );
        })}
      </List>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            minWidth: 140,
            borderRadius: 2,
            boxShadow: 3,
            p: 0.5,
            zIndex: 2000,
          },
        }}
        container={document.body}
      >
        <MenuItem
          onClick={handleDelete}
          sx={{
            color: 'error.main',
            fontWeight: 500,
            px: 2,
            py: 1.2,
            borderRadius: 1,
            gap: 1,
            '&:hover': {
              bgcolor: 'error.light',
              color: 'error.dark',
            },
          }}
        >
          <DeleteOutlineIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHistory;
