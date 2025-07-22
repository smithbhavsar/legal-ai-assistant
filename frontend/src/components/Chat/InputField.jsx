import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../../context/ChatContext';

const InputField = ({ loading }) => {
  const [input, setInput] = useState('');
  const { sendMessage, selectedApi, setSelectedApi } = useChat();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input, false, selectedApi);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
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
      <ToggleButtonGroup
        value={selectedApi}
        exclusive
        onChange={(_, value) => value && setSelectedApi(value)}
        size="small"
        variant="outlined"
        color="primary"
        sx={{
          mb: 1,
          width: '100%',
          justifyContent: 'center',
          background: 'background.paper',
          borderRadius: 2,
          boxShadow: 0,
          border: '1px solid',
          borderColor: 'divider',
          gap: 0,
          minHeight: 36,
        }}
      >
        <ToggleButton
          value="research"
          sx={{
            flex: 1,
            fontSize: '0.92rem',
            py: 0.2,
            px: 1.2,
            border: 'none',
            borderRadius: '8px 0 0 8px',
            color: selectedApi === 'research' ? 'primary.main' : 'text.secondary',
            bgcolor: selectedApi === 'research' ? 'grey.100' : 'background.paper',
            fontWeight: 500,
            minHeight: 32,
            minWidth: 0,
          }}
        >
          Research AI
        </ToggleButton>
        <ToggleButton
          value="guidance"
          sx={{
            flex: 1,
            fontSize: '0.92rem',
            py: 0.2,
            px: 1.2,
            border: 'none',
            borderRadius: '0 8px 8px 0',
            color: selectedApi === 'guidance' ? 'primary.main' : 'text.secondary',
            bgcolor: selectedApi === 'guidance' ? 'grey.100' : 'background.paper',
            fontWeight: 500,
            minHeight: 32,
            minWidth: 0,
          }}
        >
          Guidance AI
        </ToggleButton>
      </ToggleButtonGroup>
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, background: 'background.paper', borderRadius: 2, boxShadow: 0, pb: 0, pt: 0 }}
      >
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '1rem',
              padding: '12px',
              background: 'background.paper',
            },
          }}
        />
        <IconButton type="submit" color="primary" disabled={loading || !input.trim()} sx={{ mb: 0.5, boxShadow: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' } }}>
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default InputField;
