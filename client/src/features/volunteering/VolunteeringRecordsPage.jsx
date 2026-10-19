import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  WorkspacePremium as CertificateIcon,
  ArrowBack as BackIcon,
  CheckCircle as VerifiedIcon,
  Print as PrintIcon,
  School as CampusIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const VolunteeringRecordsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();

  const [records, setRecords] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [openCertModal, setOpenCertModal] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/volunteering/my-records');
      setRecords(res.data.data?.records || []);
      setTotalHours(res.data.data?.totalVerifiedHours || 0);
    } catch (_) {
      showError('Failed to load volunteering history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleOpenCertificate = (record) => {
    setSelectedCert(record);
    setOpenCertModal(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <Box maxWidth="lg" sx={{ mx: 'auto' }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/volunteering')} sx={{ mb: 3 }}>
        Back to Volunteering Drives
      </Button>

      {/* Verified Hours Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #166534 100%)',
          color: '#ffffff',
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <VerifiedIcon sx={{ color: '#4ade80' }} />
            <Typography variant="subtitle2" sx={{ color: '#86efac', fontWeight: 700 }}>
              VERIFIED COMMUNITY SERVICE RECORD
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {user?.fullName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Official transcript record for campus and civic engagement
          </Typography>
        </Box>

        <Box sx={{ textAlign: { sm: 'right' }, p: 2, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 700, display: 'block' }}>
            TOTAL ACCUMULATED HOURS
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#4ade80' }}>
            {totalHours} <span style={{ fontSize: '1.25rem' }}>hrs</span>
          </Typography>
        </Box>
      </Paper>

      {/* Records List */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : records.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ color: '#64748b' }}>
            No completed volunteering activities recorded yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {records.map((rec) => (
            <Card key={rec._id} sx={{ p: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {rec.activity?.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Venue: {rec.activity?.venue} • Date: {new Date(rec.activity?.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={rec.status === 'attended' ? `${rec.verifiedHours} Verified Hours` : rec.status}
                    color={rec.status === 'attended' ? 'success' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                  {rec.certificateIssued && (
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<CertificateIcon />}
                      onClick={() => handleOpenCertificate(rec)}
                    >
                      View Certificate
                    </Button>
                  )}
                </Box>
              </Box>

              {rec.verificationNotes && (
                <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                  Supervisor Note: "{rec.verificationNotes}"
                </Typography>
              )}
            </Card>
          ))}
        </Stack>
      )}

      {/* Certificate Modal */}
      <Dialog open={openCertModal} onClose={() => setOpenCertModal(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: { xs: 3, sm: 6 }, bgcolor: '#ffffff' }}>
          <Box
            sx={{
              p: 5,
              border: '8px double #0f172a',
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: '#fffefc',
              position: 'relative',
            }}
          >
            <CampusIcon sx={{ fontSize: 54, color: '#0f172a', mb: 1 }} />
            <Typography variant="h6" sx={{ letterSpacing: '0.2em', fontWeight: 800, color: '#64748b', mb: 1 }}>
              CAMPUSSPHERE CIVIC LEADERSHIP
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, fontFamily: 'serif' }}>
              Certificate of Community Service
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', mb: 1 }}>
              This document officially recognizes that
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563eb', mb: 1, textDecoration: 'underline' }}>
              {user?.fullName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', maxWidth: 600, mx: 'auto', mb: 3 }}>
              has successfully completed <strong>{selectedCert?.verifiedHours} verified hours</strong> of commendable public service for{' '}
              <strong>"{selectedCert?.activity?.title}"</strong> on {new Date(selectedCert?.activity?.date).toLocaleDateString()}.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4 }}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                  VERIFICATION CODE:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {selectedCert?.certificateCode}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                  CAMPUS REGISTRAR:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Dr. Eleanor Vance (Dean)
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCertModal(false)}>Close</Button>
          <Button variant="contained" color="secondary" startIcon={<PrintIcon />} onClick={handlePrintCertificate}>
            Print Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
