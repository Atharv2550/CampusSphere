import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  ReportProblem as ModerateIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  Block as SuspendIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { AdminTimetableManagement } from './AdminTimetableManagement';

export const AdminPortalPage = () => {
  const { showSuccess, showError } = useToast();

  const [tab, setTab] = useState(0); // 0 = Users, 1 = Moderation, 2 = Audit Logs, 3 = Settings
  const [users, setUsers] = useState([]);
  const [flagged, setFlagged] = useState({ flaggedListings: [], flaggedLostFound: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Role/Status Edit Dialog
  const [openUserModal, setOpenUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState('student');
  const [editStatus, setEditStatus] = useState('active');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (_) {
      showError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlagged = async () => {
    try {
      const res = await api.get('/admin/flagged');
      setFlagged(res.data.data || { flaggedListings: [], flaggedLostFound: [] });
    } catch (_) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data.data || []);
    } catch (_) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    if (tab === 0) fetchUsers();
    if (tab === 1) fetchFlagged();
    if (tab === 2) fetchAuditLogs();
    if (tab === 3) fetchSettings();
  }, [tab]);

  const handleOpenUserEdit = (user) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setOpenUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/users/${selectedUser._id}`, {
        role: editRole,
        status: editStatus,
      });
      showSuccess(`User ${selectedUser.fullName} updated successfully.`);
      setOpenUserModal(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleModerate = async (contentType, contentId, action) => {
    try {
      await api.post('/admin/moderate', { contentType, contentId, action });
      showSuccess(`Content ${action === 'remove' ? 'removed' : 'cleared'}.`);
      fetchFlagged();
    } catch (_) {
      showError('Moderation action failed.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <AdminIcon />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Administrator Portal
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Account governance, moderation queue, compliance audit logs, and platform policies
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label={`User Accounts (${users.length})`} sx={{ fontWeight: 700 }} />
        <Tab
          label={`Content Moderation (${(flagged.flaggedListings?.length || 0) + (flagged.flaggedLostFound?.length || 0)})`}
          sx={{ fontWeight: 700 }}
        />
        <Tab label="Security Audit Logs" sx={{ fontWeight: 700 }} />
        <Tab label="Platform Policies & Settings" sx={{ fontWeight: 700 }} />
        <Tab label="Faculty Timetables & Duties" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Tab 0: Users */}
      {tab === 0 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Campus User Accounts Directory
          </Typography>

          {loading ? (
            <LinearProgress sx={{ my: 3 }} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Manage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {u.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {u.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.role.toUpperCase()}
                          size="small"
                          color={u.role === 'admin' ? 'error' : u.role === 'faculty' ? 'secondary' : u.role === 'coordinator' ? 'warning' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{u.department?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.status.toUpperCase()}
                          size="small"
                          color={u.status === 'active' ? 'success' : 'error'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" onClick={() => handleOpenUserEdit(u)}>
                          Edit Account
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab 1: Moderation */}
      {tab === 1 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Flagged & Reported Content Queue
          </Typography>

          {flagged.flaggedListings?.length === 0 && flagged.flaggedLostFound?.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No items currently flagged for review. The campus ecosystem is healthy!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {flagged.flaggedListings?.map((l) => (
                <Card key={l._id} sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                    Marketplace Listing: {l.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                    Reason: {l.moderationReason || 'Reported by campus user.'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="error" onClick={() => handleModerate('marketplace', l._id, 'remove')}>
                      Remove Listing
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleModerate('marketplace', l._id, 'dismiss')}>
                      Dismiss Report
                    </Button>
                  </Stack>
                </Card>
              ))}

              {flagged.flaggedLostFound?.map((item) => (
                <Card key={item._id} sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                    Lost & Found: {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                    Reason: {item.moderationReason || 'Reported as suspicious.'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="error" onClick={() => handleModerate('lostfound', item._id, 'remove')}>
                      Close Report
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleModerate('lostfound', item._id, 'dismiss')}>
                      Dismiss Report
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Tab 2: Audit Logs */}
      {tab === 2 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Security & Administration Audit Trail
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Target Type</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{log.user?.fullName || 'System'}</TableCell>
                    <TableCell>{log.targetType}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 3: Settings */}
      {tab === 3 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Platform Settings & Policy Toggles
          </Typography>

          <Stack spacing={2}>
            {settings.map((s) => (
              <Box key={s._id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {s.key}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {s.description}
                  </Typography>
                </Box>
                <Chip label={String(s.value)} color="primary" sx={{ fontWeight: 700 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tab 4: Faculty Timetable & Duty Management */}
      {tab === 4 && <AdminTimetableManagement />}

      {/* Edit User Modal */}
      <Dialog open={openUserModal} onClose={() => setOpenUserModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Manage User Account</DialogTitle>
        <Box component="form" onSubmit={handleSaveUser}>
          <DialogContent dividers>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              {selectedUser?.fullName} ({selectedUser?.email})
            </Typography>

            <TextField
              select
              fullWidth
              label="Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="coordinator">Club Coordinator</MenuItem>
              <MenuItem value="resource_manager">Resource Manager</MenuItem>
              <MenuItem value="admin">Campus Administrator</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="Account Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenUserModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Update Account
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
