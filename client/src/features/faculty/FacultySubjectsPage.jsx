import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Class as SubjectsIcon,
  People as StudentsIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  MenuBook as BookIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultySubjectsPage = () => {
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  // Roster modal state
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [students, setStudents] = useState([]);

  const fetchAssignedSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects/my');
      setAssignedSubjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load assigned subjects:', err);
      showError('Failed to load your assigned subjects and classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const handleOpenRoster = async (classDivision, subject) => {
    setCurrentClass({ classDivision, subject });
    setRosterModalOpen(true);
    try {
      setRosterLoading(true);
      const res = await api.get(`/classes/${classDivision._id}/students`);
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load class roster:', err);
      showError(err.response?.data?.message || 'Failed to load enrolled student roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
            <SubjectsIcon sx={{ color: '#16a34a', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              My Assigned Subjects & Classes
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Academic teaching assignments, designated lecture rooms, and official student enrollment rosters
            </Typography>
          </Box>
        </Stack>
      </Box>

      {assignedSubjects.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <BookIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
            No subject assignments found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Official teaching assignments have not yet been published by the campus timetable administrator.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {assignedSubjects.map((item, idx) => (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#94a3b8', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip
                      label={item.subject?.code}
                      color="primary"
                      sx={{ fontWeight: 800, fontSize: '0.8rem', borderRadius: 1.5 }}
                    />
                    <Chip
                      label={`Class: ${item.classDivision?.name}`}
                      sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#1e293b' }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, minHeight: 56, lineHeight: 1.3 }}>
                    {item.subject?.name}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, overflow: 'hidden' }}>
                    {item.subject?.description || 'Core departmental academic course covering foundational and advanced concepts.'}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1} sx={{ mb: 2.5, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Semester</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Semester {item.subject?.semester}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Weekly Teaching Hours</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.weeklySessions} session(s) / week</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Credits</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.subject?.credits || 3} Credits</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Assigned Rooms</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                        {item.rooms?.join(', ') || 'LH-201'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<StudentsIcon />}
                    onClick={() => handleOpenRoster(item.classDivision, item.subject)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#0f172a',
                      '&:hover': { bgcolor: '#1e293b' },
                      borderRadius: 2,
                    }}
                  >
                    View Enrolled Class Roster
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Class Student Roster Dialog */}
      <Dialog
        open={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Enrolled Student Roster — {currentClass?.classDivision?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Subject: <strong>{currentClass?.subject?.name} ({currentClass?.subject?.code})</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Official students enrolled in this academic cohort. Roster is synchronized with the campus registrar database.
            </Typography>
          </Box>

          {rosterLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Box>
          ) : students.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No students are currently registered in this cohort list.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student ID</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Academic Year</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((st, index) => (
                    <TableRow key={st._id} hover>
                      <TableCell sx={{ color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: '#3b82f6' }}>
                            {st.fullName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {st.fullName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {st.studentId || `STU-${index + 101}`}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{st.email}</TableCell>
                      <TableCell>
                        <Chip label={st.academicYear || '3rd Year'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRosterModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
