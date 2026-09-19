export const AI_LAB_PATH = '/ai-lab';
export const README_GENERATOR_PATH = '/readme-generator';
export const PRD_GENERATOR_PATH = '/prd-generator';
export const PRD_PERMALINK_PREFIX = '/prd/';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizePathname = (pathname = '') => {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
};

export const isHomeRoute = (pathname = '') => normalizePathname(pathname) === '/';
export const isAiLabRoute = (pathname = '') => normalizePathname(pathname) === AI_LAB_PATH;
export const isReadmeGeneratorRoute = (pathname = '') => normalizePathname(pathname) === README_GENERATOR_PATH;
export const isPrdGeneratorRoute = (pathname = '') => normalizePathname(pathname) === PRD_GENERATOR_PATH;

// Unlike every other route here this one is a prefix match, so it validates the
// slug itself — an unrecognized shape must fall through to the 404 page rather
// than reaching the API.
export const prdSlugFromPath = (pathname = '') => {
  const normalized = normalizePathname(pathname);
  if (!normalized.startsWith(PRD_PERMALINK_PREFIX)) return '';
  const slug = normalized.slice(PRD_PERMALINK_PREFIX.length);
  return SLUG.test(slug) ? slug : '';
};

export const isPrdPermalinkRoute = (pathname = '') => prdSlugFromPath(pathname) !== '';

export const isNotFoundRoute = (pathname = '') =>
  !isHomeRoute(pathname) &&
  !isAiLabRoute(pathname) &&
  !isReadmeGeneratorRoute(pathname) &&
  !isPrdGeneratorRoute(pathname) &&
  !isPrdPermalinkRoute(pathname);
