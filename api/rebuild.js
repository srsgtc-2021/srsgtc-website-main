const FALLBACK_SITE_URL = 'https://srsgeotech-zeta.vercel.app';
const REQUEST_TIMEOUT_MS = 8000;
const TABLES = [
  'marquee_images',
  'about_images',
  'services',
  'projects',
  'project_gallery',
  'team_members',
  'home_images',
  'seo_pages',
  'seo_state',
];
const OPTIONAL_TABLES = new Set(['seo_pages', 'seo_state']);

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, '')}`;
  }
  return FALLBACK_SITE_URL;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function latestTimestamp(values) {
  const times = (values || [])
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

export function shouldRebuild(latestContentUpdatedAt, contentSnapshotAt) {
  if (!latestContentUpdatedAt || !contentSnapshotAt) return null;
  const latest = new Date(latestContentUpdatedAt).getTime();
  const snapshot = new Date(contentSnapshotAt).getTime();
  if (!Number.isFinite(latest) || !Number.isFinite(snapshot)) return null;
  return latest > snapshot;
}

async function readBuildMeta() {
  const url = `${siteUrl()}/build-meta.json?ts=${Date.now()}`;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.contentSnapshotAt || data?.builtAt) return data;
      }
    } catch {
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}

async function readLatestContentUpdate() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured.');
  }

  const base = supabaseUrl.replace(/\/+$/, '');
  const results = await Promise.all(TABLES.map(async (table) => {
    const url = `${base}/rest/v1/${encodeURIComponent(table)}?select=updated_at&order=updated_at.desc&limit=1`;
    const response = await fetchWithTimeout(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!response.ok) {
      if (OPTIONAL_TABLES.has(table) && response.status === 404) return [];
      throw new Error(`Supabase table ${table} returned ${response.status}.`);
    }
    return response.json();
  }));

  return latestTimestamp(results.flatMap((rows) => (
    Array.isArray(rows) ? rows.map((row) => row?.updated_at) : []
  )));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return sendJson(res, 500, { error: 'CRON_SECRET is not configured.' });
  }

  const authorization = req.headers.authorization || '';
  if (authorization !== `Bearer ${cronSecret}`) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!deployHook) {
    return sendJson(res, 500, { error: 'VERCEL_DEPLOY_HOOK_URL is not configured.' });
  }

  try {
    const buildMeta = await readBuildMeta();
    if (!buildMeta) {
      return sendJson(res, 502, {
        error: 'Could not read build-meta.json from the production site.',
        deployed: false,
      });
    }

    const contentSnapshotAt = buildMeta.contentSnapshotAt || buildMeta.builtAt;
    const latestContentUpdatedAt = await readLatestContentUpdate();
    const contentIsNewer = shouldRebuild(latestContentUpdatedAt, contentSnapshotAt);

    if (contentIsNewer === null) {
      return sendJson(res, 502, {
        error: 'Could not compare the latest CMS timestamp with the deployed content snapshot.',
        latestContentUpdatedAt,
        contentSnapshotAt,
        deployed: false,
      });
    }

    if (!contentIsNewer) {
      return sendJson(res, 200, {
        deployed: false,
        reason: 'Content is not newer than the deployed snapshot.',
        latestContentUpdatedAt,
        contentSnapshotAt,
        builtAt: buildMeta.builtAt,
      });
    }

    const deployment = await fetchWithTimeout(deployHook, { method: 'POST' });
    if (!deployment.ok) {
      return sendJson(res, 502, {
        error: 'The Vercel Deploy Hook rejected the request.',
        status: deployment.status,
        deployed: false,
      });
    }

    return sendJson(res, 200, {
      deployed: true,
      latestContentUpdatedAt,
      contentSnapshotAt,
      builtAt: buildMeta.builtAt,
    });
  } catch (error) {
    return sendJson(res, 502, {
      error: error?.message || 'Rebuild check failed.',
      deployed: false,
    });
  }
}

export const config = {
  maxDuration: 30,
};
