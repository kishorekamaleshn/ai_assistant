import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { login, queryAssistant, queryAssistantStream, getAuthToken, clearAuthToken, ApiError } from './services/api';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import type { Message } from './types';

// Modern dark theme — defined once at the module level
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  // --- Auth state ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // --- Login form state ---
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Chat state ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Error toast state ---
  const [toastError, setToastError] = useState('');
  const [retryText, setRetryText] = useState('');

  // Restore session from localStorage on first render
  useEffect(() => {
    const token = getAuthToken();
    if (token) setIsAuthenticated(true);
    setAuthChecking(false);
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(username, password);
      setIsAuthenticated(true);
      setMessages([]); // Clear any previous session messages
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setMessages([]);
  };

  const removeTrailingAiPlaceholder = (msgs: Message[]) => {
    const lastMessage = msgs[msgs.length - 1];
    if (lastMessage?.sender === 'ai' && lastMessage.text.trim() === '') {
      return msgs.slice(0, -1);
    }
    return msgs;
  };

  const handleSendQuery = async (e?: React.FormEvent, textToSubmit?: string) => {
    if (e) e.preventDefault();
    const userText = textToSubmit || inputValue.trim();
    if (!userText || isQuerying) return;

    const cleanedMessages = messages.filter((msg) => !(msg.sender === 'ai' && msg.text.trim() === ''));
    const lastUserMessage = [...cleanedMessages].reverse().find((msg) => msg.sender === 'user');
    const isRetry = lastUserMessage?.text === userText;
    const historyToPass = isRetry ? cleanedMessages.slice(0, -1) : cleanedMessages;

    if (!isRetry) {
      setMessages((prev) => [...removeTrailingAiPlaceholder(prev), { id: Date.now(), text: userText, sender: 'user' }]);
    } else {
      setMessages((prev) => removeTrailingAiPlaceholder(prev));
    }
    if (!textToSubmit) setInputValue('');

    setIsQuerying(true);
    setToastError('');
    setRetryText('');

    try {
      if (useStreaming) {
        const aiMessageId = Date.now() + Math.random();
        setMessages((prev) => [...removeTrailingAiPlaceholder(prev), { id: aiMessageId, text: '', sender: 'ai' }]);

        await queryAssistantStream(userText, historyToPass, (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
            )
          );
        });
      } else {
        const data = await queryAssistant(userText, historyToPass);
        setMessages((prev) => [...removeTrailingAiPlaceholder(prev), { id: Date.now(), text: data.response, sender: 'ai' }]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleLogout();
        return;
      }
      setMessages((prev) => prev.filter((msg) => !(msg.sender === 'ai' && msg.text.trim() === '')));
      // Format error as: CODE - MESSAGE
      const errorMessage = err instanceof ApiError 
        ? `${err.status} - ${err.message}`
        : err instanceof Error ? err.message : 'Failed to get response';
      setToastError(errorMessage);
      setRetryText(userText);
    } finally {
      setIsQuerying(false);
    }
  };

  // --- Render ---

  // Show a spinner while checking localStorage for an existing session
  if (authChecking) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? (
        <ChatPage
          messages={messages}
          inputValue={inputValue}
          isQuerying={isQuerying}
          useStreaming={useStreaming}
          toastError={toastError}
          retryText={retryText}
          messagesEndRef={messagesEndRef}
          onInputChange={setInputValue}
          onSendQuery={handleSendQuery}
          onStreamingToggle={setUseStreaming}
          onLogout={handleLogout}
          onToastClose={() => setToastError('')}
        />
      ) : (
        <LoginPage
          username={username}
          password={password}
          loginError={loginError}
          isLoggingIn={isLoggingIn}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
