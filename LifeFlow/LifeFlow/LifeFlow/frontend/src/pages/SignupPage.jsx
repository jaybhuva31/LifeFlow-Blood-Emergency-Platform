import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

// SignupPage now renders the fullscreen AuthModal in register tab
const SignupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') navigate('/facility-dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else navigate('/select-role', { replace: true });
    }
  }, [user, navigate]);

  const handleClose = (isSuccess) => {
    if (!isSuccess) {
      navigate('/');
    }
  };

  return <AuthModal defaultTab="register" onClose={handleClose} />;
};

export default SignupPage;
