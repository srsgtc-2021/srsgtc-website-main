import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Globe2, Image as ImageIcon, Loader2, RotateCcw, Save,
  Search, Upload, XCircle,
} from 'lucide-react';
import { MEDIA_BUCKET, resolveImageUrl, supabase } from '../lib/supabase';
import { uploadSlotImage, isStoragePath } from './imageUtils';
import { countReferences, formatBytes } from './mediaUtils';
import { PUBLIC_PATHS, SITE_NAME, SITE_URL, getRouteMeta } from '../seo/seoConfig.js';
import './admin.css';

const PAGE_LABELS = {
  '/': 'Home',
  '/about': 'About',
  '/services': 'Services',
  '/projects': 'Projects',
  '/contact': 'Contact',
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const WARN_FILE_BYTES = 5 * 1024 * 1024;
const RECOMMENDED_IMAGE = { width: 1200, height: 630, ratio: 1.91 };
const OVERRIDE_KEYS = [
  'title', 'description', 'og_title', 'og_description', 'og_image_url',
  'og_image_width', 'og_image_height', 'og_image_type', 'og_image_alt',
];

function formForRow(row) {
  return {
    title: row?.title || '',
    description: row?.description || '',
    ogTitle: row?.og_title || '',
    ogDescription: row?.og_description || '',
    ogImageUrl: row?.og_image_url || '',
    ogImageWidth: row?.og_image_width != null ? String(row.og_image_width) : '',
    ogImageHeight: row?.og_image_height != null ? String(row.og_image_height) : '',
    ogImageType: row?.og_image_type || '',
    ogImageAlt: row?.og_image_alt || '',
    isIndexable: row?.is_indexable !== false,
  };
}

function hasOverrides(row) {
  if (!row) return false;
  if (row.is_indexable === false) return true;
  return OVERRIDE_KEYS.some((key) => row[key] !== null && row[key] !== undefined && row[key] !== '');
}

function overrideStatus(row) {
  if (!hasOverrides(row)) return 'Default';
  return row.is_indexable === false ? 'Noindex' : 'Custom';
}

function publicationStatus(row, path, buildMeta, buildState) {
  if (buildState === 'loading') return 'Checking publication…';
  if (buildState === 'unavailable') return 'Publication status unavailable';

  const publishedAt = buildMeta?.seo?.[path]?.updatedAt || null;
  const currentAt = row?.updated_at || null;
  if (!currentAt && !publishedAt) return 'Published';
  if (!currentAt && publishedAt) return 'Pending publication';
  if (currentAt && !publishedAt) return 'Pending publication';

  return new Date(currentAt).getTime() > new Date(publishedAt).getTime()
    ? 'Pending publication'
    : 'Published';
}

function statusTone(label) {
  return {
    Default: 'default',
    Custom: 'custom',
    Noindex: 'noindex',
    Published: 'published',
    'Pending publication': 'pending',
    'Publication status unavailable': 'unavailable',
    'Checking publication…': 'checking',
  }[label] || 'default';
}

function clampText(value, max) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function typeFromUrl(src) {
  const extension = String(src || '').split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  return {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
  }[extension] || null;
}

function getImageDimensions(src) {
  return new Promise((resolve) => {
    const image = new Image();
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 8000);
    image.onload = () => finish({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => finish(null);
    image.src = src;
  });
}

async function inspectRemoteImage(src) {
  const result = { type: typeFromUrl(src), size: null, width: null, height: null };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(src, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
      if (response.ok) {
        result.type = (response.headers.get('content-type') || '').split(';')[0].trim() || result.type;
        const length = Number(response.headers.get('content-length'));
        if (Number.isFinite(length) && length > 0) result.size = length;
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Dimensions can still load even when a HEAD request is blocked.
  }

  const dimensions = await getImageDimensions(src);
  if (dimensions) {
    result.width = dimensions.width;
    result.height = dimensions.height;
  }
  return result;
}

async function removeStorageIfUnreferenced(storagePath) {
  if (!isStoragePath(storagePath)) return false;
  try {
    const [seoRows, otherReferences] = await Promise.all([
      supabase.from('seo_pages').select('path').eq('og_image_url', storagePath),
      countReferences(storagePath),
    ]);
    if (seoRows.error) return false;
    if ((seoRows.data || []).length > 0 || otherReferences > 0) return false;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

export default function AdminSeo() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPath, setSelectedPath] = useState(PUBLIC_PATHS[0]);
  const [form, setForm] = useState(() => formForRow(null));
  const [selectedFile, setSelectedFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [imageInfo, setImageInfo] = useState(null);
  const [buildMeta, setBuildMeta] = useState(null);
  const [buildState, setBuildState] = useState('loading');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const objectUrlRef = useRef('');

  const defaults = useMemo(() => getRouteMeta(selectedPath), [selectedPath]);
  const row = useMemo(() => rows.find((item) => item.path === selectedPath) || null, [rows, selectedPath]);
  const overrideLabel = overrideStatus(row);
  const publicationLabel = publicationStatus(row, selectedPath, buildMeta, buildState);
  const imageValue = form.ogImageUrl.trim();
  const imageSrc = objectUrl || (imageValue ? (resolveImageUrl(imageValue) || imageValue) : defaults.ogImage);
  const effectiveTitle = form.title.trim() || defaults.title;
  const effectiveDescription = form.description.trim() || defaults.description;
  const effectiveOgTitle = form.ogTitle.trim() || effectiveTitle;
  const effectiveOgDescription = form.ogDescription.trim() || effectiveDescription;
  const canReset = Boolean(row && hasOverrides(row));

  const clearFile = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
    setObjectUrl('');
    setSelectedFile(null);
  }, []);

  const loadRows = useCallback(async () => {
    const { data, error: err } = await supabase.from('seo_pages').select('*');
    if (err) {
      setTableReady(false);
      setRows([]);
      setError(`SEO overrides are unavailable. Run supabase/seo-manager.sql in Supabase. (${err.message})`);
      return;
    }
    setTableReady(true);
    setRows(data || []);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadRows().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadRows]);

  useEffect(() => {
    let active = true;
    fetch('/build-meta.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Build metadata is unavailable.');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setBuildMeta(data);
        setBuildState('available');
      })
      .catch(() => {
        if (!active) return;
        setBuildMeta(null);
        setBuildState('unavailable');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setMessage('');
    clearFile();
  }, [selectedPath, clearFile]);

  useEffect(() => {
    setForm(formForRow(rows.find((item) => item.path === selectedPath) || null));
  }, [selectedPath, rows]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (selectedFile) return () => { cancelled = true; };

    const raw = form.ogImageUrl.trim();
    if (!raw) {
      setImageInfo({
        source: 'default',
        type: defaults.ogImageType,
        width: defaults.ogImageWidth,
        height: defaults.ogImageHeight,
        size: null,
      });
      return () => { cancelled = true; };
    }

    const src = resolveImageUrl(raw) || raw;
    setImageInfo({ source: 'url', checking: true, type: null, size: null, width: null, height: null });
    const timer = setTimeout(async () => {
      const info = await inspectRemoteImage(src);
      if (cancelled) return;
      setImageInfo({ source: 'url', ...info });
      setForm((current) => {
        if (current.ogImageUrl.trim() !== raw) return current;
        return {
          ...current,
          ogImageWidth: current.ogImageWidth || (info.width ? String(info.width) : ''),
          ogImageHeight: current.ogImageHeight || (info.height ? String(info.height) : ''),
          ogImageType: current.ogImageType || info.type || '',
        };
      });
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [
    form.ogImageUrl,
    selectedFile,
    selectedPath,
    defaults.ogImageType,
    defaults.ogImageWidth,
    defaults.ogImageHeight,
  ]);

  const warnings = useMemo(() => {
    if (!imageInfo || imageInfo.source === 'default' || imageInfo.checking) return [];
    const out = [];
    if (!imageInfo.type || !IMAGE_TYPES.includes(imageInfo.type)) {
      out.push('Unsupported or unknown image type. Use JPEG, PNG, WebP or AVIF.');
    }
    if (imageInfo.width && imageInfo.height) {
      const ratio = imageInfo.width / imageInfo.height;
      if (imageInfo.width < 600 || imageInfo.height < 315) {
        out.push('Image is smaller than the recommended minimum (600 × 315).');
      }
      if (Math.abs(ratio - RECOMMENDED_IMAGE.ratio) > 0.2) {
        out.push(`Aspect ratio is ${ratio.toFixed(2)}:1. Use 1.91:1 (1200 × 630) for reliable social cards.`);
      }
      if (imageInfo.width > 4096 || imageInfo.height > 4096) {
        out.push('Image dimensions are larger than needed. 1200 × 630 is recommended.');
      }
    } else {
      out.push('Could not verify image dimensions. Use 1200 × 630 for reliable social previews.');
    }
    if (imageInfo.size && imageInfo.size > WARN_FILE_BYTES) {
      out.push('Image is larger than 5 MB. Compress it for faster sharing.');
    }
    return out;
  }, [imageInfo]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Please use a PNG, JPEG, WebP or AVIF image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Maximum file size is 10 MB.');
      return;
    }

    clearFile();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setObjectUrl(url);
    setSelectedFile(file);
    setForm((current) => ({
      ...current,
      ogImageUrl: '',
      ogImageWidth: '',
      ogImageHeight: '',
      ogImageType: file.type,
    }));
    setImageInfo({ source: 'file', type: file.type, size: file.size, width: null, height: null, checking: true });

    const dimensions = await getImageDimensions(url);
    if (objectUrlRef.current !== url) return;
    setImageInfo({
      source: 'file',
      type: file.type,
      size: file.size,
      width: dimensions?.width || null,
      height: dimensions?.height || null,
    });
    if (dimensions) {
      setForm((current) => ({
        ...current,
        ogImageWidth: String(dimensions.width),
        ogImageHeight: String(dimensions.height),
      }));
    }
  };

  const changeImageUrl = (value) => {
    if (selectedFile) clearFile();
    setForm((current) => ({
      ...current,
      ogImageUrl: value,
      ogImageWidth: '',
      ogImageHeight: '',
      ogImageType: '',
    }));
    setMessage('');
  };

  const removeImage = () => {
    clearFile();
    setForm((current) => ({
      ...current,
      ogImageUrl: '',
      ogImageWidth: '',
      ogImageHeight: '',
      ogImageType: '',
      ogImageAlt: '',
    }));
    setImageInfo(null);
    setMessage('');
  };

  const save = async (event) => {
    event.preventDefault();
    if (tableReady === false) return;
    setBusy(true);
    setError('');
    setMessage('');

    const oldImage = row?.og_image_url || null;
    let uploadedPath = null;

    try {
      let imageUrl = form.ogImageUrl.trim() || null;
      if (selectedFile) {
        uploadedPath = await uploadSlotImage(selectedFile, {
          prefix: 'seo',
          slotKey: selectedPath === '/' ? 'home' : selectedPath.replace(/^\/+/, ''),
          previous: null,
        });
        imageUrl = uploadedPath;
      }

      const title = form.title.trim() || null;
      const description = form.description.trim() || null;
      const localTitle = title || defaults.title;
      const localDescription = description || defaults.description;

      let ogTitle = form.ogTitle.trim() || null;
      if (ogTitle === localTitle) ogTitle = null;
      let ogDescription = form.ogDescription.trim() || null;
      if (ogDescription === localDescription) ogDescription = null;

      let ogImageUrl = imageUrl === defaults.ogImage ? null : imageUrl;
      let ogImageWidth = null;
      let ogImageHeight = null;
      let ogImageType = null;
      if (ogImageUrl) {
        const width = Number(form.ogImageWidth);
        const height = Number(form.ogImageHeight);
        if (Number.isFinite(width) && width > 0) ogImageWidth = Math.round(width);
        if (Number.isFinite(height) && height > 0) ogImageHeight = Math.round(height);
        ogImageType = form.ogImageType.trim() || null;
      }

      let ogImageAlt = form.ogImageAlt.trim() || null;
      if (ogImageAlt === defaults.ogImageAlt) ogImageAlt = null;

      const isIndexable = Boolean(form.isIndexable);
      const payload = {
        path: selectedPath,
        title,
        description,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image_url: ogImageUrl,
        og_image_width: ogImageWidth,
        og_image_height: ogImageHeight,
        og_image_type: ogImageType,
        og_image_alt: ogImageAlt,
        is_indexable: isIndexable,
      };
      const hasAnyOverride = isIndexable === false || [
        title, description, ogTitle, ogDescription, ogImageUrl,
        ogImageWidth, ogImageHeight, ogImageType, ogImageAlt,
      ].some((value) => value !== null);

      if (hasAnyOverride) {
        const { error: upsertError } = await supabase
          .from('seo_pages')
          .upsert(payload, { onConflict: 'path' });
        if (upsertError) throw upsertError;
      } else {
        const { error: deleteError } = await supabase.from('seo_pages').delete().eq('path', selectedPath);
        if (deleteError) throw deleteError;
      }

      if (oldImage && oldImage !== ogImageUrl && isStoragePath(oldImage)) {
        await removeStorageIfUnreferenced(oldImage);
      }

      clearFile();
      await loadRows();
      setMessage('SEO settings saved. The public site updates after the next rebuild.');
    } catch (err) {
      if (uploadedPath) {
        try {
          await supabase.storage.from(MEDIA_BUCKET).remove([uploadedPath]);
        } catch {
        }
      }
      setError(err.message || 'Could not save SEO settings.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!row || !canReset) return;
    if (!window.confirm(`Reset ${PAGE_LABELS[selectedPath]} to the code-defined defaults? This deletes its SEO override row.`)) return;

    setBusy(true);
    setError('');
    setMessage('');
    const oldImage = row.og_image_url;

    try {
      const { error: deleteError } = await supabase.from('seo_pages').delete().eq('path', selectedPath);
      if (deleteError) throw deleteError;
      if (oldImage && isStoragePath(oldImage)) {
        await removeStorageIfUnreferenced(oldImage);
      }
      clearFile();
      await loadRows();
      setMessage('Page reset to defaults. The public site updates after the next rebuild.');
    } catch (err) {
      setError(err.message || 'Could not reset SEO settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page seo-manager">
      <div className="admin-page-head">
        <div>
          <h1>SEO Manager</h1>
          <p>Manage search and social metadata for the five public pages.</p>
        </div>
        <div className="seo-head-meta">
          <span><Globe2 size={14} /> {SITE_NAME}</span>
          <small>{SITE_URL}</small>
        </div>
      </div>

      {tableReady === false && (
        <div className="admin-error">
          SEO overrides are unavailable. Run <code>supabase/seo-manager.sql</code> in Supabase, then reload this page.
        </div>
      )}
      {error && tableReady !== false && <div className="admin-error">{error}</div>}
      {message && <div className="settings-ok">{message}</div>}

      <div className="seo-page-grid">
        {PUBLIC_PATHS.map((path) => {
          const pageRow = rows.find((item) => item.path === path) || null;
          const pageOverride = overrideStatus(pageRow);
          const pagePublication = publicationStatus(pageRow, path, buildMeta, buildState);
          return (
            <button
              type="button"
              key={path}
              className={`seo-page-card${selectedPath === path ? ' is-active' : ''}`}
              onClick={() => setSelectedPath(path)}
            >
              <span className="seo-page-card-top">
                <b>{PAGE_LABELS[path]}</b>
                <small>{path}</small>
              </span>
              <span className="seo-page-card-badges">
                <span className={`seo-badge seo-badge--${statusTone(pageOverride)}`}>{pageOverride}</span>
                <span className={`seo-badge seo-badge--${statusTone(pagePublication)}`}>{pagePublication}</span>
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="admin-card admin-placeholder">Loading SEO settings…</div>
      ) : (
        <form className="seo-editor" onSubmit={save}>
          <div className="seo-editor-main">
            <section className="admin-card seo-card">
              <div className="admin-card-head seo-card-head">
                <div>
                  <h2>{PAGE_LABELS[selectedPath]} <small>{selectedPath}</small></h2>
                  <span>Blank fields use the defaults in <code>src/seo/seoConfig.js</code>.</span>
                </div>
                <div className="seo-status-row">
                  <span className={`seo-badge seo-badge--${statusTone(overrideLabel)}`}>{overrideLabel}</span>
                  <span className={`seo-badge seo-badge--${statusTone(publicationLabel)}`}>{publicationLabel}</span>
                </div>
              </div>

              <label className="seo-field">
                Page title
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  placeholder={defaults.title}
                />
                <span className="seo-field-foot">
                  <span className={effectiveTitle.length > 60 ? 'is-warning' : ''}>{effectiveTitle.length} / 60 characters</span>
                  <span>{form.title.trim() ? 'Custom override' : 'Using default'}</span>
                </span>
              </label>

              <label className="seo-field">
                Meta description
                <textarea
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder={defaults.description}
                  rows={4}
                />
                <span className="seo-field-foot">
                  <span className={effectiveDescription.length > 160 ? 'is-warning' : ''}>{effectiveDescription.length} / 160 characters</span>
                  <span>{form.description.trim() ? 'Custom override' : 'Using default'}</span>
                </span>
              </label>

              <label className="seo-toggle">
                <input
                  type="checkbox"
                  checked={form.isIndexable}
                  onChange={(event) => setField('isIndexable', event.target.checked)}
                />
                <span>
                  <b>Allow search engines to index this page</b>
                  <small>Turning this off adds noindex,nofollow and removes the page from sitemap.xml.</small>
                </span>
              </label>
            </section>

            <section className="admin-card seo-card">
              <div className="admin-card-head">
                <h2>Social sharing</h2>
                <span>Open Graph and Twitter/X</span>
              </div>

              <label className="seo-field">
                Social title
                <input
                  type="text"
                  value={form.ogTitle}
                  onChange={(event) => setField('ogTitle', event.target.value)}
                  placeholder={effectiveTitle}
                />
                <span className="seo-field-foot">
                  <span>{form.ogTitle.trim() || 'Using the page title'}</span>
                  <span>Recommended under 70 characters</span>
                </span>
              </label>

              <label className="seo-field">
                Social description
                <textarea
                  value={form.ogDescription}
                  onChange={(event) => setField('ogDescription', event.target.value)}
                  placeholder={effectiveDescription}
                  rows={3}
                />
                <span className="seo-field-foot">
                  <span>{form.ogDescription.trim() || 'Using the meta description'}</span>
                  <span>Recommended under 200 characters</span>
                </span>
              </label>

              <div className="seo-image-block">
                <div className="seo-image-preview">
                  {imageSrc
                    ? <img src={imageSrc} alt={form.ogImageAlt || ''} />
                    : <span><ImageIcon size={20} /> No image</span>}
                </div>
                <div className="seo-image-fields">
                  <div className="seo-field">
                    <span className="seo-field-label">OG image URL or storage path</span>
                    <div className="seo-image-row">
                      <input
                        type="text"
                        value={form.ogImageUrl}
                        onChange={(event) => changeImageUrl(event.target.value)}
                        placeholder={defaults.ogImage}
                      />
                      <button type="button" className="admin-btn small ghost" onClick={() => fileRef.current?.click()}>
                        <Upload size={14} /> Upload
                      </button>
                      {(selectedFile || form.ogImageUrl) && (
                        <button type="button" className="admin-btn small danger" onClick={removeImage}>
                          <XCircle size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      hidden
                      onChange={pickFile}
                    />
                  </div>

                  <p className="settings-note">
                    {selectedFile
                      ? `Selected for upload: ${selectedFile.name}. The file uploads only when you save.`
                      : 'Leave blank to use the default image, paste an external URL, or upload a new image when you save.'}
                  </p>

                  {imageInfo && (
                    <div className="seo-image-meta">
                      <span>{imageInfo.type || 'Unknown type'}</span>
                      <span>{imageInfo.width && imageInfo.height ? `${imageInfo.width} × ${imageInfo.height}` : 'Dimensions unknown'}</span>
                      <span>{imageInfo.size ? formatBytes(imageInfo.size) : imageInfo.source === 'default' ? 'Default site image' : 'Size unknown'}</span>
                    </div>
                  )}
                  {imageInfo?.checking && (
                    <p className="settings-note"><Loader2 size={13} className="spin" /> Checking image…</p>
                  )}
                  {warnings.map((warning) => (
                    <p className="seo-warning" key={warning}><AlertTriangle size={13} /> {warning}</p>
                  ))}
                </div>
              </div>

              <label className="seo-field">
                Image alt text
                <input
                  type="text"
                  value={form.ogImageAlt}
                  onChange={(event) => setField('ogImageAlt', event.target.value)}
                  placeholder={defaults.ogImageAlt}
                />
                <span className="seo-field-foot">
                  <span>{form.ogImageAlt.trim() ? 'Custom override' : 'Using default'}</span>
                  <span>Describe the image for screen readers and social cards.</span>
                </span>
              </label>

              <div className="admin-form-row seo-advanced">
                <label className="seo-field">
                  Image width
                  <input
                    type="number"
                    min="1"
                    value={form.ogImageWidth}
                    onChange={(event) => setField('ogImageWidth', event.target.value)}
                    placeholder="1200"
                  />
                </label>
                <label className="seo-field">
                  Image height
                  <input
                    type="number"
                    min="1"
                    value={form.ogImageHeight}
                    onChange={(event) => setField('ogImageHeight', event.target.value)}
                    placeholder="630"
                  />
                </label>
              </div>

              <label className="seo-field">
                Image MIME type
                <input
                  type="text"
                  value={form.ogImageType}
                  onChange={(event) => setField('ogImageType', event.target.value)}
                  placeholder="image/jpeg"
                />
                <span className="seo-field-foot">
                  <span>Detected automatically where possible.</span>
                  <span>Leave blank to omit dimension and type tags for a custom image.</span>
                </span>
              </label>
            </section>

            <div className="seo-actions">
              <button type="submit" className="admin-btn" disabled={busy || tableReady === false}>
                {busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="admin-btn ghost" onClick={reset} disabled={busy || !canReset}>
                <RotateCcw size={15} /> Reset to defaults
              </button>
            </div>
          </div>

          <aside className="seo-editor-side">
            <section className="admin-card seo-preview-card">
              <div className="settings-card-head"><Search size={18} /><h2>Search preview</h2></div>
              <div className="seo-google">
                <div className="seo-google-url">
                  <span className="seo-google-favicon">S</span>
                  <div>
                    <b>{SITE_NAME}</b>
                    <span>{defaults.canonical.replace(/^https?:\/\//, '')}</span>
                  </div>
                </div>
                <div className="seo-google-title">{clampText(effectiveTitle, 60)}</div>
                <div className="seo-google-description">{clampText(effectiveDescription, 160)}</div>
              </div>
              <p className="settings-note">Search engines may rewrite snippets. Keep the title near 60 characters and the description near 160.</p>
            </section>

            <section className="admin-card seo-preview-card">
              <div className="settings-card-head"><ImageIcon size={18} /><h2>Social preview</h2></div>
              <div className="seo-social">
                <div className="seo-social-image">
                  {imageSrc ? <img src={imageSrc} alt="" /> : <span>No image</span>}
                </div>
                <div className="seo-social-body">
                  <small>{SITE_URL.replace(/^https?:\/\//, '')}</small>
                  <b>{clampText(effectiveOgTitle, 70)}</b>
                  <p>{clampText(effectiveOgDescription, 200)}</p>
                </div>
              </div>
              <p className="settings-note">Recommended: 1200 × 630 (1.91:1), under 5 MB.</p>
            </section>

            <section className="admin-card seo-preview-card">
              <div className="settings-card-head"><Globe2 size={18} /><h2>Automatic settings</h2></div>
              <p className="settings-line"><span>Canonical</span><b title={defaults.canonical}>{defaults.canonical}</b></p>
              <p className="settings-line"><span>Structured data</span><b>{defaults.schemaType}</b></p>
              <p className="settings-line"><span>Site identity</span><b>{SITE_NAME}</b></p>
              <p className="settings-line">
                <span>Published snapshot</span>
                <b>{buildMeta?.builtAt ? new Date(buildMeta.builtAt).toLocaleString() : 'Unavailable'}</b>
              </p>
              <p className="settings-note">Canonical URLs and structured data are generated from the route and global site settings.</p>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
}
