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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  Palette as ColorIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const LostFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabType, setTabType] = useState(''); // '' = all, 'lost', 'found'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    category: 'Electronics',
    description: '',
    color: '',
    dateOccurred: new Date().toISOString().split('T')[0],
    location: '',
  });

  const categories = [
    'Electronics',
    'Books & Notes',
    'ID Cards & Keys',
    'Clothing & Apparel',
    'Bags & Wallets',
    'Accessories & Jewellery',
    'Bottles & Containers',
    'Sports & Music Gear',
    'Other',
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tabType) params.type = tabType;
      if (category) params.category = category;
      if (search) params.search = search;

      const res = await api.get('/lost-found', { params });
      setItems(res.data.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load lost & found items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tabType, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lost-found', formData);
      showSuccess(`Report for ${formData.type} item submitted successfully!`);
      setOpenCreate(false);
      fetchItems();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Lost & Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Reuniting campus belongings with intelligent deterministic matching and private ownership claims
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: 2.5 }}
        >
          Report Lost or Found Item
        </Button>
      </Box>

      {/* Type Tabs */}
      <Tabs
        value={tabType}
        onChange={(e, val) => setTabType(val)}
        sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}
      >
        <Tab label="All Campus Reports" value="" sx={{ fontWeight: 700 }} />
        <Tab label="🔴 Lost Items" value="lost" sx={{ fontWeight: 700 }} />
        <Tab label="🟢 Found Items" value="found" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Filter Bar */}
      <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search items by keyword, brand, location, or color..."
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
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Item Category"
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
        </Grid>
      </Box>

      {/* Items Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : items.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No reports found matching your criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderTop: item.type === 'lost' ? '4px solid #ef4444' : '4px solid #10b981',
                }}
                onClick={() => navigate(`/lost-found/${item._id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Chip
                      label={item.type === 'lost' ? 'LOST' : 'FOUND'}
                      size="small"
                      color={item.type === 'lost' ? 'error' : 'success'}
                      sx={{ fontWeight: 800 }}
                    />
                    <Chip label={item.category} size="small" />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: 52 }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, lineHeight: 1.4 }}>
                    {item.description.substring(0, 95)}...
                  </Typography>

                  <Box sx={{ pt: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                        {item.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DateIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Reported: {new Date(item.dateOccurred).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Report Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Lost or Found Report</DialogTitle>
        <Box component="form" onSubmit={handleCreateReport}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Report Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="lost">I Lost an Item</MenuItem>
                  <MenuItem value="found">I Found an Item</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Item Name / Headline"
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
                  fullWidth
                  label="Color / Finish"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g. White, Dark Blue"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Detailed Public Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  helperText="Do NOT include secret private ownership details (e.g. unlock passcode or exact serial number) in public description."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Date Lost or Found"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOccurred}
                  onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Campus Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Library 2nd Floor, Room 204"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary">
              Submit Report
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
