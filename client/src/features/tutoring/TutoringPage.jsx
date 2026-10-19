import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Avatar,
  Rating,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  School as TutoringIcon,
  Star as StarIcon,
  CalendarToday as DateIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const TutoringPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState(0); // 0 = Find Tutors, 1 = My Sessions
  const [tutors, setTutors] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Booking Modal
  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [bookData, setBookData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    meetingMode: 'In-person',
    locationOrLink: 'Campus Library Study Room 2',
    notes: '',
  });

  // Review Modal
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Become Tutor Modal
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    subjects: 'Data Structures & Algorithms, Web Development',
    bio: '',
    experience: '',
  });

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/tutors', { params });
      setTutors(res.data.data || []);
    } catch (err) {
      showError('Failed to load tutors.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySessions = async () => {
    try {
      const res = await api.get('/tutors/my-sessions');
      setMySessions(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchTutors();
    if (user) fetchMySessions();
  }, [activeTab]);

  const handleOpenBooking = (tutor) => {
    setSelectedTutor(tutor);
    setBookData({
      ...bookData,
      subject: tutor.subjects[0] || '',
    });
    setOpenBookModal(true);
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tutors/request', {
        tutorUserId: selectedTutor.user?._id || selectedTutor.user,
        ...bookData,
      });
      showSuccess('Tutoring session requested! The tutor has been notified.');
      setOpenBookModal(false);
      fetchMySessions();
      setActiveTab(1);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to book session.');
    }
  };

  const handleUpdateSessionStatus = async (sessionId, status) => {
    try {
      await api.patch(`/tutors/sessions/${sessionId}`, { status });
      showSuccess(`Session marked as ${status}.`);
      fetchMySessions();
    } catch (err) {
      showError('Failed to update session.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tutors/sessions/${selectedSessionForReview._id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      showSuccess('Review submitted! Thank you for fostering peer learning.');
      setOpenReviewModal(false);
      fetchMySessions();
      fetchTutors();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const handleSaveTutorProfile = async (e) => {
    e.preventDefault();
    try {
      const subjectsArray = profileData.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      await api.post('/tutors/profile', {
        subjects: subjectsArray,
        bio: profileData.bio,
        experience: profileData.experience,
      });
      showSuccess('Tutor profile published successfully!');
      setOpenProfileModal(false);
      fetchTutors();
    } catch (err) {
      showError('Failed to save profile.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Peer Tutoring & Skill Sharing
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Connect with accomplished peers for mentoring in coding, mathematics, databases, and engineering
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<TutoringIcon />}
          onClick={() => setOpenProfileModal(true)}
          sx={{ borderRadius: 2.5 }}
        >
          Offer Tutoring (Become a Tutor)
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label="Explore Peer Tutors" sx={{ fontWeight: 700 }} />
        <Tab label={`My Tutoring Sessions (${mySessions.length})`} sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Tab 0: Find Tutors */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by subject (e.g. Data Structures, React, Calculus, Physics)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTutors()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loading ? (
            <LinearProgress sx={{ my: 4 }} />
          ) : tutors.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ color: '#475569' }}>
                No tutors found matching this search.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3.5}>
              {tutors.map((tutor) => (
                <Grid item xs={12} sm={6} md={4} key={tutor._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: '#7c3aed', width: 48, height: 48, fontWeight: 700 }}>
                          {tutor.user?.fullName?.charAt(0) || 'T'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {tutor.user?.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {tutor.department?.name || 'Academic Mentor'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Rating value={tutor.ratingAverage || 5} precision={0.1} size="small" readOnly />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {tutor.ratingAverage ? `${tutor.ratingAverage} (${tutor.ratingCount})` : 'New'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ color: '#475569', mb: 2, minHeight: 40, lineHeight: 1.5 }}>
                        {tutor.bio}
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 1 }}>
                        SUBJECTS TAUGHT:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                        {tutor.subjects?.map((subj, idx) => (
                          <Chip key={idx} label={subj} size="small" color="secondary" sx={{ fontWeight: 600 }} />
                        ))}
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => handleOpenBooking(tutor)}
                        sx={{ mt: 'auto', borderRadius: 2 }}
                      >
                        Request Free Session
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 1: My Sessions */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Scheduled Sessions
          </Typography>

          {mySessions.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No sessions scheduled. Request a session with a peer tutor above!
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {mySessions.map((s) => {
                const isTutor = s.tutor?._id === user?.id;
                const isStudent = s.student?._id === user?.id;

                return (
                  <Card key={s._id} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'Accepted' ? 'success' : s.status === 'Completed' ? 'primary' : 'warning'}
                          sx={{ fontWeight: 700, mr: 1 }}
                        />
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {s.subject}
                        </Typography>
                      </Box>
                      <Chip label={s.meetingMode} size="small" variant="outlined" />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                      <strong>{isTutor ? `Student: ${s.student?.fullName}` : `Tutor: ${s.tutor?.fullName}`}</strong>
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                      Date: {new Date(s.date).toLocaleDateString()} • Time: {s.startTime} - {s.endTime} • Venue/Link: {s.locationOrLink}
                    </Typography>

                    {/* Actions */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {isTutor && s.status === 'Requested' && (
                        <>
                          <Button size="small" variant="contained" color="success" onClick={() => handleUpdateSessionStatus(s._id, 'Accepted')}>
                            Accept Request
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleUpdateSessionStatus(s._id, 'Rejected')}>
                            Decline
                          </Button>
                        </>
                      )}

                      {s.status === 'Accepted' && (
                        <Button size="small" variant="contained" color="primary" onClick={() => handleUpdateSessionStatus(s._id, 'Completed')}>
                          Mark Completed
                        </Button>
                      )}

                      {isStudent && s.status === 'Completed' && !s.hasReview && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<StarIcon />}
                          onClick={() => {
                            setSelectedSessionForReview(s);
                            setOpenReviewModal(true);
                          }}
                        >
                          Leave Verified Review
                        </Button>
                      )}

                      {s.hasReview && (
                        <Chip label="Review Submitted" size="small" icon={<DoneIcon />} color="success" />
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Paper>
      )}

      {/* Book Session Modal */}
      <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Request Tutoring Session</DialogTitle>
        <Box component="form" onSubmit={handleBookSession}>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>
              Double-booking prevention is enforced. Select an available slot.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Subject"
                  value={bookData.subject}
                  onChange={(e) => setBookData({ ...bookData, subject: e.target.value })}
                >
                  {selectedTutor?.subjects?.map((sub) => (
                    <MenuItem key={sub} value={sub}>
                      {sub}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={bookData.date}
                  onChange={(e) => setBookData({ ...bookData, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="Start Time"
                  placeholder="14:00"
                  value={bookData.startTime}
                  onChange={(e) => setBookData({ ...bookData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="End Time"
                  placeholder="15:00"
                  value={bookData.endTime}
                  onChange={(e) => setBookData({ ...bookData, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Meeting Venue or Zoom Link"
                  value={bookData.locationOrLink}
                  onChange={(e) => setBookData({ ...bookData, locationOrLink: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Topic / Questions for the Session"
                  value={bookData.notes}
                  onChange={(e) => setBookData({ ...bookData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenBookModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Confirm Request
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={openReviewModal} onClose={() => setOpenReviewModal(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Verified Peer Review</DialogTitle>
        <Box component="form" onSubmit={handleSubmitReview}>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Only verified attendees of this completed session can submit a rating.
            </Typography>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Rating value={reviewRating} size="large" onChange={(e, val) => setReviewRating(val)} />
            </Box>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Feedback & Comments"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How well did the tutor explain the concepts?"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenReviewModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Submit Review
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Offer Tutoring Modal */}
      <Dialog open={openProfileModal} onClose={() => setOpenProfileModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create / Update Tutor Profile</DialogTitle>
        <Box component="form" onSubmit={handleSaveTutorProfile}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Subjects (Comma separated)"
                  placeholder="Data Structures, Calculus, React"
                  value={profileData.subjects}
                  onChange={(e) => setProfileData({ ...profileData, subjects: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Tutor Bio"
                  placeholder="Tell peers about your background and teaching approach..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Academic Experience / Grades"
                  placeholder="e.g. A grade in CS201, Teaching Assistant for 1 semester"
                  value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenProfileModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Save Profile
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
