import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Groups as ClubsIcon,
  CalendarToday as DateIcon,
  People as PeopleIcon,
  Star as StarIcon,
  ArrowBack as BackIcon,
  CheckCircle as ApprovedIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const ClubDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [applicationReason, setApplicationReason] = useState('');
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [selectedMemberForRole, setSelectedMemberForRole] = useState(null);
  const [roleTitle, setRoleTitle] = useState('Event Lead');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClubDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clubs/${id}`);
      setClub(res.data.data);

      const isCoord =
        user &&
        (user.role === 'admin' ||
          res.data.data.coordinators?.some((c) => c._id === user.id));

      if (isCoord) {
        const memRes = await api.get(`/clubs/${id}/members`);
        setMembers(memRes.data.data || []);
      }
    } catch (err) {
      showError('Failed to load club details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubDetail();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/clubs/${id}/apply`, { applicationReason });
      showSuccess(res.data.message);
      setOpenApplyModal(false);
      fetchClubDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewMembership = async (membershipId, status) => {
    try {
      await api.patch(`/clubs/memberships/${membershipId}`, { status });
      showSuccess(`Membership marked as ${status}.`);
      fetchClubDetail();
    } catch (err) {
      showError('Failed to review membership.');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clubs/${id}/assign-role`, {
        userId: selectedMemberForRole.user?._id || selectedMemberForRole.user,
        roleTitle,
      });
      showSuccess(`Role "${roleTitle}" assigned successfully!`);
      setOpenRoleModal(false);
      fetchClubDetail();
    } catch (err) {
      showError('Failed to assign role.');
    }
  };

  if (loading || !club) {
    return <LinearProgress sx={{ mt: 4 }} />;
  }

  const isCoordinator =
    user &&
    (user.role === 'admin' ||
      club.coordinators?.some((c) => c._id === user.id));

  const membership = club.userMembership;
  const isMember = membership && membership.status === 'approved';
  const isPending = membership && membership.status === 'pending';

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/clubs')} sx={{ mb: 2 }}>
        Back to Clubs Directory
      </Button>

      {/* Hero Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 65%, #0284c7 100%)',
          color: '#ffffff',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={club.category} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }} />
          <Chip label={`CODE: ${club.code}`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }} />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
          {club.name}
        </Typography>

        <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 700, mb: 3 }}>
          {club.description}
        </Typography>

        {club.meetingInfo && (
          <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, maxWidth: 600 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block' }}>
              REGULAR MEETING SCHEDULE
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              {club.meetingInfo}
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={4}>
        {/* Left: Leadership & Activities */}
        <Grid item xs={12} md={7}>
          {/* Committee Leadership */}
          <Paper sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Club Leadership & Committee
            </Typography>

            <Stack spacing={2}>
              {club.coordinators?.map((c) => (
                <Box key={c._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#d97706' }}>{c.fullName?.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {c.fullName}
                    </Typography>
                    <Chip label="Lead Coordinator" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </Box>
                </Box>
              ))}

              {club.committeeMembers?.map((m, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#2563eb' }}>{m.user?.fullName?.charAt(0) || 'M'}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {m.user?.fullName}
                    </Typography>
                    <Chip label={m.roleTitle} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Coordinator Member Applications Roster */}
          {isCoordinator && (
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Coordinator Management: Applications ({members.length})
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((mem) => (
                      <TableRow key={mem._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {mem.user?.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {mem.user?.email} • {mem.user?.academicYear}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={mem.role} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mem.status}
                            size="small"
                            color={mem.status === 'approved' ? 'success' : mem.status === 'pending' ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {mem.status === 'pending' && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="contained" color="success" onClick={() => handleReviewMembership(mem._id, 'approved')}>
                                Approve
                              </Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleReviewMembership(mem._id, 'rejected')}>
                                Decline
                              </Button>
                            </Stack>
                          )}
                          {mem.status === 'approved' && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<StarIcon />}
                              onClick={() => {
                                setSelectedMemberForRole(mem);
                                setOpenRoleModal(true);
                              }}
                            >
                              Assign Role
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        {/* Right: Membership Action Box */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Club Membership
            </Typography>

            {isMember ? (
              <Alert severity="success" icon={<ApprovedIcon />}>
                You are an approved member of {club.name}! Check announcements for meeting agendas.
              </Alert>
            ) : isPending ? (
              <Alert severity="warning">
                Your application to join {club.name} is currently pending coordinator review.
              </Alert>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Join {club.name} to participate in club-exclusive workshops, project groups, and committee leadership.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => setOpenApplyModal(true)}
                  sx={{ py: 1.3, fontWeight: 700 }}
                >
                  Apply to Join Club
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PeopleIcon sx={{ color: '#2563eb' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  ACTIVE COMMUNITY
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {club.memberCount || 2} Enrolled Members
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Apply Modal */}
      <Dialog open={openApplyModal} onClose={() => setOpenApplyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply to Join {club.name}</DialogTitle>
        <Box component="form" onSubmit={handleApply}>
          <DialogContent dividers>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Why would you like to join this club?"
              placeholder="Describe your interests, experience, and what you hope to contribute..."
              value={applicationReason}
              onChange={(e) => setApplicationReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenApplyModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={actionLoading}>
              Submit Application
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Assign Role Modal */}
      <Dialog open={openRoleModal} onClose={() => setOpenRoleModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Committee Role</DialogTitle>
        <Box component="form" onSubmit={handleAssignRole}>
          <DialogContent dividers>
            <TextField
              required
              fullWidth
              label="Committee Title"
              placeholder="e.g. Technical Head, Treasurer, PR Lead"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRoleModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Save Role
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
