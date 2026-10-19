import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, AccountCircle as ProfileIcon } from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    studentId: user?.studentId || '',
    phoneNumber: user?.phoneNumber || '',
    academicYear: user?.academicYear || '1st Year',
    interests: user?.interests ? user.interests.join(', ') : '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const interestsArray = formData.interests.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.put('/users/profile', {
        ...formData,
        interests: interestsArray,
      });
      updateUser(res.data.data);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="md" sx={{ mx: 'auto' }}>
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#2563eb',
              fontSize: '2rem',
              fontWeight: 800,
            }}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {user?.fullName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={user?.role?.toUpperCase()} color="primary" size="small" sx={{ fontWeight: 700 }} />
              <Chip label={user?.department?.name || 'Department Member'} size="small" />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student / Staff ID"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Areas of Interest (Comma separated, for personalized recommendations)"
                placeholder="Hackathons, Web Development, Robotics, Photography"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Bio & Student Summary"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<SaveIcon />}
            disabled={loading}
            sx={{ mt: 3, py: 1.2, px: 4, borderRadius: 2.5, fontWeight: 700 }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
