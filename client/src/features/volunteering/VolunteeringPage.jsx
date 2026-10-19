import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  VolunteerActivism as VolunteerIcon,
  Add as AddIcon,
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const VolunteeringPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '13:00',
    allocatedHours: 4,
    capacity: 25,
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/volunteering');
      setActivities(res.data.data || []);
    } catch (_) {
      showError('Failed to load volunteering drives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRegister = async (activityId) => {
    try {
      const res = await api.post(`/volunteering/${activityId}/register`);
      showSuccess(res.data.message);
      fetchActivities();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to register.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/volunteering', formData);
      showSuccess('Volunteering opportunity published successfully!');
      setOpenCreate(false);
      fetchActivities();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create activity.');
    }
  };

  const canCreate = ['admin', 'faculty', 'coordinator'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Volunteering & Community Service
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Give back to the campus and local community. Earn verified hours and downloadable completion certificates.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CertificateIcon />}
            onClick={() => navigate('/volunteering/my-records')}
            sx={{ borderRadius: 2.5 }}
          >
            My Verified Hours & Certificates
          </Button>

          {canCreate && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreate(true)}
              sx={{ borderRadius: 2.5 }}
            >
              Publish Opportunity
            </Button>
          )}
        </Stack>
      </Box>

      {/* Opportunities Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : activities.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <VolunteerIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No active volunteering drives right now.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3.5}>
          {activities.map((act) => {
            const isFull = act.currentRegisteredCount >= act.capacity;
            return (
              <Grid item xs={12} sm={6} md={4} key={act._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Chip label={`${act.allocatedHours} Hours Credit`} size="small" color="success" sx={{ fontWeight: 800 }} />
                      <Chip label={act.status} size="small" color={act.status === 'Open' ? 'primary' : 'default'} />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: 52 }}>
                      {act.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, lineHeight: 1.4 }}>
                      {act.description.substring(0, 95)}...
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                        <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                          {new Date(act.date).toLocaleDateString()} ({act.startTime} - {act.endTime})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#e11d48' }} />
                        <Typography variant="caption" sx={{ color: '#334155' }}>
                          {act.venue}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      disabled={isFull || act.status !== 'Open'}
                      onClick={() => handleRegister(act._id)}
                      sx={{ mt: 'auto', borderRadius: 2 }}
                    >
                      {isFull ? 'Opportunity Full' : 'Volunteer Now'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Publish Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Publish Volunteering Opportunity</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Red Cross Blood Donation Support Drive"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Description & Responsibilities"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="End Time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Allocated Hours"
                  value={formData.allocatedHours}
                  onChange={(e) => setFormData({ ...formData, allocatedHours: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Publish
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
