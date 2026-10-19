import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
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
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  Palette as ColorIcon,
  CheckCircle as ApprovedIcon,
  ArrowBack as BackIcon,
  Flag as FlagIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const LostFoundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openClaimModal, setOpenClaimModal] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lost-found/${id}`);
      setData(res.data.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load item report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/lost-found/${id}/claim`, {
        verificationDetails,
        contactNumber,
      });
      showSuccess(res.data.message);
      setOpenClaimModal(false);
      setVerificationDetails('');
      fetchDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit ownership claim.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewClaim = async (claimId, status) => {
    const notes = window.prompt(`Enter review notes for ${status}:`);
    try {
      setActionLoading(true);
      await api.patch(`/lost-found/claims/${claimId}`, { status, reviewerNotes: notes });
      showSuccess(`Claim ${status} successfully.`);
      fetchDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to review claim.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagItem = async () => {
    const reason = window.prompt('Please specify reason for reporting this item:');
    if (!reason) return;
    try {
      await api.post(`/lost-found/${id}/flag`, { reason });
      showSuccess('Item flagged for campus administrator moderation.');
      navigate('/lost-found');
    } catch (err) {
      showError('Failed to flag item.');
    }
  };

  if (loading || !data) {
    return <LinearProgress sx={{ mt: 4 }} />;
  }

  const { item, potentialMatches = [], claims = [] } = data;
  const isReporter = user && item.reporter?._id === user.id;
  const isAdmin = user && user.role === 'admin';
  const isFound = item.type === 'found';

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/lost-found')} sx={{ mb: 2 }}>
        Back to Lost & Found
      </Button>

      {/* Item Overview Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: item.type === 'lost' ? 'linear-gradient(135deg, #0f172a 0%, #991b1b 100%)' : 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)',
          color: '#ffffff',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={item.type === 'lost' ? 'LOST REPORT' : 'FOUND REPORT'}
                sx={{ bgcolor: item.type === 'lost' ? '#ef4444' : '#10b981', color: '#ffffff', fontWeight: 800 }}
              />
              <Chip label={item.category} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 600 }} />
              <Chip label={item.status} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff' }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
              {item.title}
            </Typography>
            <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 700 }}>
              {item.description}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FlagIcon />}
              onClick={handleFlagItem}
              sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff', '&:hover': { borderColor: '#ffffff' } }}
            >
              Report Post
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.15)' }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocationIcon sx={{ color: '#38bdf8' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  LOCATION ON CAMPUS
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.location}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DateIcon sx={{ color: '#38bdf8' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  DATE OCCURRED
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {new Date(item.dateOccurred).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          {item.color && (
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ColorIcon sx={{ color: '#38bdf8' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    COLOR / FINISH
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {item.color}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Main Grid: Matching Algorithm & Claims */}
      <Grid container spacing={4}>
        {/* Left Column: Transparent Matching Suggestions */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <SecurityIcon sx={{ color: '#2563eb' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Transparent Deterministic Matching
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Our transparent matching algorithm ranks items of opposite report type based on category, color overlap, date proximity, and campus location similarity.
            </Typography>

            {potentialMatches.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No potential matches currently above the 25% threshold. We'll automatically alert you when a match is submitted.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {potentialMatches.map((m) => (
                  <Card key={m.item._id} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${m.matchPercentage}% Match`}
                          color={m.matchPercentage >= 70 ? 'success' : 'primary'}
                          sx={{ fontWeight: 800 }}
                        />
                        <Chip label={m.item.type.toUpperCase()} size="small" />
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/lost-found/${m.item._id}`)}>
                        Inspect Item
                      </Button>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {m.item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600, display: 'block', mt: 0.5 }}>
                      Score Explanation: {m.explanation}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                      Location: {m.item.location} • Date: {new Date(m.item.dateOccurred).toLocaleDateString()}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Ownership Claims & Verification */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Ownership Verification
            </Typography>

            {isFound && !isReporter && item.status !== 'Resolved' && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2.5 }}>
                  Is this your item? Submit private proof of ownership to claim it.
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => setOpenClaimModal(true)}
                  sx={{ py: 1.3, fontWeight: 700 }}
                >
                  File Ownership Claim
                </Button>
              </Box>
            )}

            {/* List of Claims (Visible to Reporter or Admin) */}
            {(isReporter || isAdmin) && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a' }}>
                  Submitted Ownership Claims ({claims.length})
                </Typography>

                {claims.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No ownership claims filed on this item yet.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {claims.map((claim) => (
                      <Box key={claim._id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {claim.claimant?.fullName}
                          </Typography>
                          <Chip
                            label={claim.status.toUpperCase()}
                            size="small"
                            color={claim.status === 'approved' ? 'success' : claim.status === 'rejected' ? 'error' : 'warning'}
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>

                        {/* Private Verification Box */}
                        <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px dashed #cbd5e1', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700, display: 'block' }}>
                            🔒 PRIVATE PROOF OF OWNERSHIP:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic' }}>
                            "{claim.verificationDetails}"
                          </Typography>
                          {claim.contactNumber && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                              Contact Phone: {claim.contactNumber}
                            </Typography>
                          )}
                        </Box>

                        {claim.status === 'pending' && (
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleReviewClaim(claim._id, 'approved')}
                              disabled={actionLoading}
                            >
                              Approve & Handover
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleReviewClaim(claim._id, 'rejected')}
                              disabled={actionLoading}
                            >
                              Reject Claim
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Private Claim Submission Dialog */}
      <Dialog open={openClaimModal} onClose={() => setOpenClaimModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Ownership Verification Claim</DialogTitle>
        <Box component="form" onSubmit={handleSubmitClaim}>
          <DialogContent dividers>
            <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 2 }}>
              <strong>Confidential Verification:</strong> This detail is kept strictly private and will only be reviewed by the item finder and campus administration to prevent wrongful handovers.
            </Alert>

            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Private Proof of Ownership Details"
              value={verificationDetails}
              onChange={(e) => setVerificationDetails(e.target.value)}
              placeholder="e.g. Serial number ending in 904, specific scratch on left corner, lock screen wallpaper is a Shiba Inu, or items inside pouch."
              helperText="Provide distinguishing markers that only the true owner would know."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contact Phone Number for Handover"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+1 (555) 019-2834"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenClaimModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={actionLoading}>
              Submit Verification Claim
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
