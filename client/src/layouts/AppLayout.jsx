import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Storefront as MarketplaceIcon,
  School as TutoringIcon,
  Groups as ClubsIcon,
  Campaign as AnnouncementIcon,
  MeetingRoom as ResourceIcon,
  VolunteerActivism as VolunteeringIcon,
  Notifications as NotificationIcon,
  AdminPanelSettings as AdminIcon,
  Analytics as AnalyticsIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Lightbulb as LogoIcon,
  AssignmentTurnedIn as ReviewIcon,
  CalendarMonth as TimetableIcon,
  Class as SubjectsIcon,
  FactCheck as AttendanceIcon,
  SwapHoriz as DutiesIcon,
  SupervisorAccount as SupervisionIcon,
  PendingActions as ApprovalsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

export const AppLayout = () => {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  // Base navigation items available to students & community
  const navItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Campus Events', path: '/events', icon: <EventIcon /> },
    { text: 'Lost & Found', path: '/lost-found', icon: <SearchIcon /> },
    { text: 'Marketplace', path: '/marketplace', icon: <MarketplaceIcon /> },
    { text: 'Peer Tutoring', path: '/tutoring', icon: <TutoringIcon /> },
    { text: 'Clubs & Societies', path: '/clubs', icon: <ClubsIcon /> },
    { text: 'Announcements', path: '/announcements', icon: <AnnouncementIcon /> },
    { text: 'Resource Booking', path: '/bookings', icon: <ResourceIcon /> },
    { text: 'Volunteering', path: '/volunteering', icon: <VolunteeringIcon /> },
  ];

  // Dedicated Faculty role navigation
  const facultyNavItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'My Timetable', path: '/faculty/timetable', icon: <TimetableIcon /> },
    { text: 'My Subjects & Classes', path: '/faculty/subjects', icon: <SubjectsIcon /> },
    { text: 'Lecture & Attendance', path: '/faculty/attendance', icon: <AttendanceIcon /> },
    { text: 'Attendance History', path: '/faculty/attendance-history', icon: <HistoryIcon /> },
    { text: 'Substitution & Duties', path: '/faculty/duties', icon: <DutiesIcon /> },
    { text: 'Announcements', path: '/announcements', icon: <AnnouncementIcon /> },
    { text: 'Events & Activities', path: '/events', icon: <EventIcon /> },
    { text: 'Student & Club Supervision', path: '/faculty/supervision', icon: <SupervisionIcon /> },
    { text: 'Pending Approvals', path: '/faculty/approvals', icon: <ApprovalsIcon /> },
    { text: 'Department Reports', path: '/analytics', icon: <AnalyticsIcon /> },
    { text: 'Resource Booking', path: '/bookings', icon: <ResourceIcon /> },
    { text: 'My Profile', path: '/profile', icon: <ProfileIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const displayedNavItems = user?.role === 'faculty' ? facultyNavItems : navItems;
  const navSectionLabel = user?.role === 'faculty' ? 'FACULTY ACADEMIC PORTAL' : 'CAMPUS SERVICES';

  // Role-specific items
  const adminItems = [
    { text: 'Campus Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
    { text: 'Admin Portal', path: '/admin', icon: <AdminIcon /> },
  ];

  const resourceManagerItems = [
    { text: 'Resource Manager', path: '/bookings?tab=manage', icon: <ResourceIcon /> },
    { text: 'Utilization Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  ];

  const coordinatorItems = [
    { text: 'Club Management', path: user?.assignedClub ? `/clubs/${user.assignedClub?._id || user.assignedClub}` : '/clubs', icon: <ReviewIcon /> },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'faculty':
        return 'secondary';
      case 'coordinator':
        return 'warning';
      case 'resource_manager':
        return 'info';
      default:
        return 'default';
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
          }}
        >
          <LogoIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#0f172a' }}>
            CampusSphere
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
            SMART CAMPUS HUB
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Main Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, fontWeight: 700, color: '#94a3b8', display: 'block' }}>
          {navSectionLabel}
        </Typography>
        <List dense>
          {displayedNavItems.map((item) => {
            const active = item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: 1.5,
                    backgroundColor: active ? '#eff6ff' : 'transparent',
                    color: active ? '#2563eb' : '#334155',
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      backgroundColor: active ? '#dbeafe' : '#f1f5f9',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 38,
                      color: active ? '#2563eb' : '#64748b',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: active ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Admin Navigation */}
        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, fontWeight: 700, color: '#ef4444', display: 'block' }}>
              ADMINISTRATION
            </Typography>
            <List dense>
              {adminItems.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        px: 1.5,
                        backgroundColor: active ? '#fef2f2' : 'transparent',
                        color: active ? '#dc2626' : '#334155',
                        fontWeight: active ? 700 : 500,
                        '&:hover': {
                          backgroundColor: active ? '#fee2e2' : '#f1f5f9',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38, color: active ? '#dc2626' : '#64748b' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        {/* Resource Manager Navigation */}
        {user?.role === 'resource_manager' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, fontWeight: 700, color: '#0284c7', display: 'block' }}>
              RESOURCE MANAGEMENT
            </Typography>
            <List dense>
              {resourceManagerItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        px: 1.5,
                        backgroundColor: active ? '#f0f9ff' : 'transparent',
                        color: active ? '#0284c7' : '#334155',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38, color: active ? '#0284c7' : '#64748b' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        {/* Club Coordinator Navigation */}
        {user?.role === 'coordinator' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" sx={{ px: 1.5, py: 0.5, fontWeight: 700, color: '#d97706', display: 'block' }}>
              COORDINATOR TOOLS
            </Typography>
            <List dense>
              {coordinatorItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{ borderRadius: 2, py: 1, px: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 38, color: '#d97706' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>

      {/* User Footer Summary in Drawer */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: '#f8fafc' }}>
        <Avatar
          src={user?.avatar || ''}
          sx={{
            width: 38,
            height: 38,
            bgcolor: '#2563eb',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {user?.fullName?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true, color: '#0f172a' }}>
            {user?.fullName || 'Campus User'}
          </Typography>
          <Chip
            label={user?.role?.replace('_', ' ').toUpperCase()}
            size="small"
            color={getRoleBadgeColor(user?.role)}
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
          />
        </Box>
        <IconButton size="small" onClick={handleLogout} title="Logout" sx={{ color: '#64748b' }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              CampusSphere
            </Typography>
          </Box>

          {/* Top Bar Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Notifications">
              <IconButton
                onClick={() => navigate('/notifications')}
                sx={{
                  color: '#334155',
                  backgroundColor: '#f1f5f9',
                  '&:hover': { backgroundColor: '#e2e8f0' },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Box
              onClick={handleProfileMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 3,
                '&:hover': { backgroundColor: '#f1f5f9' },
              }}
            >
              <Avatar
                src={user?.avatar || ''}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#0f172a',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {user?.fullName?.split(' ')[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                  {user?.role?.toUpperCase()}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  width: 200,
                  borderRadius: 2,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  mt: 1,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  navigate('/profile');
                }}
              >
                <ListItemIcon>
                  <ProfileIcon fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  navigate('/notifications');
                }}
              >
                <ListItemIcon>
                  <NotificationIcon fontSize="small" />
                </ListItemIcon>
                Notifications
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <ListItemIcon sx={{ color: '#ef4444' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Log Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebars: Mobile Drawer & Desktop Persistent Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e2e8f0',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
