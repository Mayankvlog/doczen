/* Submit all URLs from the site sitemap to IndexNow search engines.
 *
 * Usage:
 *   node indexnow_submit.js            # submit all URLs in client/public/sitemap.xml
 *   node indexnow_submit.js /path/to/sitemap.xml
 *   node indexnow_submit.js --url https://www.doczen.co.in/merge-pdf
 *
 * The key file must be live at: https://www.doczen.co.in/<KEY>.txt
 */
const fs = require('fs');
const path = require('path');

const HOST = 'www.doczen.co.in';
const KEY = '62a160845e3d4716b463e384aa11382b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];
const DEFAULT_SITEMAP = path.join(__dirname, 'client', 'public', 'sitemap.xml');

function extractUrls(sitemapPath) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

async function submit(urls) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  });

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body,
      });
      const text = await res.text();
      console.log(`[${res.status}] ${endpoint} -> ${urls.length} URLs submitted${text ? `\n${text}` : ''}`);
    } catch (err) {
      console.error(`[ERR] ${endpoint}:`, err.message);
      process.exit(1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const urlFlag = args.findIndex((a) => a === '--url');
  let urls;

  if (urlFlag !== -1 && args[urlFlag + 1]) {
    urls = [args[urlFlag + 1]];
  } else {
    const sitemap = args.find((a) => !a.startsWith('--')) || DEFAULT_SITEMAP;
    urls = extractUrls(sitemap);
  }

  if (!urls.length) {
    console.error('No URLs found to submit.');
    process.exit(1);
  }

  console.log(`Submitting ${urls.length} URLs for host ${HOST}...`);
  // IndexNow allows up to 10,000 URLs per request.
  for (let i = 0; i < urls.length; i += 10000) {
    await submit(urls.slice(i, i + 10000));
  }
}

main();