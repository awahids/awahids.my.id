export const ICONS = {
  star: 'M12 .3a1 1 0 0 1 .9.56l2.7 5.48 6.04.88a1 1 0 0 1 .55 1.7l-4.37 4.26 1.03 6.02a1 1 0 0 1-1.45 1.05L12 17.27l-5.4 2.98a1 1 0 0 1-1.45-1.05l1.03-6.02L1.8 8.92a1 1 0 0 1 .55-1.7l6.04-.88L11.1.86A1 1 0 0 1 12 .3z',
  commits: 'M8 9a4 4 0 1 1 0-2h3.06a5 5 0 1 1 0 2H8zm4-1a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM5 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  prs: 'M6 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM18 12a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM4.5 5v6M18 6v4.5M14 6l4-3-4-3',
  issues: 'M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 5a1.25 1.25 0 0 1 1.25 1.25v5.5a1.25 1.25 0 0 1-2.5 0v-5.5A1.25 1.25 0 0 1 12 6zm0 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  contribs: 'M2 12h4v9H2v-9zm7-6h4v15H9V6zm7-4h4v19h-4V2z',
};

export function icon(name, x, y, color, size = 16) {
  const path = ICONS[name];
  const scale = size / 24;
  return `<g transform="translate(${x}, ${y}) scale(${scale})"><path fill="${color}" d="${path}"/></g>`;
}
