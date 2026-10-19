import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Event Creation Dialog State
  const [openCreate, setOpenCreate] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    capacity: 50,
    waitlistCapacity: 25,
    department: '',
  });

  const categories = ['Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Technical', 'Career', 'Other'];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (timeFilter) params.timeFilter = timeFilter;

      const res = await api.get('/events', { params });
      setEvents(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, category, timeFilter]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data.data || []);
      } catch (_) {}
    };
    fetchDepts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      showSuccess('Event created and published successfully!');
      setOpenCreate(false);
      fetchEvents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create event.');
    }
  };

  const canCreate = ['admin', 'faculty', 'coordinator'].includes(user?.role);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Events & Activities
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Discover student workshops, hackathons, and symposiums across all departments
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 2.5 }}
          >
            Create Campus Event
          </Button>
        )}
      </Box>

      {/* Filters & Search */}
      <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search events by title, description, or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={6} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Timeline"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="upcoming">Upcoming Events</MenuItem>
              <MenuItem value="past">Past Events</MenuItem>
              <MenuItem value="all">All Events</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={1}>
            <Button variant="outlined" fullWidth onClick={handleSearchSubmit}>
              Filter
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Event Cards Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : events.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <EventIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No campus events match your criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {events.map((ev) => {
            const isFull = ev.currentRegisteredCount >= ev.capacity;
            const percentFilled = Math.min(100, Math.round((ev.currentRegisteredCount / ev.capacity) * 100));

            return (
              <Grid item xs={12} sm={6} md={4} key={ev._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                  onClick={() => navigate(`/events/${ev._id}`)}
                >
                  <Box
                    sx={{
                      height: 140,
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      p: 2,
                      color: '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip label={ev.category} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }} />
                      <Chip
                        label={isFull ? 'Waitlist Available' : `${ev.capacity - ev.currentRegisteredCount} Seats Left`}
                        size="small"
                        color={isFull ? 'warning' : 'success'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {ev.department?.name || 'Campus Wide'}
                    </Typography>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: 52 }}>
                      {ev.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, lineHeight: 1.4 }}>
                      {ev.description.substring(0, 95)}...
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                        <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                          {new Date(ev.startDate).toLocaleDateString()} at{' '}
                          {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#e11d48' }} />
                        <Typography variant="caption" sx={{ color: '#334155' }}>
                          {ev.venue}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Capacity Progress Bar */}
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Capacity ({ev.currentRegisteredCount}/{ev.capacity})
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {percentFilled}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={percentFilled} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
        </Box>
      )}

      {/* Create Event Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Campus Event</DialogTitle>
        <Box component="form" onSubmit={handleCreateEvent}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Event Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Venue or Location"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Auditorium Hall B"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="Start Date & Time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="End Date & Time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="Registration Deadline"
                  InputLabelProps={{ shrink: true }}
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Seat Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Waitlist Capacity"
                  value={formData.waitlistCapacity}
                  onChange={(e) => setFormData({ ...formData, waitlistCapacity: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Publish Event
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
