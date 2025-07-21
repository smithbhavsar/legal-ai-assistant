import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import AssistantIcon from '@mui/icons-material/Assistant';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user' || message.type === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AssistantIcon />
          </Avatar>
        )}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: isUser
              ? '12px 12px 0 12px'
              : '12px 12px 12px 0',
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
        )}
      </Box>
    </Box>
  );
};

export default MessageBubble;
