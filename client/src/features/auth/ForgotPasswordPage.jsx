import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [devCode, setDevCode] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetCode) {
        setDevCode(res.data.resetCode);
        setResetCode(res.data.resetCode);
      }
      setStep(2);
      showSuccess('Reset instructions generated.');
    } catch (err) {
      showError(err.response?.data?.message || 'Error requesting reset.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/reset-password', { email, resetCode, newPassword });
      setMessage(res.data.message);
      setStep(3);
      showSuccess('Password reset successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Error resetting password.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
          Reset Password
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Enter your registered email address to receive password reset instructions.
        </Typography>

        {devCode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Development Demo: Reset verification code is <strong>{devCode}</strong>
          </Alert>
        )}

        {step === 1 && (
          <Box component="form" onSubmit={handleRequestCode}>
            <TextField
              required
              fullWidth
              label="College Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" fullWidth variant="contained" color="secondary" size="large">
              Request Reset Code
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <TextField
              required
              fullWidth
              label="Reset Code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" fullWidth variant="contained" color="secondary" size="large">
              Set New Password
            </Button>
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been successfully updated!
            </Alert>
            <Button component={RouterLink} to="/login" variant="contained" color="primary">
              Back to Login
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <RouterLink to="/login" style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
            Remember your password? Sign in
          </RouterLink>
        </Box>
      </Paper>
    </Container>
  );
};
