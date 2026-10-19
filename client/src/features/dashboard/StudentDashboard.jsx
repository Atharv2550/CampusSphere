import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  Skeleton,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  Search as SearchIcon,
  Storefront as MarketplaceIcon,
  School as TutoringIcon,
  MeetingRoom as ResourceIcon,
  Campaign as AnnouncementIcon,
  VolunteerActivism as VolunteerIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  QrCode as CodeIcon,
  Check as ConfirmedIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard');
      setDashboardData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={fetchDashboard}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  const {
    upcomingRegisteredEvents = [],
    recommendedEvents = [],
    announcements = [],
    myLostReports = [],
    possibleMatches = [],
    myListings = [],
    myRequests = [],
    upcomingSessions = [],
    clubMemberships = [],
    myBookings = [],
    unreadNotifications = 0,
  } = dashboardData || {};

  return (
    <Box>
      {/* Welcome Banner */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 70%, #0d9488 100%)',
          color: '#ffffff',
          mb: 4,
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              label={`${user?.department?.name || 'Campus Member'} • ${user?.academicYear || 'Student'}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 700, mb: 1.5 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.fullName}!
            </Typography>
            <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 600 }}>
              You have <strong>{upcomingRegisteredEvents.length}</strong> upcoming registered events and{' '}
              <strong>{unreadNotifications}</strong> unread campus notifications today.
            </Typography>
          </Grid>

          {/* Quick Actions Bar */}
          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/events')}
                sx={{ bgcolor: '#ffffff', color: '#0f172a', fontWeight: 700, '&:hover': { bgcolor: '#f1f5f9' } }}
              >
                Find Events
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/lost-found')}
                sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff', '&:hover': { borderColor: '#ffffff' } }}
              >
                Lost & Found
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ResourceIcon />}
                onClick={() => navigate('/bookings')}
                sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff', '&:hover': { borderColor: '#ffffff' } }}
              >
                Book Resource
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Confirmed Events
                </Typography>
                <EventIcon sx={{ color: '#2563eb' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {upcomingRegisteredEvents.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Tutoring Sessions
                </Typography>
                <TutoringIcon sx={{ color: '#7c3aed' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {upcomingSessions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Clubs Enrolled
                </Typography>
                <ClubsIcon sx={{ color: '#0d9488' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {clubMemberships.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Resource Bookings
                </Typography>
                <ResourceIcon sx={{ color: '#e11d48' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {myBookings.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Registered Events & Recommended Events */}
        <Grid item xs={12} lg={8}>
          {/* Upcoming Registered Events */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3.5, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                My Registered Events & Check-In Codes
              </Typography>
              <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/events')}>
                All Events
              </Button>
            </Box>

            {upcomingRegisteredEvents.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  You haven't registered for any upcoming events yet.
                </Typography>
                <Button variant="outlined" size="small" onClick={() => navigate('/events')}>
                  Browse Campus Events
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {upcomingRegisteredEvents.map((event) => (
                  <Card key={event._id} sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={event.category} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                        <Chip
                          label={event.registrationStatus === 'waitlisted' ? `Waitlist #${event.waitlistPosition}` : 'Confirmed'}
                          size="small"
                          color={event.registrationStatus === 'waitlisted' ? 'warning' : 'success'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 14 }} /> {event.venue} • <TimeIcon sx={{ fontSize: 14 }} /> {new Date(event.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {event.registrationStatus === 'registered' && (
                      <Box sx={{ textAlign: { sm: 'right' }, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                          CHECK-IN PIN
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#15803d', letterSpacing: '0.1em' }}>
                          {event.checkInCode}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Recommended Events For You */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3.5, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Recommended for Your Interests
            </Typography>
            <Grid container spacing={2}>
              {recommendedEvents.slice(0, 2).map((ev) => (
                <Grid item xs={12} sm={6} key={ev._id}>
                  <Card sx={{ height: '100%', p: 2, cursor: 'pointer' }} onClick={() => navigate(`/events/${ev._id}`)}>
                    <Chip label={ev.category} size="small" sx={{ mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, minHeight: 40 }}>
                      {ev.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                      {ev.venue} • {new Date(ev.startDate).toLocaleDateString()}
                    </Typography>
                    <Button size="small" variant="outlined" fullWidth>
                      View Details & Register
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Lost & Found Matches Alert */}
          {possibleMatches.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #bae6fd', bgcolor: '#f0f9ff', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <SearchIcon sx={{ color: '#0284c7' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0369a1' }}>
                  Smart Match Suggestions for Your Items
                </Typography>
              </Box>
              {possibleMatches.map((pm, idx) => (
                <Box key={idx} sx={{ mb: 1.5, p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e0f2fe' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    For your report "{pm.itemTitle}":
                  </Typography>
                  {pm.matches.map((m, mIdx) => (
                    <Box key={mIdx} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Chip label={`${m.matchPercentage}% Match`} size="small" color="primary" sx={{ fontWeight: 700, mr: 1 }} />
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                          {m.item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Reason: {m.explanation}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/lost-found/${m.item._id}`)}>
                        Inspect
                      </Button>
                    </Box>
                  ))}
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Right Column: Announcements, Tutoring, Marketplace */}
        <Grid item xs={12} lg={4}>
          {/* Pinned Campus Announcements */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnnouncementIcon fontSize="small" sx={{ color: '#2563eb' }} /> Announcements
              </Typography>
              <Button size="small" onClick={() => navigate('/announcements')}>
                View All
              </Button>
            </Box>

            <Stack spacing={2}>
              {announcements.slice(0, 3).map((a) => (
                <Box key={a._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: a.isPinned ? '#fefce8' : '#f8fafc', border: a.isPinned ? '1px solid #fef08a' : '1px solid #f1f5f9' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    {a.isPinned && <Chip label="PINNED" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />}
                    <Chip label={a.category} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {a.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                    {a.content.substring(0, 90)}...
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Peer Tutoring Quick Card */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Peer Tutoring
              </Typography>
              <Button size="small" onClick={() => navigate('/tutoring')}>
                Find Tutor
              </Button>
            </Box>
            {upcomingSessions.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No active tutoring sessions scheduled. Book a slot with a peer mentor!
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {upcomingSessions.map((s) => (
                  <Box key={s._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {s.subject}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {new Date(s.date).toLocaleDateString()} • {s.startTime} - {s.endTime}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Active Marketplace Activity */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Marketplace Requests
              </Typography>
              <Button size="small" onClick={() => navigate('/marketplace')}>
                Marketplace
              </Button>
            </Box>
            {myRequests.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No active buy or exchange requests pending.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {myRequests.map((r) => (
                  <Box key={r._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {r.listing?.title}
                    </Typography>
                    <Chip label={r.status} size="small" color={r.status === 'Accepted' ? 'success' : 'default'} sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
