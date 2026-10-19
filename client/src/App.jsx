import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Authenticated Pages
import { StudentDashboard } from './features/dashboard/StudentDashboard';
import { EventsPage } from './features/events/EventsPage';
import { EventDetailPage } from './features/events/EventDetailPage';
import { LostFoundPage } from './features/lostFound/LostFoundPage';
import { LostFoundDetailPage } from './features/lostFound/LostFoundDetailPage';
import { MarketplacePage } from './features/marketplace/MarketplacePage';
import { MarketplaceDetailPage } from './features/marketplace/MarketplaceDetailPage';
import { TutoringPage } from './features/tutoring/TutoringPage';
import { ClubsPage } from './features/clubs/ClubsPage';
import { ClubDetailPage } from './features/clubs/ClubDetailPage';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { ResourceBookingPage } from './features/bookings/ResourceBookingPage';
import { VolunteeringPage } from './features/volunteering/VolunteeringPage';
import { VolunteeringRecordsPage } from './features/volunteering/VolunteeringRecordsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { AdminPortalPage } from './features/admin/AdminPortalPage';
import { ProfilePage } from './features/profile/ProfilePage';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                {/* Public Routes with Public Layout */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/access-denied" element={<AccessDeniedPage />} />
                </Route>

                {/* Authenticated Application Routes with AppLayout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<StudentDashboard />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/events/:id" element={<EventDetailPage />} />
                    <Route path="/lost-found" element={<LostFoundPage />} />
                    <Route path="/lost-found/:id" element={<LostFoundDetailPage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
                    <Route path="/tutoring" element={<TutoringPage />} />
                    <Route path="/clubs" element={<ClubsPage />} />
                    <Route path="/clubs/:id" element={<ClubDetailPage />} />
                    <Route path="/announcements" element={<AnnouncementsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/bookings" element={<ResourceBookingPage />} />
                    <Route path="/volunteering" element={<VolunteeringPage />} />
                    <Route path="/volunteering/my-records" element={<VolunteeringRecordsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Staff / Coordinator / Admin Analytics */}
                    <Route
                      element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'coordinator', 'resource_manager']} />}
                    >
                      <Route path="/analytics" element={<AnalyticsPage />} />
                    </Route>

                    {/* Admin Only Portal */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                      <Route path="/admin" element={<AdminPortalPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* 404 Catch All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
