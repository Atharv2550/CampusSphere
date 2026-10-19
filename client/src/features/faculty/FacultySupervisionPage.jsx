import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Avatar,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  SupervisorAccount as SupervisionIcon,
  Groups as ClubsIcon,
  Event as EventIcon,
  VolunteerActivism as VolunteerIcon,
  CheckCircle as VerifiedIcon,
  ArrowForward as ArrowIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultySupervisionPage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ clubs: [], events: [], volunteering: [], metrics: {} });
  const [tab, setTab] = useState(0); // 0 = Clubs, 1 = Events, 2 = Volunteering

  const fetchSupervisionData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/supervision');
      setData(res.data.data);
    } catch (err) {
      console.error('Supervision fetch error:', err);
      showError('Failed to load faculty supervision data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisionData();
  }, []);

  const { clubs = [], events = [], volunteering = [], metrics = {} } = data;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <SupervisionIcon sx={{ color: '#2563eb', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Student & Club Supervision
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Supervised student organizations, campus activities, and verified community service initiatives
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                SUPERVISED CLUBS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {metrics.clubsCount || clubs.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0d9488' }}>
                Active faculty advisor
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                SUPERVISED EVENTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {metrics.eventsCount || events.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#2563eb' }}>
                Department & club activities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                VOLUNTEERING DRIVES
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {metrics.volunteeringCount || volunteering.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7c3aed' }}>
                Community service projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                VERIFIED SERVICE HOURS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a', mt: 0.5 }}>
                {metrics.totalVerifiedHours || 0} hrs
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a' }}>
                Supervised student hours verified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 } }}
        >
          <Tab label={`Clubs & Societies (${clubs.length})`} />
          <Tab label={`Supervised Events (${events.length})`} />
          <Tab label={`Volunteering Activities (${volunteering.length})`} />
        </Tabs>
      </Paper>

      {/* Tab 0: Supervised Clubs */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {clubs.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <ClubsIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>No assigned clubs</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  You are not currently registered as the faculty advisor for any student club.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            clubs.map((c) => (
              <Grid item xs={12} md={6} key={c._id}>
                <Card sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Chip label={c.category} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    <Chip label={c.status} size="small" color="success" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    {c.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    {c.description}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={1} sx={{ mb: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Department: <strong>{c.department?.name || 'Computer Science & Engineering'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Lead Coordinator: <strong>{c.coordinators?.[0]?.fullName || 'Sarah Jenkins'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Active Members: <strong>{c.memberCount || 34} registered students</strong>
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate(`/clubs/${c._id}`)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    View Club Details & Committee
                  </Button>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Tab 1: Supervised Events */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {events.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <EventIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>No events supervised</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No campus events are currently listed under your departmental supervision.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            events.map((ev) => (
              <Grid item xs={12} md={6} key={ev._id}>
                <Card sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={ev.status} size="small" color={ev.status === 'Published' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {new Date(ev.startDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    {ev.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    {ev.description}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#475569' }}>📍 {ev.venue}</Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>👥 {ev.currentRegisteredCount || 0} / {ev.capacity || 50} Registered</Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate(`/events/${ev._id}`)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    View Participant Roster & Attendance
                  </Button>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Tab 2: Supervised Volunteering */}
      {tab === 2 && (
        <Grid container spacing={3}>
          {volunteering.length === 0 ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <VolunteerIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>No volunteering drives</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No community service activities are currently registered under your supervision.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            volunteering.map((v) => (
              <Grid item xs={12} md={6} key={v._id}>
                <Card sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={`${v.hours} Service Hours`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {new Date(v.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    {v.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    {v.description}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#475569' }}>📍 {v.venue}</Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>Capacity: {v.capacity || 20} Volunteers</Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/faculty/approvals')}
                    sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                  >
                    Verify Participant Hours
                  </Button>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};
