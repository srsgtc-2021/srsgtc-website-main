import React, { useRef, useState } from 'react';
import { Upload, Trash2, Pencil, ArrowUp, ArrowDown, Loader2, X } from 'lucide-react';
import { supabase, resolveImageUrl } from '../lib/supabase';
import { uploadSlotImage } from './imageUtils';
import './admin.css';

export default function ImageSlotCard({
  table,
  row,
  prefix,
  onChanged,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  allowDelete = true,
  allowMove = true,
  busy = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const src = resolveImageUrl(row.image_url);
  const isBusy = busy || uploading;

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const path = await uploadSlotImage(file, {
        prefix,
        slotKey: row.slot_key,
        previous: row.image_url,
      });
      const { error: updateError } = await supabase
        .from(table)
        .update({ image_url: path })
        .eq('id', row.id);
      if (updateError) throw updateError;
      onChanged();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!row.image_url) return;
    if (!window.confirm(`Remove the image for "${row.label || row.slot_key}"?`)) return;
    setError('');
    setUploading(true);
    try {
      const { error: updateError } = await supabase
        .from(table)
        .update({ image_url: null })
        .eq('id', row.id);
      if (updateError) throw updateError;
      onChanged();
    } catch (err) {
      setError(err.message || 'Could not remove image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <figure className={`slot-card${src ? ' has-image' : ''}${row.is_active === false ? ' is-hidden' : ''}`}>
      <div className="slot-media">
        {src
          ? <img src={src} alt={row.alt_text || row.label || ''} loading="lazy" />
          : <span className="slot-empty">No image</span>}
        {row.is_active === false && <span className="slot-badge">Hidden</span>}
      </div>
      <figcaption>
        <div className="slot-meta">
          <b>{row.label || row.slot_key}</b>
          <small>{row.slot_key}</small>
        </div>
        {error && <div className="slot-error">{error}</div>}
        <div className="slot-actions">
          <button type="button" onClick={onEdit} disabled={isBusy}>
            <Pencil size={15} /> Edit
          </button>
          <button type="button" onClick={pick} disabled={isBusy}>
            {isBusy ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
            {src ? 'Replace' : 'Upload'}
          </button>
          <button type="button" className="danger" onClick={remove} disabled={isBusy || !row.image_url}>
            <X size={15} /> Image
          </button>
        </div>
        <div className="slot-actions">
          {allowMove && (
            <>
              <button type="button" onClick={onMoveUp} disabled={isBusy || isFirst} aria-label="Move up">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={onMoveDown} disabled={isBusy || isLast} aria-label="Move down">
                <ArrowDown size={15} />
              </button>
            </>
          )}
          {allowDelete && (
            <button type="button" className="danger" onClick={onDelete} disabled={isBusy}>
              <Trash2 size={15} /> Delete slot
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          hidden
          onChange={onFile}
        />
      </figcaption>
    </figure>
  );
}
