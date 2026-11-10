import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './admin.css';

const SECTIONS = [
  { table: 'marquee_images', image: 'image_url', label: 'Home — Marquee', to: '/admin/home' },
  { table: 'home_images', image: 'image_url', label: 'Home — Marine investigation', to: '/admin/home' },
  { table: 'about_images', image: 'image_url', label: 'About — Images', to: '/admin/about' },
  { table: 'team_members', image: 'image_path', label: 'About — Team', to: '/admin/team' },
  { table: 'services', image: 'image_url', label: 'Services', to: '/admin/services' },
  { table: 'projects', image: 'image_url', label: 'Projects', to: '/admin/projects' },
  { table: 'project_gallery', image: 'image_url', label: 'Gallery', to: '/admin/projects' },
];

export default function AdminDashboard() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all(SECTIONS.map((s) => supabase.from(s.table).select(s.image))).then((results) => {
      if (!active) return;
      const failed = results.find((r) => r.error);
      if (failed) setError(failed.error.message);
      setSections(SECTIONS.map((s, i) => {
        const rows = results[i].data || [];
        return { ...s, total: rows.length, filled: rows.filter((r) => r[s.image]).length };
      }));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const total = sections.reduce((a, s) => a + s.total, 0);
  const filled = sections.reduce((a, s) => a + s.filled, 0);
  const team = sections.find((s) => s.table === 'team_members')?.total || 0;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>Dashboard</h1><p>Overview of website images and content.</p></div>
        <Link className="admin-btn" to="/admin/media">Media Library <ArrowUpRight size={15} /></Link>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-stats">
        <div className="admin-stat"><span>Image locations</span><b>{loading ? '…' : total}</b><small>{SECTIONS.length} sections</small></div>
        <div className="admin-stat"><span>Images set</span><b>{loading ? '…' : filled}</b><small>of {loading ? '…' : total}</small></div>
        <div className="admin-stat"><span>Pending</span><b>{loading ? '…' : Math.max(0, total - filled)}</b><small>to upload</small></div>
        <div className="admin-stat"><span>Team members</span><b>{loading ? '…' : team}</b><small>profiles</small></div>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Image coverage</h2>
          <span>{loading ? 'Loading…' : `${filled} / ${total} set`}</span>
        </div>
        <div className="admin-sections">
          {sections.map((s) => {
            const pct = s.total ? Math.round((s.filled / s.total) * 100) : 0;
            return (
              <Link key={s.table} to={s.to} className="admin-section-row">
                <div className="admin-section-name"><ImageIcon size={16} /><span>{s.label}</span></div>
                <div className="admin-bar"><i style={{ width: `${pct}%` }} /></div>
                <div className="admin-section-count">{s.total ? `${s.filled} / ${s.total}` : '—'}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
