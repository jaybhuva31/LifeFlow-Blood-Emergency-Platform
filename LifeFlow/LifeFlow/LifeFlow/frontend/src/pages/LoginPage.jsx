import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

// LoginPage now renders the fullscreen AuthModal directly
const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else if (user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') navigate('/facility-dashboard', { replace: true });
      else if (user.role === 'DONOR') navigate('/donor-dashboard', { replace: true });
      else if (user.role === 'RECEIVER') navigate('/receiver-dashboard', { replace: true });
      else navigate('/select-role', { replace: true });
    }
  }, [user, navigate]);

  const handleClose = (isSuccess) => {
    if (!isSuccess) {
      navigate('/');
    }
  };

  return <AuthModal defaultTab="login" onClose={handleClose} />;
};

export default LoginPage;
