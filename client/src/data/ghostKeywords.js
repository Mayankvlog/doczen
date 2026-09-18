const GHOST_INTENTS = [
  'how to merge PDF files',
  'how to compress a PDF file',
  'how to convert a PDF to Word',
  'how to split a PDF into pages',
];

const GHOST_QUALIFIERS = [
  'for free online',
  'without signing up',
  'without installing software',
  'no credit card',
  'fast and easy',
];

const GHOST_VARIANTS = [
  'on my laptop',
  'on my phone',
  'in my browser',
];

const GHOST_CONTEXTS = [
  'at home',
  'at the office',
  'while traveling',
  'on a low bandwidth connection',
  'during a busy workday',
];

const GHOST_USE_CASES = [
  'to shrink email attachments',
  'to prepare a final document',
  'to send files to clients',
  'to archive important records',
  'to submit paperwork online',
];

const GHOST_AUDIENCES = [
  'for students',
  'for teachers',
  'for freelancers',
  'for remote workers',
  'for small business owners',
  'for legal professionals',
  'for HR teams',
  'for content creators',
];

export const GHOST_KEYWORD_COUNT =
  GHOST_INTENTS.length *
  GHOST_QUALIFIERS.length *
  (GHOST_VARIANTS.length + 1) *
  GHOST_CONTEXTS.length *
  GHOST_USE_CASES.length *
  GHOST_AUDIENCES.length;

export const MIN_GHOST_KEYWORDS = 16000;

if (GHOST_KEYWORD_COUNT < MIN_GHOST_KEYWORDS) {
  throw new Error(`The ghost-impression keyword catalog must contain at least ${MIN_GHOST_KEYWORDS} keywords.`);
}

export function* iterateGhostKeywords(limit = GHOST_KEYWORD_COUNT) {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new TypeError('The ghost keyword limit must be a non-negative safe integer.');
  }

  if (limit === 0) return;

  let generated = 0;

  for (const intent of GHOST_INTENTS) {
    for (const qualifier of GHOST_QUALIFIERS) {
      const phrases = [intent, ...GHOST_VARIANTS.map((variant) => `${intent} ${variant}`)];

      for (const phrase of phrases) {
        for (const context of GHOST_CONTEXTS) {
          for (const useCase of GHOST_USE_CASES) {
            for (const audience of GHOST_AUDIENCES) {
              yield `${phrase} ${qualifier} ${context} ${useCase} ${audience}`;
              generated += 1;
              if (generated >= limit) return;
            }
          }
        }
      }
    }
  }
}

export function generateGhostKeywords(limit = 120) {
  return Array.from(iterateGhostKeywords(Math.min(limit, GHOST_KEYWORD_COUNT)));
}

export function getGhostKeywordSample(limit = 15) {
  return generateGhostKeywords(Math.min(limit, GHOST_KEYWORD_COUNT));
}