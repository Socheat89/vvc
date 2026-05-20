# Google Search Console Setup

## 1. Set The Public Website URL

Before production build, set the real public website URL:

```bash
VITE_SITE_URL=https://your-domain.com
```

If the API URL changes, set it too:

```bash
VITE_API_URL=https://your-domain.com/api
```

## 2. Generate Sitemap

The sitemap is generated automatically during build:

```bash
npm run build
```

You can also generate it manually:

```bash
npm run generate:sitemap
```

Generated files:

- `public/sitemap.xml`
- `public/robots.txt`

After build, Vite copies them into `dist/`.

## 3. Deploy

Deploy the `dist/` folder. Then check these URLs in the browser:

```text
https://your-domain.com/sitemap.xml
https://your-domain.com/robots.txt
```

## 4. Submit To Google Search Console

1. Open Google Search Console.
2. Add the website as a property.
3. Verify ownership with DNS, HTML file, or meta tag.
4. Go to Sitemaps.
5. Submit:

```text
sitemap.xml
```

The sitemap includes public catalog pages only. Admin pages are blocked in `robots.txt`.
