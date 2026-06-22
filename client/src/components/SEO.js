import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../index';

const TOOL_PATHS = [
  'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'protect-pdf', 'unlock-pdf',
  'add-page-numbers', 'add-watermark', 'extract-text', 'reorder-pages', 'delete-pages',
  'pdf-to-jpg', 'jpg-to-pdf', 'pdf-to-txt', 'pdf-to-word', 'word-to-pdf',
  'pdf-to-ppt', 'ppt-to-pdf', 'pdf-to-excel', 'excel-to-pdf',
  'edit-pdf', 'sign-pdf', 'repair-pdf', 'pdf-to-pdfa', 'pdf-metadata',
  'flatten-pdf', 'html-to-pdf', 'redact-pdf', 'remove-annotations',
  'remove-watermark', 'compare-pdf',
];

function pathToToolName(path) {
  const name = path.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return name || null;
}

function isToolPage(canonical) {
  if (!canonical) return false;
  const path = canonical.replace(/^\//, '').replace(/\/$/, '');
  return TOOL_PATHS.includes(path);
}

const BASE_URL = 'https://www.doczen.co.in';
const SITE_NAME = 'Doczen';
const DEFAULT_DESC = 'Doczen - Free Online PDF Editor. Edit, convert, merge, split and compress PDF files in your browser. No registration required.';

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
  toolName = null,
  faqData = null,
  breadcrumbItems = null,
}) {
  const { lang } = useLanguage();
  const pageTitle = title ? `${title} | Doczen` : `${SITE_NAME} - Free Online PDF Editor`;
  const resolvedPath = canonical || (typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/');
  const url = `${BASE_URL}${resolvedPath}`;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;
  const locale = LOCALE_MAP[lang] || 'en_US';
  const imgUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const resolvedToolName = toolName || (isToolPage(canonical) ? pathToToolName(canonical) : null);

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [url]);

  const getSchemaMarkup = () => {
    const graph = [
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
          'https://www.facebook.com/profile.php?id=61590871045606&sk=directory_links',
          'https://www.instagram.com/doczen11/',
          'https://www.linkedin.com/company/doczen1/?viewAsMember=true',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          url: BASE_URL,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'Doczen - Free Online PDF Editor',
        description: DEFAULT_DESC,
        publisher: { '@id': `${BASE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/?s={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url: url,
        name: pageTitle,
        description: description,
        isPartOf: { '@id': `${BASE_URL}/#website` },
        inLanguage: locale,
        publisher: { '@id': `${BASE_URL}/#organization` },
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
    ];

    if (breadcrumbItems && breadcrumbItems.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.item.startsWith('http') ? item.item : `${BASE_URL}${item.item}`,
        })),
      });
    }

    if (resolvedToolName) {
      graph.push({
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
        author: { '@id': `${BASE_URL}/#organization` },
        screenshot: {
          '@type': 'ImageObject',
          url: imgUrl,
        },
      });
    }

    if (faqData && faqData.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqData.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      });
    }

    return { '@context': 'https://schema.org', '@graph': graph };
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
      
      {/* Open Graph Tags */}
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
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imgUrl} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* Article Meta */}
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

      {/* DNS prefetch for faster resource loading */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="dns-prefetch" href="https://www.facebook.com" />
      <link rel="dns-prefetch" href="https://www.linkedin.com" />
    </Helmet>
  );
};
