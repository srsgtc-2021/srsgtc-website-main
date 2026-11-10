import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Trash2, ExternalLink, Copy, Search, Loader2 } from 'lucide-react';
import { supabase, MEDIA_BUCKET } from '../lib/supabase';
import { listMediaFiles, formatBytes, countReferences } from './mediaUtils';
import './admin.css';

export default function AdminMedia() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyPath, setBusyPath] = useState(null);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setFiles(await listMediaFiles());
    } catch (err) {
      setError(err.message || 'Could not load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.path.toLowerCase().includes(q)) : files;
  }, [files, query]);

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const copy = async (file) => {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopied(file.path);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copy this URL:', file.url);
    }
  };

  const remove = async (file) => {
    let refs = 0;
    try { refs = await countReferences(file.path); } catch { refs = 0; }
    const message = refs
      ? `This image is used in ${refs} place(s). Deleting it will leave those slots empty. Continue?`
      : `Delete ${file.path}? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setBusyPath(file.path);
    setError('');
    try {
      const { error: err } = await supabase.storage.from(MEDIA_BUCKET).remove([file.path]);
      if (err) throw err;
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete file.');
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>Media Library</h1><p>Browse, copy and remove images stored in the media bucket.</p></div>
        <button type="button" className="admin-btn ghost" onClick={() => { setLoading(true); load(); }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="media-toolbar">
        <label className="media-search">
          <Search size={15} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file path…" />
        </label>
        <span className="media-count">{files.length} files · {formatBytes(totalSize)}</span>
      </div>

      {loading ? (
        <div className="admin-card admin-placeholder"><Loader2 size={16} className="spin" /> Loading media…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card admin-placeholder">
          {files.length === 0 ? 'No images uploaded yet.' : 'No files match your search.'}
        </div>
      ) : (
        <div className="media-grid">
          {filtered.map((file) => (
            <article key={file.path} className="media-card">
              <a className="media-thumb" href={file.url} target="_blank" rel="noreferrer">
                <img src={file.url} alt="" loading="lazy" />
              </a>
              <div className="media-meta">
                <b title={file.path}>{file.name}</b>
                <small>{formatBytes(file.size)}</small>
              </div>
              <div className="media-actions">
                <button type="button" onClick={() => copy(file)} title="Copy public URL">
                  <Copy size={14} /> {copied === file.path ? 'Copied' : 'Copy'}
                </button>
                <a href={file.url} target="_blank" rel="noreferrer" title="Open in new tab"><ExternalLink size={14} /></a>
                <button type="button" className="danger" onClick={() => remove(file)} disabled={busyPath === file.path} title="Delete">
                  {busyPath === file.path ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
