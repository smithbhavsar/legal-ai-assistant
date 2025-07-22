import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import InputField from './InputField';

const ChatInterface = () => {
  const { messages, loading } = useChat();
  const messagesEndRef = useRef(null);
  const scrollableRef = useRef(null);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({
        top: scrollableRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
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
        flex: 1,
        position: 'relative',
      }}
    >
      {/* Scrollable chat area */}
      <Box
        ref={scrollableRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: { xs: 1, md: 3 },
          pt: 2,
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
      {/* Input field fixed at bottom */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1, md: 2 },
          borderTop: '1px solid',
          borderColor: 'divider',
          background: 'background.paper',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          borderRadius: 0,
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <InputField loading={loading} />
      </Paper>
    </Box>
  );
};

export default ChatInterface;
