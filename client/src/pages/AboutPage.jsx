import React from 'react';
import { Container, Box, Typography, Paper, Grid, Stack } from '@mui/material';
import { CheckCircle as CheckIcon, School as CampusIcon, Group as CommunityIcon } from '@mui/icons-material';

export const AboutPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
          About CampusSphere
        </Typography>
        <Typography variant="h6" sx={{ color: '#64748b', maxWidth: 700, mx: 'auto' }}>
          One Campus. One Community. Endless Possibilities.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#2563eb' }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7, mb: 2 }}>
              Colleges and universities are dynamic ecosystems brimming with intellectual potential. Yet, crucial campus experiences—registering for club hackathons, retrieving a lost calculator, exchanging textbooks, booking research labs, and finding a tutor—remain fragmented across dispersed noticeboards and chat groups.
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7 }}>
              CampusSphere unites these core workflows into one verified digital community where trust, safety, and mutual collaboration thrive.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0d9488' }}>
              Guiding Principles
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <CheckIcon sx={{ color: '#0d9488' }} />
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Server-Enforced Trust:</strong> Zero self-promotion to admin roles; strict RBAC across every endpoint.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <CheckIcon sx={{ color: '#0d9488' }} />
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Atomic Fairness:</strong> Event capacities, waitlist promotions, and resource bookings prevent double bookings and race conditions.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <CheckIcon sx={{ color: '#0d9488' }} />
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                  <strong>Private & Safe Verification:</strong> Lost item proof-of-ownership is submitted privately to authorized reviewers without public leaks.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
