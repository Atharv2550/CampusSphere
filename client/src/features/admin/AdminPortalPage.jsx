import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  ReportProblem as ModerateIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  Block as SuspendIcon,
  CheckCircle as ActiveIcon,
  PersonAdd as PersonAddIcon,
  School as FacultyIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Visibility,
  VisibilityOff,
  Autorenew as GenerateIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { AdminTimetableManagement } from './AdminTimetableManagement';

const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Lecturer',
  'Lecturer',
  'Head of Department',
  'Visiting Faculty',
  'Adjunct Professor',
  'Dean / Director',
];

export const AdminPortalPage = () => {
  const { showSuccess, showError } = useToast();

  const [tab, setTab] = useState(0); // 0 = Users, 1 = Moderation, 2 = Audit Logs, 3 = Settings, 4 = Timetables & Duties
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [flagged, setFlagged] = useState({ flaggedListings: [], flaggedLostFound: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Directory Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'faculty', 'student', 'coordinator', 'resource_manager', 'admin'
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Add Faculty Modal State
  const [openAddFacultyModal, setOpenAddFacultyModal] = useState(false);
  const [savingFaculty, setSavingFaculty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    department: '',
    designation: 'Assistant Professor',
    phoneNumber: '',
    status: 'active',
    password: '',
  });

  // Edit Faculty Modal State
  const [openEditFacultyModal, setOpenEditFacultyModal] = useState(false);
  const [savingEditFaculty, setSavingEditFaculty] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFacultyForm, setEditFacultyForm] = useState({
    _id: '',
    fullName: '',
    email: '',
    employeeId: '',
    department: '',
    designation: 'Assistant Professor',
    phoneNumber: '',
    status: 'active',
    password: '',
  });

  // General User Role/Status Edit Dialog (for students / coordinators)
  const [openUserModal, setOpenUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState('student');
  const [editStatus, setEditStatus] = useState('active');

  // Timetable Handoff State
  const [selectedFacultyForTimetable, setSelectedFacultyForTimetable] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (_) {
      showError('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      const deptList = res.data.data || [];
      setDepartments(deptList);
      if (deptList.length > 0) {
        setFacultyForm((prev) => ({ ...prev, department: prev.department || deptList[0]._id }));
      }
    } catch (_) {}
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (tab === 0) fetchUsers();
    if (tab === 1) fetchFlagged();
    if (tab === 2) fetchAuditLogs();
    if (tab === 3) fetchSettings();
  }, [tab]);

  // Generate a random strong initial password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pass = 'Fac#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFacultyForm((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  const generateEditPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pass = 'Reset#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditFacultyForm((prev) => ({ ...prev, password: pass }));
    setShowEditPassword(true);
  };

  // Open Add Faculty Dialog
  const handleOpenAddFaculty = () => {
    setFacultyForm({
      fullName: '',
      email: '',
      employeeId: '',
      department: departments[0]?._id || '',
      designation: 'Assistant Professor',
      phoneNumber: '',
      status: 'active',
      password: '',
    });
    setShowPassword(false);
    setOpenAddFacultyModal(true);
  };

  // Submit Add Faculty
  const handleCreateFaculty = async (e) => {
    e.preventDefault();

    if (!facultyForm.fullName.trim() || !facultyForm.email.trim() || !facultyForm.employeeId.trim() || !facultyForm.password) {
      showError('Full name, official email, employee ID, and initial password are required.');
      return;
    }

    if (facultyForm.password.length < 6) {
      showError('Initial password must be at least 6 characters.');
      return;
    }

    try {
      setSavingFaculty(true);
      const res = await api.post('/admin/faculty', facultyForm);
      showSuccess(res.data.message || 'Faculty account created successfully!');
      setOpenAddFacultyModal(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create faculty account.');
    } finally {
      setSavingFaculty(false);
    }
  };

  // Open Edit Faculty Dialog
  const handleOpenFacultyEdit = (user) => {
    setEditFacultyForm({
      _id: user._id,
      fullName: user.fullName || '',
      email: user.email || '',
      employeeId: user.employeeId || '',
      department: user.department?._id || user.department || '',
      designation: user.designation || 'Assistant Professor',
      phoneNumber: user.phoneNumber || '',
      status: user.status || 'active',
      password: '',
    });
    setShowEditPassword(false);
    setOpenEditFacultyModal(true);
  };

  // Submit Edit Faculty
  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSavingEditFaculty(true);
      const payload = { ...editFacultyForm };
      if (!payload.password) delete payload.password; // Don't overwrite if left blank
      const res = await api.put(`/admin/faculty/${editFacultyForm._id}`, payload);
      showSuccess(res.data.message || 'Faculty profile updated successfully!');
      setOpenEditFacultyModal(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update faculty profile.');
    } finally {
      setSavingEditFaculty(false);
    }
  };

  // Open General User Role/Status Dialog
  const handleOpenUserEdit = (user) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setOpenUserModal(true);
  };

  // Save General User Account
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/users/${selectedUser._id}`, {
        role: editRole,
        status: editStatus,
      });
      showSuccess(`Account for ${selectedUser.fullName} updated successfully.`);
      setOpenUserModal(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  // Quick toggle user status with admin safeguard
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/users/${user._id}`, { status: nextStatus });
      showSuccess(`Account for ${user.fullName} is now ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Assign Timetable shortcut -> Navigate to Tab 4
  const handleAssignTimetable = (user) => {
    setSelectedFacultyForTimetable(user._id);
    setTab(4);
    showSuccess(`Switched to Timetable Scheduler for Prof. ${user.fullName}`);
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

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (departmentFilter !== 'all') {
        const uDeptId = u.department?._id || u.department;
        if (uDeptId !== departmentFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.fullName?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchEmpId = u.employeeId?.toLowerCase().includes(q);
        const matchStudentId = u.studentId?.toLowerCase().includes(q);
        const matchDesig = u.designation?.toLowerCase().includes(q);
        const matchDept =
          u.department?.name?.toLowerCase().includes(q) ||
          u.department?.code?.toLowerCase().includes(q);

        if (!matchName && !matchEmail && !matchEmpId && !matchStudentId && !matchDesig && !matchDept) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, departmentFilter, searchQuery]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: users.length,
      faculty: users.filter((u) => u.role === 'faculty').length,
      student: users.filter((u) => u.role === 'student').length,
      coordinator: users.filter((u) => u.role === 'coordinator').length,
      resource_manager: users.filter((u) => u.role === 'resource_manager').length,
      admin: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  return (
    <Box>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            <AdminIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Campus Administrator Portal
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Faculty onboarding, user account governance, moderation queue, compliance audit logs & platform policies
            </Typography>
          </Box>
        </Box>

        {/* Global Quick Action */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddFaculty}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}
        >
          Add Faculty Account
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        sx={{
          mb: 3,
          borderBottom: '1px solid #e2e8f0',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' },
        }}
      >
        <Tab label={`User Accounts Directory (${users.length})`} />
        <Tab
          label={`Content Moderation (${(flagged.flaggedListings?.length || 0) + (flagged.flaggedLostFound?.length || 0)})`}
        />
        <Tab label="Security Audit Logs" />
        <Tab label="Platform Policies & Settings" />
        <Tab label="Faculty Timetables & Duties" />
      </Tabs>

      {/* Tab 0: User Accounts Directory */}
      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          {/* Section Header & Add Faculty Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Campus User Accounts Directory & Faculty Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Search, filter, edit credentials, deactivate accounts, and coordinate faculty teaching allocations
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddFaculty}
              sx={{
                bgcolor: '#0f172a',
                '&:hover': { bgcolor: '#1e293b' },
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
              }}
            >
              + Add Faculty Member
            </Button>
          </Box>

          {/* Role Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
            <Chip
              label={`All Accounts (${counts.all})`}
              onClick={() => setRoleFilter('all')}
              color={roleFilter === 'all' ? 'primary' : 'default'}
              variant={roleFilter === 'all' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              icon={<FacultyIcon fontSize="small" />}
              label={`Faculty (${counts.faculty})`}
              onClick={() => setRoleFilter('faculty')}
              color={roleFilter === 'faculty' ? 'secondary' : 'default'}
              variant={roleFilter === 'faculty' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Students (${counts.student})`}
              onClick={() => setRoleFilter('student')}
              color={roleFilter === 'student' ? 'primary' : 'default'}
              variant={roleFilter === 'student' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Club Coordinators (${counts.coordinator})`}
              onClick={() => setRoleFilter('coordinator')}
              color={roleFilter === 'coordinator' ? 'warning' : 'default'}
              variant={roleFilter === 'coordinator' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Administrators (${counts.admin})`}
              onClick={() => setRoleFilter('admin')}
              color={roleFilter === 'admin' ? 'error' : 'default'}
              variant={roleFilter === 'admin' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Resource Managers (${counts.resource_manager})`}
              onClick={() => setRoleFilter('resource_manager')}
              color={roleFilter === 'resource_manager' ? 'info' : 'default'}
              variant={roleFilter === 'resource_manager' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          </Stack>

          {/* Search and Dropdown Filter Bar */}
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, employee ID, email, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} sm={3.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department Filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={2.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={1}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                }}
                sx={{ textTransform: 'none', height: 40 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <LinearProgress sx={{ my: 3 }} />
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                No campus accounts match your current search and filters.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1.5, textTransform: 'none' }}
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>User / Designation</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Role & ID</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isFaculty = u.role === 'faculty';
                    return (
                      <TableRow key={u._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* User / Designation */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: isFaculty ? '#0f172a' : '#2563eb',
                                color: isFaculty ? '#38bdf8' : '#ffffff',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                              }}
                            >
                              {u.fullName?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                  {u.fullName}
                                </Typography>
                                {isFaculty && u.designation && (
                                  <Chip
                                    label={u.designation}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      bgcolor: '#f1f5f9',
                                      color: '#334155',
                                    }}
                                  />
                                )}
                              </Box>
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.3 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <EmailIcon sx={{ fontSize: 13 }} /> {u.email}
                                </Typography>
                                {u.phoneNumber && (
                                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                    <PhoneIcon sx={{ fontSize: 13 }} /> {u.phoneNumber}
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Role & ID */}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                            <Chip
                              label={u.role.toUpperCase()}
                              size="small"
                              color={
                                u.role === 'admin'
                                  ? 'error'
                                  : u.role === 'faculty'
                                  ? 'secondary'
                                  : u.role === 'coordinator'
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                            />
                            {isFaculty && (u.employeeId || u.studentId) && (
                              <Tooltip title="Official Faculty Employee ID">
                                <Chip
                                  icon={<BadgeIcon sx={{ fontSize: '13px !important' }} />}
                                  label={u.employeeId || u.studentId}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    bgcolor: '#e0e7ff',
                                    color: '#3730a3',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {!isFaculty && u.studentId && (
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                ID: {u.studentId}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {u.department?.name || 'Unassigned'}
                          </Typography>
                          {u.department?.code && (
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Code: {u.department.code}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={u.status.toUpperCase()}
                            size="small"
                            color={u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'error'}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            {isFaculty ? (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => handleAssignTimetable(u)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    bgcolor: '#2563eb',
                                    py: 0.5,
                                  }}
                                >
                                  Assign Timetable
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                                  onClick={() => handleOpenFacultyEdit(u)}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.5 }}
                                >
                                  Edit Faculty
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenUserEdit(u)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.5 }}
                              >
                                Manage Role
                              </Button>
                            )}

                            <Tooltip title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}>
                              <IconButton
                                size="small"
                                color={u.status === 'active' ? 'error' : 'success'}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {u.status === 'active' ? <SuspendIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Tab 4: Faculty Timetable & Academic Duty Management */}
      {tab === 4 && (
        <AdminTimetableManagement
          initialFacultyId={selectedFacultyForTimetable}
          autoOpenTimetable={false}
        />
      )}

      {/* Modal: Add Faculty Member */}
      <Dialog
        open={openAddFacultyModal}
        onClose={() => !savingFaculty && setOpenAddFacultyModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Create New Faculty Account
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateFaculty}>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2.5, fontSize: '0.825rem' }}>
              Creating a faculty account securely sets the <strong>FACULTY</strong> role and encrypts the password with bcrypt. The faculty member will be immediately available for weekly timetables, classes, and supervision duties.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Full Name (with honorific)"
                  placeholder="e.g., Dr. Marcus Chen"
                  value={facultyForm.fullName}
                  onChange={(e) => setFacultyForm({ ...facultyForm, fullName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  size="small"
                  label="Official College Email"
                  placeholder="name@campussphere.edu"
                  value={facultyForm.email}
                  onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                  helperText="Must be unique across the campus portal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Faculty Employee ID"
                  placeholder="e.g., FAC-CSE-105"
                  value={facultyForm.employeeId}
                  onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value.toUpperCase() })}
                  helperText="Unique uppercase institutional ID"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Academic Department"
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Designation / Academic Rank"
                  value={facultyForm.designation}
                  onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                >
                  {DESIGNATIONS.map((desig) => (
                    <MenuItem key={desig} value={desig}>
                      {desig}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Phone Number"
                  placeholder="e.g., +1-555-0199"
                  value={facultyForm.phoneNumber}
                  onChange={(e) => setFacultyForm({ ...facultyForm, phoneNumber: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Account Status"
                  value={facultyForm.status}
                  onChange={(e) => setFacultyForm({ ...facultyForm, status: e.target.value })}
                >
                  <MenuItem value="active">Active (Permit Immediate Login)</MenuItem>
                  <MenuItem value="pending">Pending Institutional Verification</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    label="Initial Password"
                    placeholder="Minimum 6 characters"
                    value={facultyForm.password}
                    onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                    helperText="Plaintext is never stored; hashed with 10 bcrypt salt rounds upon save."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GenerateIcon />}
                    onClick={generateStrongPassword}
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap', height: 40 }}
                  >
                    Generate
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddFacultyModal(false)} disabled={savingFaculty}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingFaculty}
              sx={{ bgcolor: '#0f172a', fontWeight: 700, textTransform: 'none' }}
            >
              {savingFaculty ? 'Creating Account...' : 'Create Faculty Account'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Modal: Edit Faculty Details */}
      <Dialog
        open={openEditFacultyModal}
        onClose={() => !savingEditFaculty && setOpenEditFacultyModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Edit Faculty Profile & Credentials
        </DialogTitle>
        <Box component="form" onSubmit={handleUpdateFaculty}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Full Name"
                  value={editFacultyForm.fullName}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, fullName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  size="small"
                  label="College Email"
                  value={editFacultyForm.email}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Employee ID"
                  value={editFacultyForm.employeeId}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, employeeId: e.target.value.toUpperCase() })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={editFacultyForm.department}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, department: e.target.value })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Designation / Academic Rank"
                  value={editFacultyForm.designation}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, designation: e.target.value })}
                >
                  {DESIGNATIONS.map((desig) => (
                    <MenuItem key={desig} value={desig}>
                      {desig}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number"
                  value={editFacultyForm.phoneNumber}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, phoneNumber: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Account Status"
                  value={editFacultyForm.status}
                  onChange={(e) => setEditFacultyForm({ ...editFacultyForm, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    size="small"
                    type={showEditPassword ? 'text' : 'password'}
                    label="Reset Password (leave empty to keep unchanged)"
                    placeholder="Enter new password to reset"
                    value={editFacultyForm.password}
                    onChange={(e) => setEditFacultyForm({ ...editFacultyForm, password: e.target.value })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowEditPassword(!showEditPassword)}>
                            {showEditPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GenerateIcon />}
                    onClick={generateEditPassword}
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap', height: 40 }}
                  >
                    Generate
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenEditFacultyModal(false)} disabled={savingEditFaculty}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingEditFaculty}
              sx={{ bgcolor: '#0f172a', fontWeight: 700, textTransform: 'none' }}
            >
              {savingEditFaculty ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Modal: General User Role/Status Edit */}
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
