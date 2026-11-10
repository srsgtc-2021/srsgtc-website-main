import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Loader2, Upload,
  Layers3, Compass, Drill, Waves, ShieldCheck, Microscope,
} from 'lucide-react';
import { supabase, resolveImageUrl, MEDIA_BUCKET } from '../lib/supabase';
import { uploadSlotImage, isStoragePath } from './imageUtils';
import './admin.css';

const ICON_OPTIONS = [
  { value: 'layers', label: 'Layers / Ground', Icon: Layers3 },
  { value: 'compass', label: 'Compass / Survey', Icon: Compass },
  { value: 'drill', label: 'Drill / Piling', Icon: Drill },
  { value: 'waves', label: 'Waves / Grouting', Icon: Waves },
  { value: 'shield', label: 'Shield / Anchors', Icon: ShieldCheck },
  { value: 'microscope', label: 'Microscope / Laboratory', Icon: Microscope },
];

const iconFor = (value) => ICON_OPTIONS.find((o) => o.value === value)?.Icon || Layers3;
const iconLabel = (value) => ICON_OPTIONS.find((o) => o.value === value)?.label || 'Layers / Ground';

const EMPTY = { title: '', summary: '', body: '', icon: 'layers', is_active: true };

function ServiceForm({ initial, nextOrder, nextSlotKey, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {
    title: initial.label || '',
    summary: initial.summary || '',
    body: initial.body || '',
    icon: initial.icon || 'layers',
    is_active: initial.is_active !== false,
  } : EMPTY);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(resolveImageUrl(initial?.image_url));
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
    if (!form.title.trim()) {
      setError('Service title is required.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const payload = {
        label: form.title.trim(),
        summary: form.summary.trim() || null,
        body: form.body.trim() || null,
        icon: form.icon || 'layers',
        is_active: form.is_active,
      };

      let id = initial?.id;
      const slotKey = initial?.slot_key || nextSlotKey;
      let imageUrl = initial?.image_url ?? null;

      if (initial) {
        const { error: err } = await supabase.from('services').update(payload).eq('id', id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from('services')
          .insert({ ...payload, slot_key: slotKey, sort_order: nextOrder })
          .select('id')
          .single();
        if (err) throw err;
        id = data.id;
      }

      if (file) {
        imageUrl = await uploadSlotImage(file, {
          prefix: 'services',
          slotKey,
          previous: initial?.image_url,
        });
      } else if (removeImage && initial?.image_url) {
        if (isStoragePath(initial.image_url)) {
          await supabase.storage.from(MEDIA_BUCKET).remove([initial.image_url]);
        }
        imageUrl = null;
      }

      if (imageUrl !== (initial?.image_url ?? null)) {
        const { error: err } = await supabase.from('services').update({ image_url: imageUrl }).eq('id', id);
        if (err) throw err;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save service.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="team-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="team-modal" onSubmit={submit}>
        <div className="team-modal-head">
          <h2>{initial ? 'Edit service' : 'Add service'}</h2>
          <button type="button" className="team-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="team-photo">
          {preview ? <img src={preview} alt="" /> : <span className="team-avatar team-avatar-empty">No image</span>}
          <div className="team-photo-actions">
            <button type="button" className="admin-btn small" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> {preview ? 'Change image' : 'Upload image'}
            </button>
            {preview && (
              <button type="button" className="admin-btn small danger" onClick={clearImage}>Remove image</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={pickFile} />
        </div>

        <label>Service title
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <label>Short summary
          <input type="text" value={form.summary} onChange={(e) => set('summary', e.target.value)}
            placeholder="One line shown on the home page" />
        </label>
        <label>Description
          <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={7}
            placeholder="Separate paragraphs with a blank line." />
        </label>
        <label>Icon
          <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
            {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="team-check">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Visible on website
        </label>

        <div className="team-modal-actions">
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null}
            {busy ? 'Saving…' : 'Save service'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminServices() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    else setError('');
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nextOrder = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0) + 1;
  const nums = rows
    .map((r) => parseInt((r.slot_key || '').replace('services.image.', ''), 10))
    .filter((n) => Number.isFinite(n));
  const nextSlotKey = `services.image.${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, '0')}`;

  const move = async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= rows.length) return;
    const reordered = [...rows];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setBusyId(row.id);
    try {
      const updates = reordered.map((r, i) =>
        supabase.from('services').update({ sort_order: i + 1 }).eq('id', r.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      await load();
    } catch (err) {
      setError(err.message || 'Could not reorder services.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.label || 'this service'}"? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      const { error: err } = await supabase.from('services').delete().eq('id', row.id);
      if (err) throw err;
      if (isStoragePath(row.image_url)) {
        await supabase.storage.from(MEDIA_BUCKET).remove([row.image_url]);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete service.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>Services</h1><p>Add, edit, reorder and publish service content.</p></div>
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add service
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-card admin-placeholder">Loading…</div>
      ) : (
        <div className="team-grid">
          {rows.map((row) => {
            const src = resolveImageUrl(row.image_url);
            const Icon = iconFor(row.icon);
            return (
              <article key={row.id} className={`team-card${row.is_active === false ? ' is-hidden' : ''}`}>
                <div className="team-card-head">
                  {src
                    ? <img className="service-thumb" src={src} alt={row.label || ''} loading="lazy" />
                    : <span className="service-thumb service-thumb-empty"><Icon size={22} /></span>}
                  <div className="team-card-id">
                    <h3>{row.label || 'Untitled service'}</h3>
                    <p>{row.summary || 'No summary'}</p>
                    <small>{iconLabel(row.icon)}</small>
                  </div>
                  {row.is_active === false && <span className="team-badge">Hidden</span>}
                </div>
                {row.body && <p className="team-bio">{row.body.replace(/\s+/g, ' ').slice(0, 160)}{row.body.length > 160 ? '…' : ''}</p>}
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
            <span>Add service</span>
          </button>
        </div>
      )}

      {editing && (
        <ServiceForm
          initial={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          nextSlotKey={nextSlotKey}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
