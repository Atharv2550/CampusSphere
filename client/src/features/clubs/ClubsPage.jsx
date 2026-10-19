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
  LinearProgress,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Groups as ClubsIcon,
  ArrowForward as ArrowIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const ClubsPage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = ['Technical', 'Cultural', 'Sports', 'Academic', 'Social Service', 'Arts & Media'];

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await api.get('/clubs', { params });
      setClubs(res.data.data || []);
    } catch (err) {
      showError('Failed to load clubs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Clubs & Student Societies
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Explore technical societies, arts media guilds, sports chapters, and community initiatives
          </Typography>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search clubs by name or keywords..."
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
              label="Club Category"
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

      {/* Clubs Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : clubs.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <ClubsIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569' }}>
            No campus clubs found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {clubs.map((club) => (
            <Grid item xs={12} sm={6} md={4} key={club._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/clubs/${club._id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#0284c7',
                        width: 48,
                        height: 48,
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {club.code?.substring(0, 3)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                        {club.name}
                      </Typography>
                      <Chip label={club.category} size="small" sx={{ mt: 0.5, fontWeight: 700 }} />
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#64748b', mb: 3, minHeight: 44, lineHeight: 1.5 }}>
                    {club.description.substring(0, 105)}...
                  </Typography>

                  <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      {club.department?.name || 'Open to All'}
                    </Typography>
                    <Button size="small" endIcon={<ArrowIcon />}>
                      Explore Club
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
