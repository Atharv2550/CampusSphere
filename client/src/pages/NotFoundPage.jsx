import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { SentimentDissatisfied as SadIcon, Home as HomeIcon } from '@mui/icons-material';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
      <Paper elevation={2} sx={{ p: 5, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <SadIcon sx={{ fontSize: 72, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h2" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Page Not Found
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
          The campus destination you are looking for does not exist or may have been relocated.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ borderRadius: 2.5, px: 3, py: 1.2 }}
        >
          Return to CampusSphere
        </Button>
      </Paper>
    </Container>
  );
};
