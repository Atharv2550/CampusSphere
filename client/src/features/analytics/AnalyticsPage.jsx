import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Storefront as MarketplaceIcon,
  MeetingRoom as ResourceIcon,
  VolunteerActivism as VolunteerIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#7c3aed', '#e11d48', '#0284c7'];

export const AnalyticsPage = () => {
  const { showError, showSuccess } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setData(res.data.data);
    } catch (_) {
      showError('Failed to load campus analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/analytics/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campussphere-analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Analytics CSV exported successfully!');
    } catch (_) {
      showError('Failed to export CSV.');
    }
  };

  if (loading || !data) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  const { summary = {}, usersByRole = [], eventsByCategory = [], listingsByCategory = [] } = data;

  const roleChartData = usersByRole.map((u) => ({
    name: u.role.replace('_', ' ').toUpperCase(),
    count: u.count,
  }));

  const eventCategoryData = eventsByCategory.map((e) => ({
    name: e.category,
    Events: e.count,
    Attendees: e.totalRegistered,
  }));

  const marketplaceCategoryData = listingsByCategory.map((l) => ({
    name: l.category,
    value: l.count,
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Analytics & Executive Metrics
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Aggregated institutional metrics derived from active database records
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          sx={{ borderRadius: 2.5 }}
        >
          Export Event Analytics (CSV)
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                TOTAL REGISTERED USERS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
                {summary.totalUsers || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                {summary.activeUsers || 0} Active • {summary.suspendedUsers || 0} Suspended
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                EVENT ATTENDANCE RATE
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#2563eb', my: 0.5 }}>
                {summary.attendanceRate || 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {summary.totalRegistrations || 0} Total Registrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                BOOKING APPROVAL RATE
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0d9488', my: 0.5 }}>
                {summary.bookingApprovalRate || 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {summary.totalBookings || 0} Reservation Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                VERIFIED SERVICE HOURS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#7c3aed', my: 0.5 }}>
                {summary.totalVerifiedHours || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Community service transcript credits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Charts */}
      <Grid container spacing={4}>
        {/* Events vs Attendees Bar Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Event Participation by Category
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={eventCategoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="Events" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Attendees" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Distribution Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              User Demographics by Role
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              {roleChartData.map((item, idx) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, mb: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                    {item.name}: {item.count}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
