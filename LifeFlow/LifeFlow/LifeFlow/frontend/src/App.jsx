import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import CampsPage from './pages/CampsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import TempDashboard from './pages/TempDashboard';

// Part 2 Pages
import DonorDashboard from './pages/DonorDashboard';
import DonorProfilePage from './pages/DonorProfilePage';
import ReceiverDashboard from './pages/ReceiverDashboard';
import ReceiverRequestsPage from './pages/ReceiverRequestsPage';

import AdminDashboard from './pages/AdminDashboard';
import TrackRequestPage from './pages/TrackRequestPage';
import DonationHistoryPage from './pages/DonationHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import DonationCampPage from './pages/DonationCampPage';
import CampDetailsPage from './pages/CampDetailsPage';
import MapPage from './pages/MapPage';
import EmergencyRequestsPage from './pages/EmergencyRequestsPage';
import HospitalsPage from './pages/HospitalsPage';
import FacilityRegisterPage from './pages/FacilityRegisterPage';
import FacilityDashboard from './pages/FacilityDashboard';
import LiveAlertPoller from './components/LiveAlertPoller';

// Reusable Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, canUseRole } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role) => canUseRole(role))) {
    // If user's role is not allowed, redirect to correct dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') return <Navigate to="/facility-dashboard" replace />;
    if (user.role === 'DONOR') return <Navigate to="/donor-dashboard" replace />;
    return <Navigate to="/receiver-dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/select-role" replace />;
  }

  return children;
};

// Dynamic Profile Router based on authenticated role
const ProfileSelector = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'DONOR') {
    return <DonorProfilePage />;
  } else if (user.role === 'RECEIVER') {
    return <Navigate to="/receiver-dashboard" replace />;
  }
  return <TempDashboard title="Admin Profile" />;
};

// Beautiful Custom 404 Page
const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <h1 className="fw-bold text-danger display-1">404</h1>
      <h3 className="fw-bold">Page Not Found</h3>
      <p className="text-muted" style={{ maxWidth: '400px' }}>
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-red mt-3">Back to Home</Link>
    </div>
  );
};

// Import Link for NotFoundPage
import { Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <LiveAlertPoller />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route 
                path="/camps" 
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN', 'HOSPITAL', 'BLOOD_BANK']}>
                    <DonationCampPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/camps/:id" 
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN', 'HOSPITAL', 'BLOOD_BANK']}>
                    <CampDetailsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/hospitals-blood-banks" element={<HospitalsPage />} />
              <Route path="/register-facility" element={<FacilityRegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-otp" element={<OtpVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route 
                path="/select-role" 
                element={
                  <ProtectedRoute>
                    <RoleSelectionPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Dashboards */}
              <Route 
                path="/facility-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL', 'BLOOD_BANK']}>
                    <FacilityDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/emergency-requests" 
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <EmergencyRequestsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/receiver-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['RECEIVER']}>
                    <ReceiverDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/my-requests" element={<ProtectedRoute allowedRoles={['RECEIVER']}><ReceiverRequestsPage /></ProtectedRoute>} />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Workflows (Part 3) */}
              <Route 
                path="/create-request" 
                element={
                  <ProtectedRoute allowedRoles={['RECEIVER']}>
                    <Navigate to="/receiver-dashboard?new-request=1" replace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/track-request/:request_id" 
                element={
                  <ProtectedRoute>
                    <TrackRequestPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonationHistoryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/map" 
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                } 
              />

              {/* Profile & Settings (Shared Protected Routes) */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileSelector />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <TempDashboard title="Account Settings" />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
