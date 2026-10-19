import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Campaign as AnnouncementIcon,
  Add as AddIcon,
  PushPin as PinIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const AnnouncementsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    targetAudience: 'All',
    isPinned: false,
  });

  const categories = ['General', 'Academic', 'Event', 'Emergency', 'Maintenance', 'Opportunity'];

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      const res = await api.get('/announcements', { params });
      setAnnouncements(res.data.data || []);
    } catch (err) {
      showError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [category]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', formData);
      showSuccess('Announcement broadcasted successfully!');
      setOpenCreate(false);
      fetchAnnouncements();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      showSuccess('Announcement removed.');
      fetchAnnouncements();
    } catch (err) {
      showError('Failed to delete announcement.');
    }
  };

  const canCreate = ['admin', 'faculty', 'coordinator'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Announcements
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Official notices, emergency bulletins, academic deadlines, and departmental updates
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
            Post Announcement
          </Button>
        )}
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Filter by Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 220, bgcolor: '#ffffff' }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* List */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : announcements.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No announcements found in this category.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {announcements.map((a) => (
            <Card
              key={a._id}
              sx={{
                p: 3,
                bgcolor: a.isPinned ? '#fffbeb' : '#ffffff',
                border: a.isPinned ? '1px solid #fef08a' : '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {a.isPinned && (
                    <Chip label="PINNED" size="small" color="warning" icon={<PinIcon />} sx={{ fontWeight: 800 }} />
                  )}
                  <Chip label={a.category} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  <Chip label={`Target: ${a.targetAudience}`} size="small" variant="outlined" />
                </Box>
                {user?.role === 'admin' && (
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(a._id)}>
                    Remove
                  </Button>
                )}
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a' }}>
                {a.title}
              </Typography>

              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                {a.content}
              </Typography>

              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Broadcasted by {a.author?.fullName || 'Campus Administration'} • {new Date(a.createdAt).toLocaleDateString()}
              </Typography>
            </Card>
          ))}
        </Stack>
      )}

      {/* Create Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Broadcast Campus Announcement</DialogTitle>
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
                  select
                  fullWidth
                  label="Target Audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                >
                  <MenuItem value="All">All Campus</MenuItem>
                  <MenuItem value="Department">My Department</MenuItem>
                  <MenuItem value="Role">Student Role</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={4}
                  label="Announcement Message Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Broadcast
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
