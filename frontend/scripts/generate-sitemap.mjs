import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const DEFAULT_SITE_URL = 'https://app.vvc.asia';
const DEFAULT_API_URL = 'https://vvc.asia/backend/public/index.php/api';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
const siteUrl = normalizeBaseUrl(process.env.VITE_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL);
const apiUrl = normalizeBaseUrl(process.env.VITE_API_URL || DEFAULT_API_URL);
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildUrl = (routePath) => {
  const suffix = routePath === '/' ? '' : routePath;
  return `${siteUrl}${suffix}`;
};

const toLastmod = (value) => {
  if (!value) return today;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return today;
  return date.toISOString().slice(0, 10);
};

const getProducts = async () => {
  try {
    const response = await fetch(`${apiUrl}/products`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const payload = await response.json();
    const data = payload?.data?.data || payload?.data || payload;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`[sitemap] Could not fetch products from API: ${error.message}`);
    return [];
  }
};

const toUrlEntry = ({ loc, lastmod = today, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;

const products = await getProducts();
const productRoutes = products
  .filter((product) => product?.id !== undefined && product?.id !== null)
  .map((product) => ({
    loc: buildUrl(`/products/${encodeURIComponent(String(product.id))}`),
    lastmod: toLastmod(product.updated_at || product.created_at),
    changefreq: 'weekly',
    priority: '0.8',
  }));

const urls = [
  ...staticRoutes.map((route) => ({
    loc: buildUrl(route.path),
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority,
  })),
  ...productRoutes,
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(toUrlEntry).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap.xml
`;

await fs.mkdir(publicDir, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8'),
  fs.writeFile(path.join(publicDir, 'robots.txt'), robots, 'utf8'),
]);

console.log(`[sitemap] Generated ${urls.length} URLs at ${siteUrl}/sitemap.xml`);
