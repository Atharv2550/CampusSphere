import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Storefront as MarketplaceIcon,
  SwapHoriz as ExchangeIcon,
  AttachMoney as MoneyIcon,
  CardGiftcard as FreeIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [listingType, setListingType] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Textbooks',
    condition: 'Gently Used',
    listingType: 'Sell',
    price: '',
    exchangePreference: '',
  });

  const categories = [
    'Textbooks',
    'Calculators & Tools',
    'Lab Coats & Equipment',
    'Stationery & Drafting',
    'Electronics & Gadgets',
    'Dorm & Daily Essentials',
    'Notes & Course Materials',
    'Other',
  ];

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (listingType) params.listingType = listingType;
      if (search) params.search = search;

      const res = await api.get('/marketplace', { params });
      setListings(res.data.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, listingType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleBookmarkToggle = async (e, listingId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/marketplace/${listingId}/bookmark`);
      showSuccess(res.data.message);
      fetchListings();
    } catch (err) {
      showError('Failed to bookmark listing.');
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace', formData);
      showSuccess('Item successfully listed on Campus Marketplace!');
      setOpenCreate(false);
      fetchListings();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to list item.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Marketplace & Item Exchange
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Student-to-student exchange for textbooks, calculators, lab coats, and campus essentials
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: 2.5 }}
        >
          List an Item
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search items by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Listing Type"
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Sell">For Sale ($)</MenuItem>
              <MenuItem value="Exchange">Direct Exchange ⇄</MenuItem>
              <MenuItem value="Free Giveaway">Free Giveaway 🎁</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Listings Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : listings.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <MarketplaceIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No active listings found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {listings.map((item) => {
            const isBookmarked = user && item.bookmarkedBy?.includes(user.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => navigate(`/marketplace/${item._id}`)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        <Chip
                          label={item.listingType}
                          size="small"
                          color={item.listingType === 'Sell' ? 'primary' : item.listingType === 'Exchange' ? 'secondary' : 'success'}
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip label={item.condition} size="small" variant="outlined" />
                      </Box>
                      <IconButton size="small" onClick={(e) => handleBookmarkToggle(e, item._id)} color={isBookmarked ? 'primary' : 'default'}>
                        {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: 52 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, lineHeight: 1.4 }}>
                      {item.description.substring(0, 95)}...
                    </Typography>

                    <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        {item.listingType === 'Sell' ? (
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#15803d' }}>
                            ${item.price}
                          </Typography>
                        ) : item.listingType === 'Exchange' ? (
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                            ⇄ Exchange
                          </Typography>
                        ) : (
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0d9488' }}>
                            🎁 Free Giveaway
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Seller: {item.seller?.fullName?.split(' ')[0]}
                        </Typography>
                      </Box>

                      <Chip label={item.status} size="small" color={item.status === 'Available' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* List Item Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>List Item on Campus Marketplace</DialogTitle>
        <Box component="form" onSubmit={handleCreateListing}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Item Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. TI-84 Plus Graphing Calculator"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  {['Brand New', 'Like New', 'Gently Used', 'Fair'].map((cond) => (
                    <MenuItem key={cond} value={cond}>
                      {cond}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Listing Type"
                  value={formData.listingType}
                  onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                >
                  <MenuItem value="Sell">For Sale ($)</MenuItem>
                  <MenuItem value="Exchange">Direct Exchange (Items/Notes)</MenuItem>
                  <MenuItem value="Free Giveaway">Free Giveaway (Senior donation)</MenuItem>
                </TextField>
              </Grid>
              {formData.listingType === 'Sell' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Price ($ USD)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </Grid>
              )}
              {formData.listingType === 'Exchange' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Looking to Exchange For"
                    placeholder="e.g. Breadboard or EE notes"
                    value={formData.exchangePreference}
                    onChange={(e) => setFormData({ ...formData, exchangePreference: e.target.value })}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Description & Handover Details"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Publish Listing
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
