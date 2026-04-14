# RSS fetcher for GitHub Pages

This repo contains a small GitHub Actions workflow and Node script that fetches RSS feeds on a schedule and writes `data/feeds.json` so your static site can read prebuilt feed data without CORS issues.

How it works:
- Action runs hourly (or manually) and executes `node scripts/fetch_feeds.js`.
- The script collects items and writes `data/feeds.json`.
- Your static page fetches `/data/feeds.json` at runtime and renders articles.

To run locally:

```bash
npm install
node scripts/fetch_feeds.js
```
