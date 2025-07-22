import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import AssistantIcon from '@mui/icons-material/Assistant';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import ConfidenceBadge from './ConfidenceBadge';
import CitationDisplay from './CitationDisplay';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user' || message.type === 'user';
  const formattedTime = message.timestamp && dayjs(message.timestamp).isValid()
    ? dayjs(message.timestamp).format('MMM D, YYYY – h:mm A')
    : '';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: { xs: 1, md: 2 },
        px: { xs: 0.5, md: 2 },
        gap: 1.5,
      }}
    >
      {/* AI Avatar */}
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, boxShadow: 1 }}>
          <AssistantIcon />
        </Avatar>
      )}
      <Box>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1.2, md: 2 },
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'common.white' : 'text.primary',
            borderRadius: isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            fontFamily: 'Inter, Roboto, sans-serif',
            maxWidth: { xs: '80vw', md: '80%' },
            minWidth: '60px',
            wordBreak: 'break-word',
            transition: 'background 0.2s',
          }}
        >
          {isUser ? (
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.08rem' },
                lineHeight: 1.7,
                wordBreak: 'normal',
                overflowWrap: 'anywhere',
                whiteSpace: 'normal',
                maxWidth: { xs: '80vw', md: '80%' },
              }}
            >
              {message.content}
            </Typography>
          ) : (
            <>
              <ReactMarkdown
                children={message.content}
                components={{
                  p: ({ node, ...props }) => <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.7, mb: 1 }} {...props} />,
                  ul: ({ node, ...props }) => <ul style={{ marginLeft: 18, marginBottom: 8 }} {...props} />,
                  ol: ({ node, ...props }) => <ol style={{ marginLeft: 18, marginBottom: 8 }} {...props} />,
                  li: ({ node, ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
                  strong: ({ node, ...props }) => <strong style={{ fontWeight: 600 }} {...props} />,
                  em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                  code: ({ node, ...props }) => <code style={{ background: '#f5f5f5', borderRadius: 4, padding: '2px 4px', fontSize: '0.95em' }} {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid #e0e0e0', margin: 0, paddingLeft: 12, color: '#666', fontStyle: 'italic', background: '#fafafa' }} {...props} />,
                  table: ({ node, ...props }) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 8 }} {...props} />,
                  th: ({ node, ...props }) => <th style={{ border: '1px solid #e0e0e0', padding: 4, background: '#f5f5f5' }} {...props} />,
                  td: ({ node, ...props }) => <td style={{ border: '1px solid #e0e0e0', padding: 4 }} {...props} />,
                  a: ({ node, ...props }) => <a style={{ color: '#1976d2', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
                }}
              />
              {/* Confidence badge and citations for AI answers */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {typeof message.confidence === 'number' && (
                  <ConfidenceBadge confidence={message.confidence} />
                )}
              </Box>
              {Array.isArray(message.citations) && message.citations.length > 0 && (
                <CitationDisplay citations={message.citations} />
              )}
            </>
          )}
        </Paper>
        {formattedTime && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: isUser ? 'right' : 'left', fontSize: '0.78rem' }}>
            {formattedTime}
          </Typography>
        )}
      </Box>
      {/* User Avatar */}
      {isUser && (
        <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main', width: 36, height: 36, boxShadow: 1 }}>
          <PersonIcon />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
