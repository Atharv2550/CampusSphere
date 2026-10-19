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
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Storefront as StorefrontIcon,
  SwapHoriz as ExchangeIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  ArrowBack as BackIcon,
  Flag as FlagIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const MarketplaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [offerType, setOfferType] = useState('Buy');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [offeredItemDescription, setOfferedItemDescription] = useState('');
  const [handoverLocation, setHandoverLocation] = useState('Central Library Foyer');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/marketplace/${id}`);
      setData(res.data.data);
      if (res.data.data.price) {
        setOfferedPrice(res.data.data.price);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load listing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/marketplace/${id}/request`, {
        offerType,
        offeredPrice: parseFloat(offeredPrice) || 0,
        offeredItemDescription,
        handoverLocation,
        message,
      });
      showSuccess(res.data.message);
      setOpenRequestModal(false);
      fetchDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setActionLoading(true);
      await api.patch(`/marketplace/requests/${requestId}`, { status });
      showSuccess(`Request status updated to ${status}.`);
      fetchDetail();
    } catch (err) {
      showError('Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagListing = async () => {
    const reason = window.prompt('Specify reason for reporting this listing:');
    if (!reason) return;
    try {
      await api.post(`/marketplace/${id}/flag`, { reason });
      showSuccess('Listing reported for campus moderation.');
      navigate('/marketplace');
    } catch (err) {
      showError('Failed to flag listing.');
    }
  };

  if (loading || !data) {
    return <LinearProgress sx={{ mt: 4 }} />;
  }

  const isSeller = user && data.seller?._id === user.id;
  const userRequest = data.userRequest;
  const sellerRequests = data.sellerRequests || [];

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/marketplace')} sx={{ mb: 2 }}>
        Back to Marketplace
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 70%, #d97706 100%)',
          color: '#ffffff',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={data.category} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }} />
              <Chip label={data.condition} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff' }} />
              <Chip
                label={data.status}
                sx={{
                  bgcolor: data.status === 'Available' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
              {data.title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fef08a' }}>
              {data.listingType === 'Sell' ? `$${data.price}` : data.listingType === 'Exchange' ? 'Direct Exchange ⇄' : 'Free 🎁'}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FlagIcon />}
              onClick={handleFlagListing}
              sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff', '&:hover': { borderColor: '#ffffff' } }}
            >
              Report Listing
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Left: Description & Seller */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Item Details & Condition
            </Typography>
            <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, mb: 3 }}>
              {data.description}
            </Typography>

            {data.exchangePreference && (
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe', mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  Seller's Exchange Preference:
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e3a8a' }}>
                  {data.exchangePreference}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Student Seller Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#2563eb', width: 44, height: 44 }}>
                {data.seller?.fullName?.charAt(0) || 'S'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {data.seller?.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {data.seller?.department?.name || 'Student'} • Verified Campus Member
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Seller View: Incoming Exchange / Purchase Requests */}
          {isSeller && (
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Incoming Requests ({sellerRequests.length})
              </Typography>
              {sellerRequests.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No requests received yet for this listing.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {sellerRequests.map((req) => (
                    <Box key={req._id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {req.buyer?.fullName} ({req.offerType})
                        </Typography>
                        <Chip label={req.status} size="small" color={req.status === 'Accepted' ? 'success' : req.status === 'Completed' ? 'primary' : 'default'} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', mb: 1 }}>
                        "{req.message || 'No additional message.'}"
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                        Location: {req.handoverLocation}
                        {req.offerType === 'Buy' ? ` • Proposed: $${req.offeredPrice}` : ` • Proposed Item: ${req.offeredItemDescription}`}
                      </Typography>

                      {req.status === 'Pending' && (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" color="success" onClick={() => handleUpdateStatus(req._id, 'Accepted')}>
                            Accept & Reserve
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleUpdateStatus(req._id, 'Rejected')}>
                            Decline
                          </Button>
                        </Stack>
                      )}

                      {req.status === 'Accepted' && (
                        <Button size="small" variant="contained" color="primary" onClick={() => handleUpdateStatus(req._id, 'Completed')}>
                          Confirm Handover Complete
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </Grid>

        {/* Right: Buyer Proposal Action Box */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Campus Exchange Action
            </Typography>

            {isSeller ? (
              <Alert severity="info">
                You are the seller of this listing. You can accept requests and manage handover arrangements in the panel below.
              </Alert>
            ) : userRequest ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Your request is <strong>{userRequest.status}</strong>!
                </Alert>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                  Proposed Handover: {userRequest.handoverLocation}
                </Typography>
                {userRequest.status === 'Accepted' && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    The seller accepted your request! Meet at the designated location to complete the handover.
                  </Alert>
                )}
              </Box>
            ) : data.status !== 'Available' ? (
              <Alert severity="warning">
                This item is currently {data.status.toLowerCase()} and cannot accept new requests.
              </Alert>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Express interest to buy or propose an exchange. Handover is completed safely on campus.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => setOpenRequestModal(true)}
                  sx={{ py: 1.3, fontWeight: 700 }}
                >
                  Send Purchase / Exchange Request
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600 }}>
                💡 CAMPUS SAFETY GUIDELINE
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                All handovers should occur in public campus venues such as the Central Library foyer or Campus Cafeteria during daytime hours.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Buyer Request Dialog */}
      <Dialog open={openRequestModal} onClose={() => setOpenRequestModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Send Exchange / Purchase Request</DialogTitle>
        <Box component="form" onSubmit={handleSubmitRequest}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Offer Type"
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                >
                  <MenuItem value="Buy">Direct Purchase ($)</MenuItem>
                  <MenuItem value="Exchange">Item Exchange</MenuItem>
                </TextField>
              </Grid>

              {offerType === 'Buy' ? (
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Offered Price ($)"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                  />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Item You Are Offering in Exchange"
                    placeholder="e.g. TI-83 Calculator or Mechanical Drafting Pens"
                    value={offeredItemDescription}
                    onChange={(e) => setOfferedItemDescription(e.target.value)}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Preferred Campus Handover Location"
                  value={handoverLocation}
                  onChange={(e) => setHandoverLocation(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message to Seller"
                  placeholder="e.g. Can meet tomorrow between 2pm and 4pm."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRequestModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={actionLoading}>
              Submit Request
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
