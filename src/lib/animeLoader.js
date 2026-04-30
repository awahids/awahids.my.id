const ANIMEJS_ESM_URL = 'https://cdn.jsdelivr.net/npm/animejs/+esm';

let animeModulePromise;

export const loadAnimeModule = () => {
  if (!animeModulePromise) {
    animeModulePromise = import(/* @vite-ignore */ ANIMEJS_ESM_URL);
  }

  return animeModulePromise;
};
