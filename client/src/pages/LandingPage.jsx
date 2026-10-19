import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  Search as LostFoundIcon,
  Storefront as MarketplaceIcon,
  School as TutoringIcon,
  Groups as ClubsIcon,
  MeetingRoom as ResourceIcon,
  VolunteerActivism as VolunteeringIcon,
  NotificationsActive as NotifIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  PlayArrow as DemoIcon,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleQuickDemo = async (email, password, roleLabel) => {
    try {
      await login(email, password);
      showSuccess(`Logged in as ${roleLabel}! Redirecting to dashboard...`);
      navigate('/dashboard');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to login with demo credentials.');
    }
  };

  const features = [
    {
      title: 'Campus Events & Waitlists',
      desc: 'Discover workshops, hackathons, and symposiums. Enforce capacity limits with atomic waitlists and QR/PIN check-in attendance verification.',
      icon: <EventIcon sx={{ fontSize: 32, color: '#2563eb' }} />,
      badge: 'Module 1',
    },
    {
      title: 'Lost & Found Matching',
      desc: 'Transparent deterministic matching algorithm with similarity percentage scoring and private proof-of-ownership claim verification.',
      icon: <LostFoundIcon sx={{ fontSize: 32, color: '#0d9488' }} />,
      badge: 'Module 2',
    },
    {
      title: 'Student Marketplace',
      desc: 'Exchange textbooks, graphing calculators, lab coats, and electronics with peer handover negotiation and verified status transitions.',
      icon: <MarketplaceIcon sx={{ fontSize: 32, color: '#d97706' }} />,
      badge: 'Module 3',
    },
    {
      title: 'Peer Tutoring & Reviews',
      desc: 'Find subject mentors in algorithms, calculus, and web development. Validates tutor availability to prevent double-booking with verified participant reviews.',
      icon: <TutoringIcon sx={{ fontSize: 32, color: '#7c3aed' }} />,
      badge: 'Module 4',
    },
    {
      title: 'Clubs & Societies',
      desc: 'Explore active student organizations, submit membership applications, and empower coordinators to manage events, announcements, and committee roles.',
      icon: <ClubsIcon sx={{ fontSize: 32, color: '#0284c7' }} />,
      badge: 'Module 5',
    },
    {
      title: 'Resource Booking & Conflict Guard',
      desc: 'Reserve seminar halls, robotics labs, and 4K projection equipment. Server-side validation prevents overlapping approved bookings.',
      icon: <ResourceIcon sx={{ fontSize: 32, color: '#e11d48' }} />,
      badge: 'Module 7',
    },
    {
      title: 'Volunteering & Verified Hours',
      desc: 'Register for community service drives, record verified supervisor hours, and generate participation certificates.',
      icon: <VolunteeringIcon sx={{ fontSize: 32, color: '#16a34a' }} />,
      badge: 'Module 8',
    },
    {
      title: 'Real-Time Notifications',
      desc: 'Instant updates delivered via Socket.IO for event promotions, ownership claims, marketplace offers, and booking decisions.',
      icon: <NotifIcon sx={{ fontSize: 32, color: '#0891b2' }} />,
      badge: 'Module 6',
    },
  ];

  const demoAccounts = [
    { role: 'Student', email: 'student@campussphere.edu', pass: 'Student@123', color: '#2563eb', desc: 'Browse events, list items, book resources, request tutoring.' },
    { role: 'Campus Admin', email: 'admin@campussphere.edu', pass: 'Admin@123', color: '#dc2626', desc: 'Moderate content, manage user accounts, inspect audit logs & analytics.' },
    { role: 'Faculty', email: 'faculty@campussphere.edu', pass: 'Faculty@123', color: '#7c3aed', desc: 'Publish announcements, supervise events & verify volunteer hours.' },
    { role: 'Club Coordinator', email: 'coordinator@campussphere.edu', pass: 'Coordinator@123', color: '#d97706', desc: 'Manage club roster, review applications & assign committee roles.' },
    { role: 'Resource Manager', email: 'resourcemanager@campussphere.edu', pass: 'Manager@123', color: '#0284c7', desc: 'Approve room/equipment bookings & prevent scheduling conflicts.' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)',
          color: '#ffffff',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 16 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="CAMPUS DIGITAL ECOSYSTEM"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  mb: 3,
                  backdropFilter: 'blur(8px)',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mb: 2.5,
                  letterSpacing: '-0.03em',
                }}
              >
                Your Campus, <span style={{ color: '#38bdf8' }}>Connected.</span>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#cbd5e1',
                  fontWeight: 400,
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  lineHeight: 1.6,
                  maxWidth: 620,
                  mb: 4,
                }}
              >
                One Campus. One Community. Endless Possibilities. The centralized platform uniting events, lost-and-found, marketplace, tutoring, clubs, and facility booking into one seamless experience.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  endIcon={<ArrowIcon />}
                  sx={{
                    bgcolor: '#2563eb',
                    fontSize: '1rem',
                    py: 1.5,
                    px: 3.5,
                    borderRadius: 2.5,
                    boxShadow: '0 10px 25px rgba(37,99,235,0.4)',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const el = document.getElementById('demo-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    py: 1.5,
                    px: 3,
                    borderRadius: 2.5,
                    '&:hover': {
                      borderColor: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  Explore Demo Roles
                </Button>
              </Stack>
            </Grid>

            {/* Quick Demo Launch Card on Hero */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={6}
                sx={{
                  p: 3.5,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.98)',
                  color: '#0f172a',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <DemoIcon sx={{ color: '#2563eb', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Instant Demo Login
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
                  Select any persona to immediately explore CampusSphere with live database records:
                </Typography>

                <Stack spacing={1.5}>
                  {demoAccounts.map((demo) => (
                    <Box
                      key={demo.role}
                      onClick={() => handleQuickDemo(demo.email, demo.pass, demo.role)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: demo.color,
                          bgcolor: '#f8fafc',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: demo.color }}>
                          {demo.role}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {demo.email}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickDemo(demo.email, demo.pass, demo.role);
                        }}
                        sx={{ borderColor: demo.color, color: demo.color, borderRadius: 1.5 }}
                      >
                        Launch
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Feature Modules Grid */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip label="CORE CAPABILITIES" color="primary" sx={{ fontWeight: 700, mb: 1.5 }} />
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, mb: 2 }}>
            Engineered for Comprehensive Campus Life
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto' }}>
            From high-stakes hackathons to finding your misplaced calculator, every module is connected with real database persistence.
          </Typography>
        </Box>

        <Grid container spacing={3.5}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2.5,
                        bgcolor: '#f1f5f9',
                        display: 'inline-flex',
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Chip label={f.badge} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem' }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: '#f1f5f9', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              How CampusSphere Works
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
              A frictionless workflow designed to save time and build community connection.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                title: 'Register & Personalize',
                desc: 'Sign in with your campus credentials. Select your academic department, academic year, and topics of interest.',
              },
              {
                step: '02',
                title: 'Discover & Interact',
                desc: 'Register for events with waitlist protection, browse peer listings, find peer tutors, and submit item claims.',
              },
              {
                step: '03',
                title: 'Track & Achieve',
                desc: 'Manage your verified volunteering hours, check into events via PIN codes, and collaborate across clubs.',
              },
            ].map((step) => (
              <Grid item xs={12} md={4} key={step.step}>
                <Paper sx={{ p: 4, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h2" sx={{ color: '#2563eb', fontWeight: 900, mb: 1.5 }}>
                    {step.step}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                    {step.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Role Demonstration Section */}
      <Container id="demo-section" maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip label="ROLE-BASED DEMO" color="secondary" sx={{ fontWeight: 700, mb: 1.5 }} />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            Five Roles. Server-Enforced RBAC.
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto' }}>
            Click on any profile below to immediately authenticate and test server-enforced role authorization.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {demoAccounts.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d.role}>
              <Card sx={{ height: '100%', p: 1, borderTop: `4px solid ${d.color}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: d.color, mb: 0.5 }}>
                    {d.role}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                    {d.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5, minHeight: 45 }}>
                    {d.desc}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickDemo(d.email, d.pass, d.role)}
                    sx={{ bgcolor: d.color, '&:hover': { bgcolor: d.color, opacity: 0.9 } }}
                  >
                    Test as {d.role}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
