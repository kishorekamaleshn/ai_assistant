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
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface LoginPageProps {
  username: string;
  password: string;
  loginError: string;
  isLoggingIn: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  username,
  password,
  loginError,
  isLoggingIn,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}) => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <SmartToyIcon color="primary" sx={{ fontSize: 40 }} />
          </Box>

          <Typography component="h1" variant="h5" align="center" gutterBottom>
            AI Query Assistant
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Sign in to continue
          </Typography>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoFocus
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ display: 'block' }}
            >
              Hint: use admin / password
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
