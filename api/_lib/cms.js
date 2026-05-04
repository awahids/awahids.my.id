const CMS_CACHE_MS = 30_000;

const ensureNoTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

const getSupabaseRestConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: ensureNoTrailingSlash(url),
    anonKey,
  };
};

const cache = new Map();

export const readPublishedCmsItems = async (collection, { id = '', limit = 20 } = {}) => {
  const normalizedCollection = String(collection || '').trim();
  if (!normalizedCollection) return [];

  const now = Date.now();
  const cacheKey = `${normalizedCollection}:${id}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.rows;

  const { url, anonKey } = getSupabaseRestConfig();
  if (!url || !anonKey) return [];

  try {
    const query = new URLSearchParams({
      select: 'id,title,subtitle,summary,payload,sort_order,is_published',
      collection: `eq.${normalizedCollection}`,
      is_published: 'eq.true',
      order: 'sort_order.asc,created_at.asc',
      limit: String(limit),
    });

    if (id) {
      query.set('id', `eq.${id}`);
    }

    const response = await fetch(`${url}/rest/v1/cms_items?${query.toString()}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) return [];

    const rows = await response.json();
    const normalizedRows = Array.isArray(rows) ? rows : [];

    cache.set(cacheKey, {
      expiresAt: now + CMS_CACHE_MS,
      rows: normalizedRows,
    });

    return normalizedRows;
  } catch {
    return [];
  }
};
