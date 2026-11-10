import { supabase, MEDIA_BUCKET, resolveImageUrl } from '../lib/supabase';

const PREFIXES = ['home/marquee', 'home/feature', 'about', 'team', 'services', 'projects', 'projects/gallery'];
const IMAGE_RE = /\.(png|jpe?g|webp|avif)$/i;

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function listMediaFiles() {
  const results = await Promise.all(
    PREFIXES.map(async (prefix) => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(prefix, { limit: 200, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      return (data || [])
        .filter((f) => f.name && IMAGE_RE.test(f.name))
        .map((f) => ({
          path: `${prefix}/${f.name}`,
          name: f.name,
          size: f.metadata?.size || 0,
          updatedAt: f.updated_at || f.created_at || null,
          url: resolveImageUrl(`${prefix}/${f.name}`),
        }));
    })
  );
  return results.flat().sort((a, b) => a.path.localeCompare(b.path));
}

export async function countReferences(path) {
  const [locations, team, home] = await Promise.all([
    supabase.from('v_image_locations').select('slot_key').eq('image_url', path),
    supabase.from('team_members').select('name').eq('image_path', path),
    supabase.from('home_images').select('slot_key').eq('image_url', path),
  ]);
  return (locations.data?.length || 0) + (team.data?.length || 0) + (home.data?.length || 0);
}
