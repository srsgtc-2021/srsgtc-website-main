import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Loader2, Upload } from 'lucide-react';
import { supabase, MEDIA_BUCKET } from '../lib/supabase';
import { uploadSlotImage, isStoragePath } from './imageUtils';
import ImageSlotCard from './ImageSlotCard';
import './admin.css';

function nextKey(rows, prefix) {
  const nums = rows
    .map((r) => r.slot_key || '')
    .filter((k) => k.startsWith(`${prefix}.`))
    .map((k) => parseInt(k.slice(prefix.length + 1), 10))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}.${String(next).padStart(2, '0')}`;
}

function AddForm({ defaultLabel, onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [alt, setAlt] = useState('');
  const [active, setActive] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const objectUrl = useRef(null);

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(f);
    setFile(f);
    setPreview(objectUrl.current);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({
        label: label.trim() || defaultLabel,
        alt: alt.trim(),
        active,
        file,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not add item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="team-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="team-modal" onSubmit={submit}>
        <div className="team-modal-head">
          <h2>Add image slot</h2>
          <button type="button" className="team-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {error && <div className="admin-error">{error}</div>}

        <div className="team-photo">
          {preview ? <img src={preview} alt="" /> : <span className="team-avatar team-avatar-empty">No image</span>}
          <div className="team-photo-actions">
            <button type="button" className="admin-btn small" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> {preview ? 'Change image' : 'Choose image'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={pick} />
        </div>

        <label>Label
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={defaultLabel} />
        </label>
        <label>Alt text
          <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for accessibility" />
        </label>
        <label className="team-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Visible on website
        </label>

        <div className="team-modal-actions">
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null}
            {busy ? 'Adding…' : 'Add slot'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditForm({ row, onClose, onSave }) {
  const [label, setLabel] = useState(row.label || '');
  const [alt, setAlt] = useState(row.alt_text || '');
  const [active, setActive] = useState(row.is_active !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ label: label.trim(), alt: alt.trim(), active });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="team-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="team-modal" onSubmit={submit}>
        <div className="team-modal-head">
          <h2>Edit image slot</h2>
          <button type="button" className="team-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {error && <div className="admin-error">{error}</div>}

        <label>Label
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label>Alt text
          <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </label>
        <label className="team-check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Visible on website
        </label>

        <div className="team-modal-actions">
          <button type="button" className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn" disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null}
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminImageGrid({
  table,
  prefix,
  addSlotKeyPrefix,
  addLabel = 'Add item',
  title,
  single = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (err) setError(err.message);
    else setError('');
    setRows(data || []);
    setLoading(false);
  }, [table]);

  useEffect(() => { load(); }, [load]);

  const filled = rows.filter((r) => r.image_url).length;

  const addRow = async ({ label, alt, active, file }) => {
    if (!addSlotKeyPrefix) throw new Error('Add prefix is not configured for this section.');
    const slotKey = nextKey(rows, addSlotKeyPrefix);
    const order = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0) + 1;
    const { data, error: err } = await supabase
      .from(table)
      .insert({
        slot_key: slotKey,
        label: label || 'New image',
        alt_text: alt || label || null,
        sort_order: order,
        is_active: active,
      })
      .select('id')
      .single();
    if (err) throw err;
    if (file) {
      try {
        const path = await uploadSlotImage(file, { prefix, slotKey, previous: null });
        const { error: updateError } = await supabase
          .from(table)
          .update({ image_url: path })
          .eq('id', data.id);
        if (updateError) throw updateError;
      } catch (uploadError) {
        await supabase.from(table).delete().eq('id', data.id);
        throw uploadError;
      }
    }
    await load();
  };

  const saveRow = async (row, { label, alt, active }) => {
    const { error: err } = await supabase
      .from(table)
      .update({ label: label || row.label, alt_text: alt || null, is_active: active })
      .eq('id', row.id);
    if (err) throw err;
    await load();
  };

  const removeRow = async (row) => {
    if (!window.confirm(`Delete "${row.label || row.slot_key}"? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      if (isStoragePath(row.image_url)) {
        await supabase.storage.from(MEDIA_BUCKET).remove([row.image_url]);
      }
      const { error: err } = await supabase.from(table).delete().eq('id', row.id);
      if (err) throw err;
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete slot.');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= rows.length) return;
    const reordered = [...rows];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setBusyId(row.id);
    try {
      const updates = reordered.map((r, i) =>
        supabase.from(table).update({ sort_order: i + 1 }).eq('id', r.id)
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

  const body = loading ? (
    <div className="admin-placeholder">Loading…</div>
  ) : rows.length === 0 && single ? (
    <div className="admin-placeholder">No image slot found. Run <code>supabase/content-seed.sql</code> first.</div>
  ) : (
    <div className="slot-grid">
      {rows.map((row, i) => (
        <ImageSlotCard
          key={row.id}
          table={table}
          row={row}
          prefix={prefix}
          onChanged={load}
          onEdit={() => setEditing(row)}
          onDelete={() => removeRow(row)}
          onMoveUp={() => move(row, -1)}
          onMoveDown={() => move(row, 1)}
          isFirst={i === 0}
          isLast={i === rows.length - 1}
          allowDelete={!single}
          allowMove={!single}
          busy={busyId === row.id}
        />
      ))}
      {!single && (
        <button type="button" className="slot-add-card" onClick={() => setAdding(true)}>
          <Plus size={24} />
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  );

  return (
    <section className={title ? 'admin-card' : ''}>
      {title && (
        <div className="admin-card-head">
          <h2>{title}</h2>
          <span>{loading ? 'Loading…' : `${filled} / ${rows.length} set`}</span>
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}
      {body}
      {adding && (
        <AddForm
          defaultLabel="New image"
          onClose={() => setAdding(false)}
          onSave={addRow}
        />
      )}
      {editing && (
        <EditForm
          row={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => saveRow(editing, values)}
        />
      )}
    </section>
  );
}
