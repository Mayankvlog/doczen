const GEO_TOPICS = [
  'free online PDF editor',
  'merge PDF files online',
  'split PDF files online',
  'compress PDF files online',
  'convert PDF to Word online',
  'convert Word to PDF online',
  'convert PDF to JPG online',
  'convert JPG to PDF online',
  'protect a PDF online',
  'sign a PDF online',
  'add page numbers to PDF online',
  'edit PDF online',
];

const GEO_LOCATIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Malaysia',
  'Philippines',
  'South Africa',
  'New Zealand',
];

export const GEO_KEYWORD_COUNT = GEO_TOPICS.length * GEO_LOCATIONS.length;
export const MIN_GEO_KEYWORDS = GEO_KEYWORD_COUNT;

export function* iterateGeoKeywords(limit = GEO_KEYWORD_COUNT) {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new TypeError('The GEO keyword limit must be a non-negative safe integer.');
  }

  if (limit === 0) return;

  let generated = 0;
  for (const topic of GEO_TOPICS) {
    for (const location of GEO_LOCATIONS) {
      yield `${topic} in ${location}`;
      generated += 1;
      if (generated >= limit) return;
    }
  }
}

export function generateGeoKeywords(limit = 120) {
  return Array.from(iterateGeoKeywords(Math.min(limit, GEO_KEYWORD_COUNT)));
}

export function getGeoKeywordSample(limit = 30) {
  return generateGeoKeywords(Math.min(limit, GEO_KEYWORD_COUNT));
}
