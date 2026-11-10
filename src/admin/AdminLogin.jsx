import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import './admin.css';

export default function AdminLogin() {
  const { session, isAdmin, loading, adminLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !adminLoading && session && isAdmin) navigate(from, { replace: true });
  }, [loading, adminLoading, session, isAdmin, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-brand">
          <img src="/assets/srs-mark-dark.png" alt="" />
          <div><b>SRS GEOTECH</b><span>CMS</span></div>
        </div>
        <h1>Admin sign in</h1>
        <p>Manage website images and team members.</p>

        {session && !adminLoading && !isAdmin && (
          <div className="admin-error">This account is not authorised. Contact the administrator.</div>
        )}
        {error && <div className="admin-error">{error}</div>}

        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="username" placeholder="you@example.com" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="current-password" placeholder="••••••••" />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
