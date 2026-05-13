const ANIMEJS_ESM_URL = 'https://cdn.jsdelivr.net/npm/animejs/+esm';

let animeModulePromise;

export const loadAnimeModule = () => {
  if (!animeModulePromise) {
    animeModulePromise = import(/* @vite-ignore */ ANIMEJS_ESM_URL).then((mod) => {
      const fn = mod?.default ?? mod;
      if (fn && !fn.stagger && mod.stagger) fn.stagger = mod.stagger;
      return fn;
    });
  }

  return animeModulePromise;
};
