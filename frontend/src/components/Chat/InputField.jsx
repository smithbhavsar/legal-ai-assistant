import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
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
    <Box>
      <ToggleButtonGroup
        value={selectedApi}
        exclusive
        onChange={(_, value) => value && setSelectedApi(value)}
        size="small"
        sx={{ mb: 1, width: '100%', justifyContent: 'center', background: 'background.paper', borderRadius: 2, boxShadow: 0, border: '1px solid', borderColor: 'divider', gap: 0 }}
      >
        <ToggleButton value="research" sx={{ flex: 1, fontSize: '0.95rem', py: 0.5, border: 'none', borderRadius: '8px 0 0 8px', color: selectedApi === 'research' ? 'primary.main' : 'text.secondary', bgcolor: selectedApi === 'research' ? 'grey.100' : 'background.paper', fontWeight: 600 }}>
          Research AI
        </ToggleButton>
        <ToggleButton value="guidance" sx={{ flex: 1, fontSize: '0.95rem', py: 0.5, border: 'none', borderRadius: '0 8px 8px 0', color: selectedApi === 'guidance' ? 'primary.main' : 'text.secondary', bgcolor: selectedApi === 'guidance' ? 'grey.100' : 'background.paper', fontWeight: 600 }}>
          Guidance AI
        </ToggleButton>
      </ToggleButtonGroup>
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, background: 'background.paper', borderRadius: 2, boxShadow: 0, pb: 0, pt: 0 }}
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
        <IconButton type="submit" color="primary" disabled={loading || !input.trim()} sx={{ mb: 0.5 }}>
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default InputField;
