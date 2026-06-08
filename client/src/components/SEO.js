import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../index';

const BASE_URL = 'https://doczen.co.in';
const SITE_NAME = 'Doczen';
const SITE_TWITTER = '@doczen';
const DEFAULT_DESC = 'Doczen - Free Online PDF Editor. Merge, split, compress, convert and edit PDF files online for free. No installation required.';

const DEFAULT_KEYWORDS = 'free online PDF editor, merge PDF, split PDF, compress PDF, convert PDF, PDF tools, Doczen';

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
  noIndex = false,
  toolName = null  // For tool-specific schema markup
}) {
  const { lang } = useLanguage();
  const pageTitle = title ? `${title} | Doczen` : `${SITE_NAME} - Free Online PDF Editor`;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;
  const locale = LOCALE_MAP[lang] || 'en_US';
  const imgUrl = `${BASE_URL}${image}`;

  // Generate comprehensive Schema markup
  const getSchemaMarkup = () => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        // Organization schema
        {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'Doczen',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            '@id': `${BASE_URL}/#logo`,
            url: `${BASE_URL}/logo.png`,
            width: 250,
            height: 250,
          },
          description: 'Free Online PDF Editor - Convert, merge, split, compress and edit PDFs online',
          sameAs: [
            'https://www.facebook.com/doczen',
            'https://twitter.com/doczen',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            url: BASE_URL,
          },
        },
        // Website schema
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          url: BASE_URL,
          name: 'Doczen - Free Online PDF Editor',
          description: DEFAULT_DESC,
          publisher: {
            '@id': `${BASE_URL}/#organization`,
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${BASE_URL}/?s={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
        // Webpage schema
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url: url,
          name: pageTitle,
          description: description,
          isPartOf: {
            '@id': `${BASE_URL}/#website`,
          },
          inLanguage: locale,
          publisher: {
            '@id': `${BASE_URL}/#organization`,
          },
          image: {
            '@type': 'ImageObject',
            url: imgUrl,
            width: 1200,
            height: 630,
          },
          ...(publishedTime && {
            datePublished: publishedTime,
            dateModified: publishedTime,
          }),
        },
      ],
    };

    // Add tool-specific schema if it's a tool page
    if (toolName) {
      const toolSchema = {
        '@type': 'SoftwareApplication',
        '@id': `${url}#tool`,
        name: pageTitle,
        url: url,
        description: description,
        applicationCategory: 'Multimedia',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@id': `${BASE_URL}/#organization`,
        },
        screenshot: {
          '@type': 'ImageObject',
          url: imgUrl,
        },
      };
      baseSchema['@graph'].push(toolSchema);
    }

    return baseSchema;
  };

  return (
    <Helmet>
      <html lang={lang} />
      <title>{pageTitle}</title>
      
      {/* Primary Meta Tags */}
      <meta name="description" content={description} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex' : 'index, follow'} />
      <meta name="bingbot" content={noIndex ? 'noindex' : 'index, follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Theme and App Meta */}
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
      
      {/* Performance & Security */}
      <meta httpEquiv="x-ua-compatible" content="IE=edge" />
      <meta name="x-ua-compatible" content="IE=edge" />
      <meta name="preload-resources" content="high" />
      
      {/* Canonical and Language Alternatives */}
      <link rel="canonical" href={url} />
      {Object.entries(HREFLANG_MAP).map(([code, hreflang]) => (
        <link key={hreflang} rel="alternate" href={`${BASE_URL}${canonical || '/'}`} hrefLang={hreflang} />
      ))}
      <link rel="alternate" href={`${BASE_URL}${canonical || '/'}`} hrefLang="x-default" />
      
      {/* Open Graph Tags for Social Sharing */}
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

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE_TWITTER} />
      <meta name="twitter:creator" content={SITE_TWITTER} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imgUrl} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* Article Meta (if applicable) */}
      {publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:modified_time" content={publishedTime} />
          <meta property="article:author" content={author} />
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(getSchemaMarkup())}
      </script>

      {/* Prefetch DNS for external resources */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </Helmet>
  );
};
