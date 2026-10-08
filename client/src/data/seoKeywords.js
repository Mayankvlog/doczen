const PDF_SEARCH_INTENTS = [
  'merge PDF files',
  'split PDF pages',
  'compress PDF files',
  'convert PDF to Word',
  'convert Word to PDF',
  'convert PDF to JPG',
  'convert JPG to PDF',
  'protect a PDF with a password',
  'sign a PDF online',
  'add a watermark to PDF',
  'extract text from PDF',
  'edit a PDF online',
];

const LONG_TAIL_QUALIFIERS = [
  'online free',
  'without registration',
  'without installing software',
  'for Windows',
  'for Mac',
  'for mobile',
  'for students',
  'for business',
  'securely',
  'with no watermark',
];

export const LONG_TAIL_KEYWORD_COUNT =
  PDF_SEARCH_INTENTS.length * LONG_TAIL_QUALIFIERS.length;
export const MIN_LONG_TAIL_KEYWORDS = LONG_TAIL_KEYWORD_COUNT;

export function* iterateLongTailKeywords(limit = LONG_TAIL_KEYWORD_COUNT) {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new TypeError('The long-tail keyword limit must be a non-negative safe integer.');
  }

  if (limit === 0) return;

  let generated = 0;
  for (const intent of PDF_SEARCH_INTENTS) {
    for (const qualifier of LONG_TAIL_QUALIFIERS) {
      yield `${intent} ${qualifier}`;
      generated += 1;
      if (generated >= limit) return;
    }
  }
}

export function generateLongTailKeywords(limit = 120) {
  return Array.from(iterateLongTailKeywords(limit));
}

export function getLongTailKeywordSample(limit = 120) {
  return generateLongTailKeywords(Math.min(limit, LONG_TAIL_KEYWORD_COUNT));
}
