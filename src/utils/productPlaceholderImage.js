const PLACEHOLDER_PALETTES = [
  { from: '#e8f5f1', to: '#d8ecf8', accent: '#1f8a70' },
  { from: '#fff3e6', to: '#fde6dd', accent: '#f05d3b' },
  { from: '#f3f4ff', to: '#dfe8ff', accent: '#4f46e5' },
  { from: '#eefcf3', to: '#dff7e8', accent: '#15803d' },
  { from: '#fff7d9', to: '#ffe8c7', accent: '#c2410c' },
];

function hashText(input = '') {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeSvgText(input = '') {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pickPalette(seedText) {
  const hash = hashText(seedText);
  return PLACEHOLDER_PALETTES[hash % PLACEHOLDER_PALETTES.length];
}

function shortName(name = '') {
  const compact = String(name).trim().replace(/\s+/g, ' ');
  if (!compact) return 'Product';
  if (compact.length <= 22) return compact;
  return `${compact.slice(0, 22)}...`;
}

export function createProductPlaceholder({ name, category } = {}) {
  const title = shortName(name);
  const categoryText = category ? String(category).trim() : 'Demo Image';
  const seed = `${title}-${categoryText}`;
  const palette = pickPalette(seed);
  const titleText = escapeSvgText(title);
  const categoryLabel = escapeSvgText(categoryText);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}" />
      <stop offset="100%" stop-color="${palette.to}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)" />
  <circle cx="980" cy="140" r="180" fill="${palette.accent}" opacity="0.15" />
  <circle cx="170" cy="760" r="230" fill="${palette.accent}" opacity="0.14" />
  <rect x="120" y="130" width="960" height="640" rx="40" fill="#ffffff" fill-opacity="0.72" />
  <text x="600" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#0f172a">
    ${titleText}
  </text>
  <text x="600" y="486" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="${palette.accent}">
    ${categoryLabel}
  </text>
  <text x="600" y="548" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#334155">
    Van Van Cambodia
  </text>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

