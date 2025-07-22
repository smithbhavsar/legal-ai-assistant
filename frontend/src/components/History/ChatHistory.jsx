import React, { useState } from 'react';
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
  Paper,
  MenuItem
} from '@mui/material';
import { useChat } from '../../context/ChatContext';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import dayjs from 'dayjs';

const ChatHistory = ({ onSelect }) => {
  const { sessions, currentSession, selectSession, startNewSession, deleteSession } = useChat();
  const [menuSessionId, setMenuSessionId] = useState(null);
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const handleMenuOpen = (event, sessionId) => {
    event.preventDefault();
    setMenuSessionId(sessionId);

    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + rect.height,
      left: rect.left,
    });
  };

  const handleMenuClose = () => {
    setMenuSessionId(null);
    setMenuPosition(null);
  };

  const handleDelete = async () => {
    if (menuSessionId) {
      await deleteSession(menuSessionId);
      handleMenuClose();
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto', position: 'relative' }}>
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
                px: 1,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ListItemButton
                  selected={currentSession?.id === session.id}
                  onClick={() => {
                    selectSession(session.id);
                    if (onSelect) onSelect();
                  }}
                  sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}
                >
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                    {hoveredSessionId === session.id && (
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, session.id)}
                        size="small"
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </ListItemButton>
              </Box>
            </ListItem>
          );
        })}
      </List>

      {/* Floating Context Menu */}
      {menuPosition && (
        <ClickAwayListener onClickAway={handleMenuClose}>
        <Paper
          sx={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 1500,
            minWidth: 140,
            borderRadius: 2,
            boxShadow: 4,
            p: 0.5,
          }}
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
                bgcolor: 'action.hover'
              },
            }}
          >
            <DeleteOutlineIcon fontSize="small" /> Delete
          </MenuItem>
        </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default ChatHistory;
