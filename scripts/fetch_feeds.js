const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser({ timeout: 15000 });

const outPath = path.join(__dirname, '..', 'data', 'feeds.json');

const feeds = {
  spaceNews: [
    { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
    { name: 'SpaceNews', url: 'https://spacenews.com/feed/' },
    { name: 'New Scientist', url: 'https://www.newscientist.com/subject/space/feed/' },
    { name: 'Spaceflight Now', url: 'https://spaceflightnow.com/feed/' },
    { name: 'Payload', url: 'https://payloadspace.com/feed/' }
  ],
  nytNews: [
    { name: 'NYT', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' }
  ]
};

function extractImage(item) {
  if (!item) return null;
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  const content = item['content:encoded'] || item.content || item.summary || '';
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  if (item.image) return item.image;
  return null;
}

async function fetchOne(f) {
  try {
    const feed = await parser.parseURL(f.url);
    const items = (feed.items || []).map(i => {
      const pubDate = i.isoDate || i.pubDate || new Date().toISOString();
      return {
        title: i.title || '',
        link: i.link || '',
        pubDate,
        image: extractImage(i),
        source: f.name
      };
    });
    return { name: f.name, items };
  } catch (e) {
    console.error('Fetch error', f.url, e && e.message);
    return { name: f.name, items: [] };
  }
}

async function run() {
  const result = { spaceNews: [], nytNews: [] };

  for (const entry of feeds.spaceNews) {
    const r = await fetchOne(entry);
    result.spaceNews.push(...r.items);
  }

  for (const entry of feeds.nytNews) {
    const r = await fetchOne(entry);
    result.nytNews.push(...r.items);
  }

  const sortByDate = arr => arr.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  sortByDate(result.spaceNews);
  sortByDate(result.nytNews);

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

run().catch(e => { console.error(e); process.exit(1); });
