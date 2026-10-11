// Shared by the card endpoints (colors) and the generator (swatches).
// `default` is the palette the cards always used, so existing READMEs don't change.
export const CARD_THEMES = {
  default: { label: 'Default', bg: '1f222e', border: '30354a', title: 'f85d7f', text: 'e4e6f1', icon: 'f8d866' },
  awahids: { label: 'Lime', bg: '0a0a0a', border: '262626', title: 'c8ff00', text: 'fafafa', icon: 'a3a3a3' },
  radical: { label: 'Radical', bg: '141321', border: '2c2a44', title: 'fe428e', text: 'a9fef7', icon: 'f8d847' },
  tokyonight: { label: 'Tokyo Night', bg: '1a1b27', border: '2c2f45', title: '70a5fd', text: '38bdae', icon: 'bf91f3' },
  dracula: { label: 'Dracula', bg: '282a36', border: '44475a', title: 'ff6e96', text: 'f8f8f2', icon: '79dafa' },
  onedark: { label: 'One Dark', bg: '282c34', border: '3b4048', title: 'e4bf7a', text: 'df6d74', icon: '8eb573' },
  nord: { label: 'Nord', bg: '2e3440', border: '434c5e', title: '81a1c1', text: 'd8dee9', icon: '88c0d0' },
  gruvbox: { label: 'Gruvbox', bg: '282828', border: '3c3836', title: 'fabd2f', text: '8ec07c', icon: 'fe8019' },
  monokai: { label: 'Monokai', bg: '272822', border: '3e3d32', title: 'eb1f6a', text: 'f1f1eb', icon: 'e28905' },
  synthwave: { label: 'Synthwave', bg: '2b213a', border: '443063', title: 'e2e9ec', text: 'e5289e', icon: 'ef8539' },
  github_dark: { label: 'GitHub Dark', bg: '0d1117', border: '30363d', title: '58a6ff', text: 'c3d1d9', icon: '79c0ff' },
  highcontrast: { label: 'High contrast', bg: '000000', border: 'e4e2e2', title: 'e7f216', text: 'ffffff', icon: '00ffff' },
  light: { label: 'Light', bg: 'fffefe', border: 'e4e2e2', title: '2f80ed', text: '434d58', icon: '4c71f2' },
};

export const DEFAULT_THEME = 'default';
export const isCardTheme = (name) => Object.hasOwn(CARD_THEMES, name);
export const cardThemeColors = (name) => CARD_THEMES[isCardTheme(name) ? name : DEFAULT_THEME];
