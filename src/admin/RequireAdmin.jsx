import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import './admin.css';

export default function RequireAdmin({ children }) {
  const { session, isAdmin, loading, adminLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || (session && adminLoading)) {
    return <div className="admin-gate"><span className="admin-spinner" /> Checking access…</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    const leave = async () => {
      await signOut();
      navigate('/admin/login', { replace: true });
    };
    return (
      <div className="admin-gate">
        <div>
          <h1>Not authorised</h1>
          <p>This account is not on the admin allowlist.</p>
          <button type="button" onClick={leave}>Back to login</button>
        </div>
      </div>
    );
  }

  return children;
}
