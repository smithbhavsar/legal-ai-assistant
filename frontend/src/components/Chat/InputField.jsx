import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../../context/ChatContext';

const InputField = ({ loading }) => {
  const [input, setInput] = useState('');
  const { sendMessage } = useChat();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSendMessage}
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        }}
      />
      <IconButton type="submit" color="primary" disabled={loading || !input.trim()}>
        {loading ? <CircularProgress size={24} /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};

export default InputField;
