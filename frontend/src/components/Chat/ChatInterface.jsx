import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import InputField from './InputField';

const ChatInterface = () => {
  const { messages, loading } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      className="notion-chat-container"
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        maxWidth: '100%',
        margin: 0,
        boxShadow: 'none',
        borderRadius: 0,
        border: 'none',
        overflow: 'visible', // allow menus to escape
        flex: 1,
        position: 'relative', // allow absolute/portal children
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1, md: 3 }, pt: 2, backgroundColor: 'background.paper', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'visible', position: 'relative' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: messages.length === 0 ? 'center' : 'flex-start', overflow: 'visible', position: 'relative' }}>
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                textAlign: 'center',
                backgroundColor: 'background.paper',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Ask a legal question to get started.
              </Typography>
            </Box>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </Box>
      </Box>
      <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, borderTop: '1px solid', borderColor: 'divider', background: 'background.paper', boxShadow: 'none', borderRadius: 0, position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 1 }}>
        <InputField loading={loading} />
      </Paper>
    </Box>
  );
};

export default ChatInterface;
