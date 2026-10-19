import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';
import { Lightbulb as LogoIcon, School as CampusIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export const PublicLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Public Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <LogoIcon fontSize="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                CampusSphere
              </Typography>
            </Box>

            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
              <Button component={RouterLink} to="/features" color="inherit" sx={{ fontWeight: 600 }}>
                Features
              </Button>
              <Button component={RouterLink} to="/about" color="inherit" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}>
                About
              </Button>
              {isAuthenticated ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/dashboard')}
                  sx={{ borderRadius: 2 }}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" variant="outlined" color="primary" sx={{ borderRadius: 2 }}>
                    Log In
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained" color="secondary" sx={{ borderRadius: 2 }}>
                    Get Started
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Page Content */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#0f172a', color: '#94a3b8', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 4, mb: 4 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <LogoIcon fontSize="small" />
                </Box>
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800 }}>
                  CampusSphere
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ maxWidth: 360, mb: 2 }}>
                One Campus. One Community. Endless Possibilities. The unified digital ecosystem for students, faculty, clubs, and campus administrators.
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                &copy; {new Date().getFullYear()} CampusSphere Inc. All rights reserved.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700, mb: 1.5 }}>
                Platform Modules
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Campus Events
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Lost & Found
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Student Marketplace
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Peer Tutoring
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Resource Booking
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700, mb: 1.5 }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" component={RouterLink} to="/features" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Features Overview
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/about" sx={{ '&:hover': { color: '#ffffff' } }}>
                  About Platform
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/login" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Demo Accounts
                </Typography>
                <Typography variant="body2" component={RouterLink} to="/register" sx={{ '&:hover': { color: '#ffffff' } }}>
                  Student Sign Up
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
