import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message: msg }) => {
  const isUser = msg.sender === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {!isUser && (
        <Box
          sx={{
            mr: 1,
            mt: 1,
            p: 1,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
          }}
        >
          <SmartToyIcon fontSize="small" />
        </Box>
      )}

      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          borderRadius: 3,
          bgcolor: isUser
            ? 'primary.main'
            : msg.error
              ? 'error.main'
              : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderTopRightRadius: isUser ? 4 : undefined,
          borderTopLeftRadius: !isUser ? 4 : undefined,
        }}
      >
        <Typography
          variant="body1"
          component="div"
          sx={{
            '& p': { m: 0, mb: 1, whiteSpace: 'pre-wrap' },
            '& p:last-child': { mb: 0 },
            '& pre': {
              bgcolor: 'rgba(0,0,0,0.3)',
              p: 1.5,
              borderRadius: 2,
              overflowX: 'auto',
              my: 1,
            },
            '& code': {
              fontFamily: 'monospace',
              bgcolor: 'rgba(0,0,0,0.2)',
              px: 0.5,
              py: 0.2,
              borderRadius: 1,
            },
            '& pre code': {
              bgcolor: 'transparent',
              p: 0,
            },
            minHeight: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {msg.text ? (
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          ) : (
            msg.sender === 'ai' && <CircularProgress size={16} />
          )}
        </Typography>
      </Paper>

      {isUser && (
        <Box
          sx={{
            ml: 1,
            mt: 1,
            p: 1,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            display: 'flex',
          }}
        >
          <PersonIcon fontSize="small" />
        </Box>
      )}
    </Box>
  );
};

export default MessageBubble;
