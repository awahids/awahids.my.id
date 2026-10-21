export const AI_LAB_PATH = '/ai-lab';
export const README_GENERATOR_PATH = '/readme-generator';
export const PRD_GENERATOR_PATH = '/prd-generator';
export const PRIVACY_PATH = '/privacy';

export const normalizePathname = (pathname = '') => {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
};

export const isHomeRoute = (pathname = '') => normalizePathname(pathname) === '/';
export const isAiLabRoute = (pathname = '') => normalizePathname(pathname) === AI_LAB_PATH;
export const isReadmeGeneratorRoute = (pathname = '') => normalizePathname(pathname) === README_GENERATOR_PATH;
export const isPrdGeneratorRoute = (pathname = '') => normalizePathname(pathname) === PRD_GENERATOR_PATH;
export const isPrivacyRoute = (pathname = '') => normalizePathname(pathname) === PRIVACY_PATH;

export const isNotFoundRoute = (pathname = '') =>
  !isHomeRoute(pathname) &&
  !isAiLabRoute(pathname) &&
  !isReadmeGeneratorRoute(pathname) &&
  !isPrdGeneratorRoute(pathname) &&
  !isPrivacyRoute(pathname);
