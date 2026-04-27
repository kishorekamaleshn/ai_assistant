import React from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MessageBubble from './MessageBubble';
import type { Message } from '../types';

interface ChatPageProps {
  messages: Message[];
  inputValue: string;
  isQuerying: boolean;
  useStreaming: boolean;
  toastError: string;
  retryText: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendQuery: (e?: React.FormEvent, textToSubmit?: string) => void;
  onStreamingToggle: (enabled: boolean) => void;
  onLogout: () => void;
  onToastClose: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  inputValue,
  isQuerying,
  useStreaming,
  toastError,
  retryText,
  messagesEndRef,
  onInputChange,
  onSendQuery,
  onStreamingToggle,
  onLogout,
  onToastClose,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SmartToyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Query Assistant
          </Typography>
          <IconButton color="inherit" onClick={onLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="md"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          overflow: 'hidden',
        }}
      >
        {/* Chat History */}
        <Paper
          elevation={2}
          sx={{
            flexGrow: 1,
            mb: 3,
            p: 2,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: 3,
            backgroundColor: 'background.default',
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <SmartToyIcon sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
              <Typography variant="h6">How can I help you today?</Typography>
              <Typography variant="body2">Type your query below to get started.</Typography>
            </Box>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {/* Loading indicator for non-streaming mode only */}
          {isQuerying && !useStreaming && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                mt: 1,
              }}
            >
              <Box
                sx={{
                  mr: 1,
                  p: 1,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                }}
              >
                <SmartToyIcon fontSize="small" />
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderTopLeftRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Paper>

        {/* Streaming Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                color="secondary"
                checked={useStreaming}
                onChange={(e) => onStreamingToggle(e.target.checked)}
                disabled={isQuerying}
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Stream Response
              </Typography>
            }
          />
        </Box>

        {/* Input Form */}
        <Box
          component="form"
          onSubmit={onSendQuery}
          sx={{ display: 'flex', gap: 1 }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isQuerying}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.paper',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!inputValue.trim() || isQuerying}
            sx={{ borderRadius: 3, minWidth: '56px', px: 3 }}
          >
            {isQuerying ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </Container>

      {/* Error Toast with Retry */}
      <Snackbar
        open={!!toastError}
        autoHideDuration={6000}
        onClose={onToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={onToastClose}
          severity="error"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => onSendQuery(undefined, retryText)}
            >
              RETRY
            </Button>
          }
        >
          {toastError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage;
