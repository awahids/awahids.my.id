// Default theme mirrors the "calm" palette used in the current README
// (bg_color=1F222E, title_color=F85D7F, icon_color=F8D866).
export const DEFAULT_THEME = {
  bg: "#1F222E",
  title: "#F85D7F",
  icon: "#F8D866",
  text: "#9F9FB8",
  border: "#1F222E",
  ring: "#F85D7F",
};

export function resolveTheme(query) {
  return {
    bg: query.bg_color ? `#${query.bg_color}` : DEFAULT_THEME.bg,
    title: query.title_color ? `#${query.title_color}` : DEFAULT_THEME.title,
    icon: query.icon_color ? `#${query.icon_color}` : DEFAULT_THEME.icon,
    text: query.text_color ? `#${query.text_color}` : DEFAULT_THEME.text,
    border: query.border_color ? `#${query.border_color}` : DEFAULT_THEME.border,
    ring: query.ring_color ? `#${query.ring_color}` : DEFAULT_THEME.ring,
    hideBorder: query.hide_border === "true",
  };
}
