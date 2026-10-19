import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Notifications as NotifIcon,
  Check as MarkReadIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { setUnreadCount } = useAuth();
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      showError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, actionUrl) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (actionUrl) navigate(actionUrl);
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read.');
    } catch (err) {
      showError('Failed to update notifications.');
    }
  };

  return (
    <Box maxWidth="md" sx={{ mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Notification Center
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAllAsRead}
        >
          Mark All Read
        </Button>
      </Box>

      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <NotifIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b' }}>
            You're all caught up! No notifications.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <Paper
              key={n._id}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: n.isRead ? '#ffffff' : '#f0f9ff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: n.isRead ? '#f8fafc' : '#e0f2fe' },
              }}
              onClick={() => handleMarkAsRead(n._id, n.actionUrl)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!n.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb' }} />}
                  <Chip label={n.type.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {n.title}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#475569', pl: !n.isRead ? 2 : 0 }}>
                {n.message}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};
