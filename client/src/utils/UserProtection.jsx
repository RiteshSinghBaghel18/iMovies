import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { api } from './api';

function UserProtection({ children }) {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('imovies-token');
    const role = localStorage.getItem('imovies-role');

    if (!token) {
      setIsValid(false);
      return;
    }

    api.validateToken()
      .then(res => {
        setIsValid(res.data.success && role === 'user');
      })
      .catch(() => {
        setIsValid(false);
      });
  }, []);

  if (isValid === null) {
    return <Loader />;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default UserProtection;
