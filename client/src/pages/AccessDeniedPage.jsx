import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper } from '@mui/material';
import { Block as BlockIcon, Dashboard as DashboardIcon } from '@mui/icons-material';

export const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
      <Paper elevation={2} sx={{ p: 5, borderRadius: 4, border: '1px solid #fee2e2', bgcolor: '#fff5f5' }}>
        <BlockIcon sx={{ fontSize: 72, color: '#ef4444', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#dc2626', mb: 1 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ color: '#475569', mb: 3 }}>
          You do not possess the required role permissions to access this administrative or operational area.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DashboardIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: 2.5 }}
        >
          Return to My Dashboard
        </Button>
      </Paper>
    </Container>
  );
};
