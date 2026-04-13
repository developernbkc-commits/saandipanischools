# Saandipani International Schools website package

## What this package is

A Netlify-ready static website package for Saandipani International Schools, redesigned into a premium white theme with force-directed exploration, command-style search, and a higher-end visual system.

## Deploy on Netlify

1. Upload the contents of this folder to a Git repository, or drag-and-drop the folder into Netlify.
2. Keep the published directory as the site root.
3. Netlify form handling is already set up on `/admissions/enquiry/`.
4. Confirm the production domain and update any domain-level redirects if needed.

## Core files

- `index.html` — home page
- `assets/css/styles.css` — premium white-theme styling
- `assets/js/main.js` — navigation, search, force graph, FAQ, motion
- `assets/data/search-index.json` — client-side page search data
- `sitemap.xml` and `/sitemap/` — machine and human sitemaps
- `netlify.toml` — Netlify hints

## Notes

- The site uses a premium serif/sans pairing from Google Fonts. It will fall back gracefully if the fonts fail to load.
- Replace placeholder imagery or abstract panels with real campus photography when available.
