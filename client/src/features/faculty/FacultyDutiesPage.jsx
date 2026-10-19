import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  SwapHoriz as DutiesIcon,
  AssignmentTurnedIn as CompleteIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  CheckCircle as AckIcon,
  Person as PersonIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultyDutiesPage = () => {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [duties, setDuties] = useState([]);
  const [tab, setTab] = useState(0); // 0 = All, 1 = Substitutions, 2 = Exam Invigilations, 3 = Meetings & Events

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/duties/my');
      setDuties(res.data.data || []);
    } catch (err) {
      console.error('Failed to load duties:', err);
      showError('Failed to load duties and substitution assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/duties/${id}/status`, { status: newStatus });
      showSuccess(`Duty marked as ${newStatus}!`);
      setDuties((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      showError('Failed to update duty status.');
    }
  };

  // Filter duties by tab
  const filteredDuties = duties.filter((d) => {
    if (tab === 1) return d.type === 'Substitution';
    if (tab === 2) return d.type === 'Examination Invigilation';
    if (tab === 3) return d.type !== 'Substitution' && d.type !== 'Examination Invigilation';
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: '#faf5ff', borderRadius: 2 }}>
            <DutiesIcon sx={{ color: '#9333ea', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Substitutions & Faculty Academic Duties
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Examination invigilation schedules, temporary lecture substitutions, and authorized administrative responsibilities
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 } }}
        >
          <Tab label={`All Assignments (${duties.length})`} />
          <Tab label={`Substitutions (${duties.filter((d) => d.type === 'Substitution').length})`} />
          <Tab label={`Exam Duties (${duties.filter((d) => d.type === 'Examination Invigilation').length})`} />
          <Tab label={`Meetings & Committee (${duties.filter((d) => d.type !== 'Substitution' && d.type !== 'Examination Invigilation').length})`} />
        </Tabs>
      </Paper>

      {/* Duties List */}
      {filteredDuties.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CompleteIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
            No duty assignments in this category
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            All current academic assignments are up to date.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredDuties.map((duty) => (
            <Grid item xs={12} md={6} key={duty._id}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#94a3b8', boxShadow: '0 6px 20px rgba(0,0,0,0.05)' },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip
                      label={duty.type}
                      color={
                        duty.type === 'Substitution'
                          ? 'secondary'
                          : duty.type === 'Examination Invigilation'
                          ? 'warning'
                          : 'primary'
                      }
                      sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                    />
                    <Chip
                      label={duty.status}
                      color={
                        duty.status === 'Completed'
                          ? 'success'
                          : duty.status === 'Acknowledged'
                          ? 'info'
                          : 'default'
                      }
                      sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    {duty.title}
                  </Typography>

                  {duty.reason && (
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      Reason: {duty.reason}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1} sx={{ mb: 2.5, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                        {new Date(duty.date).toLocaleDateString()} • {duty.startTime} – {duty.endTime}
                      </Typography>
                    </Box>

                    {duty.room && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ color: '#0284c7', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                          Location: {duty.room}
                        </Typography>
                      </Box>
                    )}

                    {duty.originalFaculty && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ color: '#7c3aed', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          Substituting for: <strong>Prof. {duty.originalFaculty.fullName}</strong>
                        </Typography>
                      </Box>
                    )}

                    {duty.notes && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>
                        Note: {duty.notes}
                      </Typography>
                    )}
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" spacing={1.5}>
                    {duty.status === 'Assigned' && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AckIcon />}
                        onClick={() => handleUpdateStatus(duty._id, 'Acknowledged')}
                        sx={{
                          bgcolor: '#2563eb',
                          '&:hover': { bgcolor: '#1d4ed8' },
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        Acknowledge Duty
                      </Button>
                    )}

                    {duty.status === 'Acknowledged' && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CompleteIcon />}
                        onClick={() => handleUpdateStatus(duty._id, 'Completed')}
                        sx={{
                          bgcolor: '#16a34a',
                          '&:hover': { bgcolor: '#15803d' },
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        Mark Completed
                      </Button>
                    )}

                    {duty.status === 'Completed' && (
                      <Button variant="outlined" fullWidth disabled sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Completed & Verified
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
