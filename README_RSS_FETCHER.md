# RSS fetcher for GitHub Pages

This repo contains a small GitHub Actions workflow and Node script that fetches RSS feeds on a schedule and writes `data/feeds.json` so your static site can read prebuilt feed data without CORS issues.

How it works:
- Action runs hourly (or manually) and executes `node scripts/fetch_feeds.js`.
- The script collects items from the space, industry, and NYT feeds and writes `data/feeds.json`.
- Your static page fetches `data/feeds.json` relative to the site URL, which works both on a custom domain and under a GitHub Pages project path.
- If an individual feed is temporarily unavailable, the script keeps that feed's previously generated items instead of replacing them with an empty list.

To run locally:

```bash
npm install
node scripts/fetch_feeds.js
```
