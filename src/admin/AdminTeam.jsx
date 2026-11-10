import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Loader2, Upload } from 'lucide-react';
import { supabase, resolveImageUrl, MEDIA_BUCKET } from '../lib/supabase';
import { uploadSlotImage, isStoragePath } from './imageUtils';
import './admin.css';

const EMPTY = { name: '', role: '', qualification: '', experience: '', bio: '', is_active: true };

function TeamForm({ initial, nextOrder, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {
    name: initial.name || '',
    role: initial.role || '',
    qualification: initial.qualification || '',
    experience: initial.experience || '',
    bio: initial.bio || '',
    is_active: initial.is_active !== false,
  } : EMPTY);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(resolveImageUrl(initial?.image_path));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const objectUrl = useRef(null);

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(f);
    setFile(f);
    setRemoveImage(false);
    setPreview(objectUrl.current);
  };

  const clearImage = () => {
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; }
    setFile(null);
    setRemoveImage(true);
    setPreview('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setError('Name and role are required.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        qualification: form.qualification.trim() || null,
        experience: form.experience.trim() || null,
        bio: form.bio.trim() || null,
        is_active: form.is_active,
      };

      let id = initial?.id;
      let imagePath = initial?.image_path ?? null;

      if (initial) {
        const { error: err } = await supabase.from('team_members').update(payload).eq('id', id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from('team_members')
          .insert({ ...payload, sort_order: nextOrder })
          .select('id')
          .single();
        if (err) throw err;
        id = data.id;
      }

      if (file) {
        imagePath = await uploadSlotImage(file, { prefix: 'team', slotKey: id, previous: initial?.image_path });
      } else if (removeImage && initial?.image_path) {
        if (isStoragePath(initial.image_path)) {
          await supabase.storage.from(MEDIA_BUCKET).remove([initial.image_path]);
        }
        imagePath = null;
      }

      if (imagePath !== (initial?.image_path ?? null)) {
        const { error: err } = await supabase.from('team_members').update({ image_path: imagePath }).eq('id', id);
        if (err) throw err;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save member.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="team-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="team-modal" onSubmit={submit}>
        <div className="team-modal-head">
          <h2>{initial ? 'Edit member' : 'Add team member'}</h2>
          <button type="button" className="team-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="team-photo">
          {preview ? <img src={preview} alt="" /> : <span className="team-avatar team-avatar-empty">No photo</span>}
          <div className="team-photo-actions">
            <button type="button" className="admin-btn small" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> {preview ? 'Change photo' : 'Upload photo'}
            </button>
            {preview && (
              <button type="button" className="admin-btn small danger" onClick={clearImage}>Remove photo</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={pickFile} />
        </div>

        <label>Name
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label>Field / Role
          <input type="text" value={form.role} onChange={(e) => set('role', e.target.value)} required />
        </label>
        <label>Qualification
          <input type="text" value={form.qualification} onChange={(e) => set('qualification', e.target.value)}
            placeholder="e.g. B.E. Civil, M.Tech Geotech" />
        </label>
        <label>Experience
          <input type="text" value={form.experience} onChange={(e) => set('experience', e.target.value)}
            placeholder="e.g. 10 Years" />
        </label>
        <label>Bio
          <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Short biography…" />
        </label>
        <label className="team-check">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Visible on website
        </label>

        <div className="team-modal-actions">
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null}
            {busy ? 'Saving…' : 'Save member'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminTeam() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('team_members')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (err) setError(err.message);
    else setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextOrder = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0) + 1;

  const move = async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= rows.length) return;
    const reordered = [...rows];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setBusyId(row.id);
    try {
      const updates = reordered.map((r, i) =>
        supabase.from('team_members').update({ sort_order: i + 1 }).eq('id', r.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      await load();
    } catch (err) {
      setError(err.message || 'Could not reorder.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      const { error: err } = await supabase.from('team_members').delete().eq('id', row.id);
      if (err) throw err;
      if (isStoragePath(row.image_path)) {
        await supabase.storage.from(MEDIA_BUCKET).remove([row.image_path]);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete member.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>Team Management</h1><p>Add, edit, reorder and publish team profiles.</p></div>
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add member
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-card admin-placeholder">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-card admin-placeholder">
          No team members yet. Click “Add member” to create the first profile.
        </div>
      ) : (
        <div className="team-grid">
          {rows.map((row) => {
            const src = resolveImageUrl(row.image_path);
            return (
              <article key={row.id} className={`team-card${row.is_active === false ? ' is-hidden' : ''}`}>
                <div className="team-card-head">
                  {src
                    ? <img className="team-avatar" src={src} alt={row.name} loading="lazy" />
                    : <span className="team-avatar team-avatar-empty">{row.name?.[0] || '?'}</span>}
                  <div className="team-card-id">
                    <h3>{row.name}</h3>
                    <p>{row.role}{row.experience ? ` · ${row.experience}` : ''}</p>
                    {row.qualification && <small>{row.qualification}</small>}
                  </div>
                  {row.is_active === false && <span className="team-badge">Hidden</span>}
                </div>
                {row.bio && <p className="team-bio">{row.bio}</p>}
                <div className="team-actions">
                  <button type="button" onClick={() => setEditing(row)} disabled={busyId === row.id}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => move(row, -1)} disabled={busyId === row.id || rows[0].id === row.id} aria-label="Move up">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(row, 1)} disabled={busyId === row.id || rows[rows.length - 1].id === row.id} aria-label="Move down">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" className="danger" onClick={() => remove(row)} disabled={busyId === row.id}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
              );
            })}
          <button type="button" className="team-add-card" onClick={() => setEditing('new')}>
            <Plus size={22} />
            <span>Add member</span>
          </button>
        </div>
      )}

      {editing && (
        <TeamForm
          initial={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
