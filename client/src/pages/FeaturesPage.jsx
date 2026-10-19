import React from 'react';
import { Container, Box, Typography, Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import {
  Event as EventIcon,
  Search as SearchIcon,
  Storefront as StorefrontIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  MeetingRoom as MeetingRoomIcon,
  VolunteerActivism as VolunteerActivismIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

export const FeaturesPage = () => {
  const modules = [
    {
      title: 'Module 1: Campus Events & Attendance',
      points: [
        'Atomic capacity limits and automatic waitlist queueing',
        'Automatic waitlist promotion when registrations are cancelled',
        '6-character alphanumeric check-in code and organizer participant rosters',
        'Category, department, and calendar timeline filters',
      ],
      icon: <EventIcon sx={{ fontSize: 36, color: '#2563eb' }} />,
    },
    {
      title: 'Module 2: Lost & Found Intelligence',
      points: [
        'Transparent deterministic matching algorithm combining category, color, location, and date proximity',
        'Similarity score % with human-readable rationale explanations',
        'Private proof-of-ownership submission protecting serial numbers & markings',
        'Claim verification and handover tracking lifecycle',
      ],
      icon: <SearchIcon sx={{ fontSize: 36, color: '#0d9488' }} />,
    },
    {
      title: 'Module 3: Student Marketplace & Item Exchange',
      points: [
        'Peer-to-peer listings for textbooks, calculators, lab coats, and electronics',
        'Buy and exchange proposal threads with in-app status transitions',
        'Handover arrangement tracking without false financial payment claims',
        'Prohibited item reporting and administrative moderation',
      ],
      icon: <StorefrontIcon sx={{ fontSize: 36, color: '#d97706' }} />,
    },
    {
      title: 'Module 4: Peer Tutoring & Verified Reviews',
      points: [
        'Tutor subject profiles with weekly availability time slots',
        'Double-booking prevention: rejects overlapping time slots and past dates',
        '5-star ratings and reviews restricted exclusively to verified participants',
        'Meeting modes: In-person, Online, and Hybrid',
      ],
      icon: <SchoolIcon sx={{ fontSize: 36, color: '#7c3aed' }} />,
    },
    {
      title: 'Module 5: Clubs & Student Societies',
      points: [
        'Club directory with leadership and upcoming events preview',
        'Membership application workflow with coordinator approval',
        'Coordinator committee role assignments (e.g., Tech Lead, Treasurer)',
        'Club-specific announcements and event coordination',
      ],
      icon: <GroupsIcon sx={{ fontSize: 36, color: '#0284c7' }} />,
    },
    {
      title: 'Module 6: Announcements & Real-Time Alerts',
      points: [
        'Targeted broadcasts: Campus-wide, Department, Club, or Role',
        'Pinned emergency notices and expiration date filtering',
        'In-app notification center persisted in MongoDB',
        'Instant live delivery powered by authenticated Socket.IO rooms',
      ],
      icon: <VolunteerActivismIcon sx={{ fontSize: 36, color: '#0891b2' }} />,
    },
    {
      title: 'Module 7: Resource Booking & Conflict Guard',
      points: [
        'Seminar halls, robotics labs, multimedia rooms, and 4K projectors',
        'Server-side validation preventing overlapping approved bookings',
        'Operating hours and department/role eligibility enforcement',
        'Resource manager review and approval workflows',
      ],
      icon: <MeetingRoomIcon sx={{ fontSize: 36, color: '#e11d48' }} />,
    },
    {
      title: 'Module 8 & 9: Volunteering & Campus Analytics',
      points: [
        'Community service tracking with verified supervisor hours',
        'Downloadable participation acknowledgements and certificate codes',
        'Role-specific analytics with MongoDB aggregation pipelines',
        'Visual charts with Recharts and CSV data export',
      ],
      icon: <BarChartIcon sx={{ fontSize: 36, color: '#16a34a' }} />,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Chip label="DETAILED ARCHITECTURE" color="secondary" sx={{ fontWeight: 700, mb: 1.5 }} />
        <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
          Complete Feature Specification
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto' }}>
          Explore the exact server-enforced mechanics and user features powering CampusSphere.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {modules.map((m) => (
          <Grid item xs={12} md={6} key={m.title}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>{m.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {m.title}
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {m.points.map((pt, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#475569', display: 'flex', gap: 1 }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>•</span>
                      {pt}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
