import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Lightbulb as LogoIcon, LockOutlined as LockIcon } from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(email, password);
      showSuccess('Welcome back to CampusSphere!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      showSuccess('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              mb: 1.5,
            }}
          >
            <LockIcon />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Log in to access your personalized CampusSphere dashboard
          </Typography>
        </Box>

        {sessionExpired && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Your session has expired. Please log in again to continue.
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="College Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@campussphere.edu"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
            <RouterLink to="/forgot-password" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}>
              Forgot password?
            </RouterLink>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="secondary"
            size="large"
            disabled={loading}
            sx={{ py: 1.3, borderRadius: 2.5, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              New to CampusSphere?{' '}
              <RouterLink to="/register" style={{ color: '#2563eb', fontWeight: 700 }}>
                Create a student account
              </RouterLink>
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
            QUICK 1-CLICK DEMO ACCOUNTS
          </Typography>
        </Divider>

        {/* Demo Fast Fill Buttons */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDemoFill('student@campussphere.edu', 'Student@123')}
            sx={{ borderRadius: 2 }}
          >
            Student
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDemoFill('admin@campussphere.edu', 'Admin@123')}
            sx={{ borderRadius: 2 }}
          >
            Admin
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => handleDemoFill('faculty@campussphere.edu', 'Faculty@123')}
            sx={{ borderRadius: 2 }}
          >
            Faculty
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => handleDemoFill('coordinator@campussphere.edu', 'Coordinator@123')}
            sx={{ borderRadius: 2 }}
          >
            Coordinator
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="info"
            onClick={() => handleDemoFill('resourcemanager@campussphere.edu', 'Manager@123')}
            sx={{ borderRadius: 2 }}
          >
            Manager
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
