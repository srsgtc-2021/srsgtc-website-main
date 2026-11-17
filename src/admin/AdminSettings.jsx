import React, { useEffect, useState } from 'react';
import { KeyRound, HardDrive, Image as ImageIcon, Users, Loader2 } from 'lucide-react';
import { supabase, MEDIA_BUCKET } from '../lib/supabase';
import { useAuth } from './auth';
import { listMediaFiles, formatBytes } from './mediaUtils';
import './admin.css';

const formatStamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  const [media, setMedia] = useState({ count: 0, size: 0 });
  const [mediaLoading, setMediaLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, filled: 0, team: 0 });
  const [build, setBuild] = useState({ builtAt: '', latest: '', stale: false });
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    listMediaFiles()
      .then((files) => {
        if (!active) return;
        setMedia({ count: files.length, size: files.reduce((a, f) => a + f.size, 0) });
      })
      .catch(() => {})
      .finally(() => { if (active) setMediaLoading(false); });

    const tables = [
      { table: 'marquee_images', image: 'image_url' },
      { table: 'home_images', image: 'image_url' },
      { table: 'about_images', image: 'image_url' },
      { table: 'team_members', image: 'image_path' },
      { table: 'services', image: 'image_url' },
      { table: 'projects', image: 'image_url' },
      { table: 'project_gallery', image: 'image_url' },
    ];
    Promise.all(tables.map((t) => supabase.from(t.table).select(t.image))).then((results) => {
      if (!active) return;
      let total = 0;
      let filled = 0;
      let team = 0;
      results.forEach((r, i) => {
        const rows = r.data || [];
        total += rows.length;
        filled += rows.filter((row) => row[tables[i].image]).length;
        if (tables[i].table === 'team_members') team = rows.length;
      });
      setCounts({ total, filled, team });
    });

    const builtAt = typeof window !== 'undefined'
      ? (window.__SRS_CONTENT_SNAPSHOT_AT__ || window.__SRS_BUILT_AT__ || '')
      : '';
    const timestampTables = [...tables.map((t) => t.table), 'seo_pages', 'seo_state'];
    Promise.all(timestampTables.map((table) => (
      supabase.from(table).select('updated_at').order('updated_at', { ascending: false }).limit(1)
    ))).then((results) => {
      if (!active) return;
      const latest = results
        .map((r) => r.data?.[0]?.updated_at)
        .filter(Boolean)
        .sort()
        .pop() || '';
      const latestTime = latest ? new Date(latest).getTime() : NaN;
      const builtTime = builtAt ? new Date(builtAt).getTime() : NaN;
      setBuild({
        builtAt,
        latest,
        stale: Number.isFinite(latestTime) && Number.isFinite(builtTime) && latestTime > builtTime,
      });
    }).catch(() => {});

    supabase.from('admin_allowlist').select('*').order('created_at', { ascending: true }).then(({ data, error: err }) => {
      if (!active) return;
      if (err) setError(err.message);
      else setAdmins(data || []);
    });

    return () => { active = false; };
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (password.length < 8) {
      setPwdMsg({ type: 'error', text: 'Use at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPwdBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setPwdBusy(false);
    if (err) {
      setPwdMsg({ type: 'error', text: err.message });
    } else {
      setPassword('');
      setConfirmPassword('');
      setPwdMsg({ type: 'ok', text: 'Password updated successfully.' });
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>Settings</h1><p>Account, storage and content overview.</p></div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="settings-grid">
        <section className="admin-card settings-card">
          <div className="settings-card-head"><KeyRound size={18} /><h2>Account</h2></div>
          <p className="settings-line"><span>Signed in as</span><b>{user?.email}</b></p>
          <form className="settings-form" onSubmit={changePassword}>
            <label>New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" placeholder="At least 8 characters" />
            </label>
            <label>Confirm new password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" placeholder="Repeat password" />
            </label>
            {pwdMsg && <div className={pwdMsg.type === 'error' ? 'admin-error' : 'settings-ok'}>{pwdMsg.text}</div>}
            <button type="submit" className="admin-btn" disabled={pwdBusy}>
              {pwdBusy ? <Loader2 size={15} className="spin" /> : null}
              {pwdBusy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="admin-card settings-card">
          <div className="settings-card-head"><HardDrive size={18} /><h2>Storage</h2></div>
          <p className="settings-line"><span>Bucket</span><b>{MEDIA_BUCKET}</b></p>
          <p className="settings-line"><span>Files</span><b>{mediaLoading ? '…' : media.count}</b></p>
          <p className="settings-line"><span>Used</span><b>{mediaLoading ? '…' : formatBytes(media.size)}</b></p>
          <p className="settings-note">Images are served from the public media bucket. Replacing an image removes the previous file automatically.</p>
        </section>

        <section className="admin-card settings-card">
          <div className="settings-card-head"><ImageIcon size={18} /><h2>Content</h2></div>
          <p className="settings-line"><span>Image locations</span><b>{counts.total}</b></p>
          <p className="settings-line"><span>Images set</span><b>{counts.filled}</b></p>
          <p className="settings-line"><span>Pending</span><b>{Math.max(0, counts.total - counts.filled)}</b></p>
          <p className="settings-line"><span>Team members</span><b>{counts.team}</b></p>
          <p className="settings-line"><span>Published snapshot</span><b>{formatStamp(build.builtAt)}</b></p>
          <p className="settings-line"><span>Newest content</span><b>{formatStamp(build.latest)}</b></p>
          {build.stale && (
            <div className="admin-error">Content is newer than the published snapshot. Redeploy the site to refresh the public pages.</div>
          )}
          {!build.builtAt && <p className="settings-note">Build timestamp is available in production builds.</p>}
          <p className="settings-note">The newest content check includes SEO overrides and reset events.</p>
        </section>

        <section className="admin-card settings-card">
          <div className="settings-card-head"><Users size={18} /><h2>Administrators</h2></div>
          {admins.length === 0 ? (
            <p className="settings-note">No administrators listed.</p>
          ) : (
            <ul className="settings-admins">
              {admins.map((a) => <li key={a.id || a.email}><span>{a.email}</span>{a.email === user?.email && <small>you</small>}</li>)}
            </ul>
          )}
          <p className="settings-note">Up to three administrators are allowed. Add or remove emails in the admin_allowlist table.</p>
        </section>
      </div>
    </div>
  );
}
