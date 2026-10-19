import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Stack,
  Divider,
  IconButton,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  CalendarMonth as TimetableIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Class as ClassIcon,
  Warning as ConflictIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FacultyTimetablePage = () => {
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState({ entries: [], duties: [], todayDayName: 'Monday', todayLectures: [] });
  const [selectedDayTab, setSelectedDayTab] = useState(0); // 0 = Mon, 1 = Tue, etc., 6 = Weekly Grid View
  const [viewMode, setViewMode] = useState('weekly'); // 'daily' | 'weekly'
  const [activityFilter, setActivityFilter] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetable/my');
      setTimetableData(res.data.data);

      // Auto-select today's day tab
      const todayIndex = DAYS_OF_WEEK.indexOf(res.data.data.todayDayName);
      if (todayIndex !== -1) {
        setSelectedDayTab(todayIndex);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
      showError('Unable to load your academic timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const entries = timetableData.entries || [];
  const duties = timetableData.duties || [];

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (activityFilter === 'All') return true;
    return e.activityType === activityFilter;
  });

  // Detect overlapping entries on the same day for conflict warnings
  const checkDayConflicts = (dayEntries) => {
    const conflicts = [];
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const a = dayEntries[i];
        const b = dayEntries[j];
        if (a.startTime < b.endTime && a.endTime > b.startTime) {
          conflicts.push(`${a.subject?.name} (${a.startTime}-${a.endTime}) overlaps with ${b.subject?.name} (${b.startTime}-${b.endTime})`);
        }
      }
    }
    return conflicts;
  };

  const getDayEntries = (day) => {
    return filteredEntries
      .filter((e) => e.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getDayDuties = (day) => {
    // Check duties scheduled for that day
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    return duties.filter((d) => {
      const dutyDate = new Date(d.date);
      return dutyDate.getDay() === (dayIndex === 5 ? 6 : dayIndex + 1);
    });
  };

  const currentActiveDay = DAYS_OF_WEEK[selectedDayTab] || 'Monday';
  const activeDayEntries = getDayEntries(currentActiveDay);
  const activeDayDuties = getDayDuties(currentActiveDay);
  const activeDayConflicts = checkDayConflicts(activeDayEntries);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <TimetableIcon sx={{ color: '#2563eb', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                My Academic Timetable
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Semester 2026-2027 • Weekly recurring lectures, laboratories, and assigned duties
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            select
            size="small"
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            sx={{ width: 150, bgcolor: '#ffffff' }}
          >
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="Theory">Theory</MenuItem>
            <MenuItem value="Laboratory">Laboratory</MenuItem>
            <MenuItem value="Practical">Practical</MenuItem>
            <MenuItem value="Tutorial">Tutorial</MenuItem>
          </TextField>

          <Button
            variant={viewMode === 'weekly' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('weekly')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Weekly Grid
          </Button>
          <Button
            variant={viewMode === 'daily' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('daily')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Daily View
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ textTransform: 'none' }}
          >
            Print
          </Button>
        </Stack>
      </Box>

      {/* Day Selector Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Tabs
          value={selectedDayTab}
          onChange={(_, val) => setSelectedDayTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 } }}
        >
          {DAYS_OF_WEEK.map((day, idx) => {
            const isToday = timetableData.todayDayName === day;
            const count = getDayEntries(day).length;
            return (
              <Tab
                key={day}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{day}</span>
                    <Chip
                      label={count}
                      size="small"
                      color={isToday ? 'primary' : 'default'}
                      sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                    {isToday && <Chip label="TODAY" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />}
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* Conflict Banner if any */}
      {activeDayConflicts.length > 0 && (
        <Alert severity="warning" icon={<ConflictIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Schedule Overlap Detected on {currentActiveDay}:
          </Typography>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {activeDayConflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Mode A: Daily View */}
      {viewMode === 'daily' && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Schedule for {currentActiveDay} {timetableData.todayDayName === currentActiveDay && '(Today)'}
          </Typography>

          {activeDayEntries.length === 0 && activeDayDuties.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <TimetableIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                No classes scheduled for {currentActiveDay}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Enjoy your preparation or research hours!
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* Regular Lectures */}
              {activeDayEntries.map((entry) => (
                <Paper
                  key={entry._id}
                  elevation={0}
                  onClick={() => setSelectedEntry(entry)}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#3b82f6', boxShadow: '0 4px 12px rgba(37,99,235,0.08)' },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {entry.startTime} – {entry.endTime}
                        </Typography>
                      </Stack>
                      <Chip
                        label={entry.activityType}
                        size="small"
                        color={entry.activityType === 'Laboratory' ? 'secondary' : entry.activityType === 'Tutorial' ? 'info' : 'primary'}
                        sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                        {entry.subject?.name} ({entry.subject?.code})
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                          Class: <strong>{entry.classDivision?.name}</strong> • Sem {entry.subject?.semester}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                          <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 700 }}>
                            {entry.room}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Button variant="outlined" size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        View Details
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {/* Day Duties */}
              {activeDayDuties.map((duty) => (
                <Paper
                  key={duty._id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #e9d5ff',
                    bgcolor: '#faf5ff',
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon sx={{ color: '#9333ea', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#581c87' }}>
                          {duty.startTime} – {duty.endTime}
                        </Typography>
                      </Stack>
                      <Chip label={duty.type} color="secondary" size="small" sx={{ mt: 0.5, fontWeight: 700 }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#581c87', mb: 0.5 }}>
                        {duty.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7e22ce' }}>
                        📍 {duty.room || 'Campus'} • Reason: {duty.reason || 'Official academic duty'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Chip label={duty.status} color="success" size="small" sx={{ fontWeight: 700 }} />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Mode B: Full Weekly Grid View (Monday through Saturday) */}
      {viewMode === 'weekly' && (
        <Grid container spacing={2}>
          {DAYS_OF_WEEK.map((day) => {
            const dayEntries = getDayEntries(day);
            const isToday = timetableData.todayDayName === day;
            return (
              <Grid item xs={12} md={4} lg={2} key={day}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isToday ? '#2563eb' : '#e2e8f0',
                    bgcolor: isToday ? '#f8faff' : '#ffffff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Column Header */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: isToday ? '#2563eb' : '#f8fafc',
                      color: isToday ? '#ffffff' : '#0f172a',
                      textAlign: 'center',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {day}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isToday ? '#bfdbfe' : '#64748b' }}>
                      {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                    </Typography>
                  </Box>

                  {/* Sessions in day */}
                  <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {dayEntries.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          No sessions
                        </Typography>
                      </Box>
                    ) : (
                      dayEntries.map((item) => (
                        <Paper
                          key={item._id}
                          elevation={0}
                          onClick={() => setSelectedEntry(item)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb', display: 'block' }}>
                            {item.startTime} - {item.endTime}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, my: 0.5 }}>
                            {item.subject?.code}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            {item.classDivision?.name} • {item.room}
                          </Typography>
                          <Chip
                            label={item.activityType}
                            size="small"
                            sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </Paper>
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Lecture Detail Modal */}
      <Dialog open={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} maxWidth="xs" fullWidth>
        {selectedEntry && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
              Lecture Session Details
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>SUBJECT</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {selectedEntry.subject?.name} ({selectedEntry.subject?.code})
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CLASS COHORT</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedEntry.classDivision?.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ROOM / LAB</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0284c7' }}>{selectedEntry.room}</Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TIME SLOT</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedEntry.startTime} – {selectedEntry.endTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ACTIVITY TYPE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedEntry.activityType}</Typography>
                  </Grid>
                </Grid>
                {selectedEntry.subject?.description && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>SYLLABUS FOCUS</Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>{selectedEntry.subject.description}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedEntry(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedEntry(null);
                  window.location.href = '/faculty/attendance';
                }}
                sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
              >
                Go to Attendance
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
