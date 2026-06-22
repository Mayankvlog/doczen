import { Link } from 'react-router-dom';
import { useLanguage } from '../index';

export default function Footer() {
  const { t } = useLanguage();
  const toolCategories = [
    {
      name: t('footer.category.pageMgmt', 'Page Management'),
      tools: [
        { label: t('nav.tools.merge', 'Merge PDF'), path: '/merge-pdf' },
        { label: t('nav.tools.split', 'Split PDF'), path: '/split-pdf' },
        { label: t('nav.tools.compress', 'Compress PDF'), path: '/compress-pdf' },
        { label: t('nav.tools.rotate', 'Rotate PDF'), path: '/rotate-pdf' },
        { label: t('nav.tools.reorder', 'Reorder Pages'), path: '/reorder-pages' },
        { label: t('nav.tools.delete', 'Delete Pages'), path: '/delete-pages' },
      ],
    },
    {
      name: t('footer.category.convert', 'Convert'),
      tools: [
        { label: t('nav.tools.pdfToWord', 'PDF to Word'), path: '/pdf-to-word' },
        { label: t('nav.tools.wordToPdf', 'Word to PDF'), path: '/word-to-pdf' },
        { label: t('nav.tools.pdfToJpg', 'PDF to JPG'), path: '/pdf-to-jpg' },
        { label: t('nav.tools.jpgToPdf', 'JPG to PDF'), path: '/jpg-to-pdf' },
        { label: t('nav.tools.pdfToPpt', 'PDF to PPT'), path: '/pdf-to-ppt' },
        { label: t('nav.tools.pptToPdf', 'PPT to PDF'), path: '/ppt-to-pdf' },
        { label: t('nav.tools.pdfToExcel', 'PDF to Excel'), path: '/pdf-to-excel' },
        { label: t('nav.tools.excelToPdf', 'Excel to PDF'), path: '/excel-to-pdf' },
        { label: t('nav.tools.htmlToPdf', 'HTML to PDF'), path: '/html-to-pdf' },
        { label: t('nav.tools.pdfToTxt', 'PDF to TXT'), path: '/pdf-to-txt' },
        { label: t('nav.tools.pdfToPdfa', 'PDF to PDF/A'), path: '/pdf-to-pdfa' },
      ],
    },
    {
      name: t('footer.category.edit', 'Edit & Secure'),
      tools: [
        { label: t('nav.tools.edit', 'Edit PDF'), path: '/edit-pdf' },
        { label: t('nav.tools.protect', 'Protect PDF'), path: '/protect-pdf' },
        { label: t('nav.tools.unlock', 'Unlock PDF'), path: '/unlock-pdf' },
        { label: t('nav.tools.sign', 'Sign PDF'), path: '/sign-pdf' },
        { label: t('nav.tools.redact', 'Redact PDF'), path: '/redact-pdf' },
        { label: t('nav.tools.addPageNumbers', 'Add Page Numbers'), path: '/add-page-numbers' },
        { label: t('nav.tools.addWatermark', 'Add Watermark'), path: '/add-watermark' },
        { label: t('nav.tools.extractText', 'Extract Text'), path: '/extract-text' },
        { label: t('nav.tools.removeAnnotations', 'Remove Annotations'), path: '/remove-annotations' },
        { label: t('nav.tools.removeWatermark', 'Remove Watermark'), path: '/remove-watermark' },
        { label: t('nav.tools.flatten', 'Flatten PDF'), path: '/flatten-pdf' },
        { label: t('nav.tools.repair', 'Repair PDF'), path: '/repair-pdf' },
      ],
    },
    {
      name: t('footer.category.other', 'More'),
      tools: [
        { label: t('nav.tools.metadata', 'PDF Metadata'), path: '/pdf-metadata' },
        { label: t('nav.tools.compare', 'Compare PDF'), path: '/compare-pdf' },
        { label: t('footer.about', 'About'), path: '/about' },
        { label: t('footer.privacy', 'Privacy Policy'), path: '/privacy-policy' },
        { label: t('footer.terms', 'Terms of Service'), path: '/terms-of-service' },
      ],
    },
  ];
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">

          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-white">Doczen</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {t('footer.tagline', 'The simplest way to edit, convert, and manage your PDF documents online. Fast, secure, and free.')}
            </p>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {t('footer.followUs', 'Follow Us')}
              </h3>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/profile.php?id=61590871045606&sk=directory_links" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/doczen11/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/doczen1/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {toolCategories.map((category) => (
            <div key={category.name}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {category.name}
              </h3>
              <ul className="space-y-2.5">
                {category.tools.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Doczen. {t('footer.copyright', 'All rights reserved.')}
          </p>
          <p className="text-xs text-gray-600">
            {t('footer.builtWith', 'Built with ❤️ for PDFs')}
          </p>
        </div>

      </div>
    </footer>
  );
}
