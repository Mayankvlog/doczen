import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../index';

const BASE_URL = 'https://doczen.co.in';
const SITE_NAME = 'Doczen';
const SITE_TWITTER = '@doczen';
const DEFAULT_DESC = 'Doczen - Free Online PDF Editor. Merge, split, compress, convert and edit PDF files online for free. No installation required.';

const DEFAULT_KEYWORDS = 'free PDF editor, online PDF editor, edit PDF online, merge PDF files, split PDF, compress PDF, PDF converter, PDF to Word, Word to PDF, JPG to PDF, PDF to JPG, combine PDF, PDF merger, PDF splitter, PDF compressor, PDF creator, sign PDF online, protect PDF, unlock PDF, rotate PDF, delete PDF pages, add page numbers to PDF, PDF watermark, extract PDF text, PDF to Excel, Excel to PDF, PDF to PPT, PPT to PDF, PDF to TXT, HTML to PDF, PDF metadata editor, Doczen';

const LOCALE_MAP = {
  en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', it: 'it_IT',
  pt: 'pt_BR', nl: 'nl_NL', ru: 'ru_RU', ja: 'ja_JP', 'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW', ko: 'ko_KR', ar: 'ar_SA', hi: 'hi_IN', tr: 'tr_TR',
  pl: 'pl_PL', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  cs: 'cs_CZ', sk: 'sk_SK', hu: 'hu_HU', ro: 'ro_RO', bg: 'bg_BG',
  el: 'el_GR', th: 'th_TH', vi: 'vi_VN', id: 'id_ID', ms: 'ms_MY',
  uk: 'uk_UA', he: 'he_IL', ca: 'ca_ES', hr: 'hr_HR', sr: 'sr_RS',
  sl: 'sl_SI', lt: 'lt_LT', lv: 'lv_LV', et: 'et_EE',
};

const HREFLANG_MAP = {
  en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it',
  pt: 'pt', nl: 'nl', ru: 'ru', ja: 'ja', 'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant', ko: 'ko', ar: 'ar', hi: 'hi', tr: 'tr',
  pl: 'pl', sv: 'sv', da: 'da', no: 'no', fi: 'fi',
  cs: 'cs', sk: 'sk', hu: 'hu', ro: 'ro', bg: 'bg',
  el: 'el', th: 'th', vi: 'vi', id: 'id', ms: 'ms',
  uk: 'uk', he: 'he', ca: 'ca', hr: 'hr', sr: 'sr',
  sl: 'sl', lt: 'lt', lv: 'lv', et: 'et',
  bn: 'bn',
};

export default function SEO({
  title,
  description = DEFAULT_DESC,
  keywords = '',
  canonical = '',
  image = '/og-image.png',
  type = 'website',
  publishedTime,
  author = 'Doczen',
  noIndex = false
}) {
  const { lang } = useLanguage();
  const pageTitle = title ? `${title} | Doczen` : `${SITE_NAME} - Free Online PDF Editor`;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const pageKeywords = keywords
    ? `${keywords}, PDF editor, online PDF, free PDF tools, PDF converter, Doczen`
    : DEFAULT_KEYWORDS;
  const locale = LOCALE_MAP[lang] || 'en_US';
  const imgUrl = `${BASE_URL}${image}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#4F46E5" />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#4F46E5" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="referrer" content="origin-when-cross-origin" />

      <link rel="canonical" href={url} />

      {Object.entries(HREFLANG_MAP).map(([code, hreflang]) => (
        <link key={hreflang} rel="alternate" href={`${BASE_URL}${canonical || '/'}`} hrefLang={hreflang} />
      ))}
      <link rel="alternate" href={`${BASE_URL}${canonical || '/'}`} hrefLang="x-default" />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imgUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE_TWITTER} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imgUrl} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'Article' : 'WebApplication',
          name: pageTitle,
          url,
          description,
          image: imgUrl,
          author: { '@type': 'Organization', name: author, url: BASE_URL },
          applicationCategory: 'Multimedia',
          operatingSystem: 'All',
          browserRequirements: 'Requires JavaScript',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          ...(type !== 'article' && {
            featureList: [
              'Merge PDF files online',
              'Split PDF documents',
              'Compress PDF size',
              'Convert PDF to Word, Excel, PPT, JPG',
              'Convert Word, Excel, PPT, JPG to PDF',
              'Protect PDF with password',
              'Unlock protected PDF',
              'Rotate and reorder PDF pages',
              'Add page numbers and watermarks',
              'Sign PDF documents',
              'Edit PDF metadata',
            ],
            screenshot: imgUrl,
          }),
        })}
      </script>
    </Helmet>
  );
}
