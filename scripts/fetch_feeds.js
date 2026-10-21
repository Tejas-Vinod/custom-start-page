const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser({ timeout: 15000 });

const outPath = path.join(__dirname, '..', 'data', 'feeds.json');

const feeds = {
  spaceNews: [
    { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
    { name: 'Space Force', url: 'https://www.spaceforce.mil/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=1060&isdashboardselected=0&max=20&Category=23812' },
    { name: 'SpaceNews', url: 'https://spacenews.com/feed/' },
    { name: 'New Scientist', url: 'https://www.newscientist.com/subject/space/feed/' },
    { name: 'Spaceflight Now', url: 'https://spaceflightnow.com/feed/' },
    { name: 'Payload', url: 'https://payloadspace.com/feed/' },
    { name: 'Astronomy Magazine', url: 'https://www.astronomy.com/tags/news/feed' }
  ],
  industryNews: [
    { name: 'Boeing', url: 'https://boeing.mediaroom.com/news-releases-statements?pagetemplate=rss' },
    { name: 'Lockheed Martin', url: 'https://news.lockheedmartin.com/news-releases?pagetemplate=rss' },
    { name: 'NASA JPL', url: 'https://www.jpl.nasa.gov/feeds/news/' },
    { name: 'Northrop Grumman', url: 'https://rss.app/feeds/1PCAw96E5vECjO3S.xml' },
    { name: 'Blue Origin', url: 'https://rss.app/feeds/IBN2TaUZfUlhfvBK.xml' }
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
        excerpt: String(i.contentSnippet || i.summary || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320),
        source: f.name
      };
    });
    return { name: f.name, items };
  } catch (e) {
    console.error('Fetch error', f.url, e && e.message);
    return null;
  }
}

async function fetchCategory(entries, previousItems) {
  const results = await Promise.all(entries.map(fetchOne));
  return results.flatMap((result, index) => {
    if (result) return result.items;
    const source = entries[index].name;
    const cached = previousItems.filter(item => item.source === source);
    if (cached.length) {
      console.warn(`Keeping ${cached.length} cached items for ${source}`);
    }
    return cached;
  });
}

async function run() {
  let previous = {};
  try {
    previous = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }

  const result = {};
  for (const [category, entries] of Object.entries(feeds)) {
    const previousItems = Array.isArray(previous[category]) ? previous[category] : [];
    result[category] = await fetchCategory(entries, previousItems);
  }

  const sortByDate = arr => arr.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  for (const items of Object.values(result)) sortByDate(items);

  if (!Object.values(result).some(items => items.length > 0)) {
    throw new Error('No feed items were fetched and no cached items are available; leaving feeds.json unchanged');
  }

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

run().catch(e => { console.error(e); process.exit(1); });
