import { supabase, MEDIA_BUCKET } from '../lib/supabase';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadSlotImage(file, { prefix, slotKey, previous }) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please use a PNG, JPEG, WebP or AVIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Maximum file size is 10 MB.');
  }

  const rawExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const safeExt = ['png', 'jpg', 'webp', 'avif'].includes(ext) ? ext : 'png';
  const path = `${prefix}/${slotKey}-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;

  if (previous && !previous.startsWith('/') && !/^https?:/i.test(previous)) {
    await supabase.storage.from(MEDIA_BUCKET).remove([previous]);
  }

  return path;
}

export function isStoragePath(value) {
  return Boolean(value) && !value.startsWith('/') && !/^https?:/i.test(value);
}
