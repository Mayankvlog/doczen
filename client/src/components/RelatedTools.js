import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../index';

const toolCategories = [
  {
    name: 'tool.category.pageMgmt',
    defaultName: 'Page Management',
    tools: [
      { path: '/merge-pdf', labelKey: 'tool.mergePdf', defaultLabel: 'Merge PDF' },
      { path: '/split-pdf', labelKey: 'tool.splitPdf', defaultLabel: 'Split PDF' },
      { path: '/compress-pdf', labelKey: 'tool.compressPdf', defaultLabel: 'Compress PDF' },
      { path: '/rotate-pdf', labelKey: 'tool.rotatePdf', defaultLabel: 'Rotate PDF' },
      { path: '/reorder-pages', labelKey: 'tool.reorderPages', defaultLabel: 'Reorder Pages' },
      { path: '/delete-pages', labelKey: 'tool.deletePages', defaultLabel: 'Delete Pages' },
    ],
  },
  {
    name: 'tool.category.security',
    defaultName: 'Security',
    tools: [
      { path: '/protect-pdf', labelKey: 'tool.protectPdf', defaultLabel: 'Protect PDF' },
      { path: '/unlock-pdf', labelKey: 'tool.unlockPdf', defaultLabel: 'Unlock PDF' },
      { path: '/redact-pdf', labelKey: 'tool.redactPdf', defaultLabel: 'Redact PDF' },
    ],
  },
  {
    name: 'tool.category.convertFromPdf',
    defaultName: 'Convert From PDF',
    tools: [
      { path: '/pdf-to-word', labelKey: 'tool.pdfToWord', defaultLabel: 'PDF to Word' },
      { path: '/pdf-to-ppt', labelKey: 'tool.pdfToPpt', defaultLabel: 'PDF to PPT' },
      { path: '/pdf-to-excel', labelKey: 'tool.pdfToExcel', defaultLabel: 'PDF to Excel' },
      { path: '/pdf-to-jpg', labelKey: 'tool.pdfToJpg', defaultLabel: 'PDF to JPG' },
      { path: '/pdf-to-txt', labelKey: 'tool.pdfToTxt', defaultLabel: 'PDF to TXT' },
      { path: '/pdf-to-pdfa', labelKey: 'tool.pdfToPdfa', defaultLabel: 'PDF to PDF/A' },
    ],
  },
  {
    name: 'tool.category.convertToPdf',
    defaultName: 'Convert To PDF',
    tools: [
      { path: '/word-to-pdf', labelKey: 'tool.wordToPdf', defaultLabel: 'Word to PDF' },
      { path: '/ppt-to-pdf', labelKey: 'tool.pptToPdf', defaultLabel: 'PPT to PDF' },
      { path: '/excel-to-pdf', labelKey: 'tool.excelToPdf', defaultLabel: 'Excel to PDF' },
      { path: '/jpg-to-pdf', labelKey: 'tool.jpgToPdf', defaultLabel: 'JPG to PDF' },
      { path: '/html-to-pdf', labelKey: 'tool.htmlToPdf', defaultLabel: 'HTML to PDF' },
    ],
  },
  {
    name: 'tool.category.editAnnotate',
    defaultName: 'Edit & Annotate',
    tools: [
      { path: '/edit-pdf', labelKey: 'tool.editPdf', defaultLabel: 'Edit PDF' },
      { path: '/add-page-numbers', labelKey: 'tool.addPageNumbers', defaultLabel: 'Add Page Numbers' },
      { path: '/add-watermark', labelKey: 'tool.addWatermark', defaultLabel: 'Add Watermark' },
      { path: '/extract-text', labelKey: 'tool.extractText', defaultLabel: 'Extract Text' },
      { path: '/remove-annotations', labelKey: 'tool.removeAnnotations', defaultLabel: 'Remove Annotations' },
      { path: '/remove-watermark', labelKey: 'tool.removeWatermark', defaultLabel: 'Remove Watermark' },
      { path: '/flatten-pdf', labelKey: 'tool.flattenPdf', defaultLabel: 'Flatten PDF' },
    ],
  },
  {
    name: 'tool.category.specialty',
    defaultName: 'More Tools',
    tools: [
      { path: '/sign-pdf', labelKey: 'tool.signPdf', defaultLabel: 'Sign PDF' },
      { path: '/repair-pdf', labelKey: 'tool.repairPdf', defaultLabel: 'Repair PDF' },
      { path: '/pdf-metadata', labelKey: 'tool.pdfMetadata', defaultLabel: 'PDF Metadata' },
      { path: '/compare-pdf', labelKey: 'tool.comparePdf', defaultLabel: 'Compare PDF' },
    ],
  },
];

function getRelatedTools(currentPath, maxTools = 6) {
  const allRelations = {
    '/merge-pdf': ['/split-pdf', '/compress-pdf', '/reorder-pages', '/delete-pages', '/edit-pdf', '/rotate-pdf'],
    '/split-pdf': ['/merge-pdf', '/delete-pages', '/reorder-pages', '/compress-pdf', '/extract-text', '/rotate-pdf'],
    '/compress-pdf': ['/merge-pdf', '/split-pdf', '/rotate-pdf', '/pdf-to-jpg', '/pdf-to-pdfa', '/flatten-pdf'],
    '/rotate-pdf': ['/merge-pdf', '/split-pdf', '/reorder-pages', '/delete-pages', '/compress-pdf', '/edit-pdf'],
    '/protect-pdf': ['/unlock-pdf', '/redact-pdf', '/sign-pdf', '/edit-pdf', '/flatten-pdf', '/pdf-metadata'],
    '/unlock-pdf': ['/protect-pdf', '/redact-pdf', '/edit-pdf', '/sign-pdf', '/remove-annotations', '/flatten-pdf'],
    '/add-page-numbers': ['/add-watermark', '/edit-pdf', '/extract-text', '/flatten-pdf', '/pdf-metadata', '/delete-pages'],
    '/add-watermark': ['/add-page-numbers', '/remove-watermark', '/edit-pdf', '/flatten-pdf', '/extract-text', '/redact-pdf'],
    '/extract-text': ['/pdf-to-txt', '/pdf-to-word', '/edit-pdf', '/pdf-to-excel', '/pdf-metadata', '/pdf-to-ppt'],
    '/reorder-pages': ['/merge-pdf', '/split-pdf', '/delete-pages', '/rotate-pdf', '/compress-pdf', '/edit-pdf'],
    '/delete-pages': ['/split-pdf', '/reorder-pages', '/merge-pdf', '/compress-pdf', '/rotate-pdf', '/edit-pdf'],
    '/pdf-to-jpg': ['/jpg-to-pdf', '/pdf-to-word', '/pdf-to-ppt', '/extract-text', '/compress-pdf', '/edit-pdf'],
    '/jpg-to-pdf': ['/pdf-to-jpg', '/word-to-pdf', '/excel-to-pdf', '/ppt-to-pdf', '/html-to-pdf', '/merge-pdf'],
    '/pdf-to-txt': ['/extract-text', '/pdf-to-word', '/pdf-to-excel', '/pdf-to-jpg', '/pdf-to-ppt', '/edit-pdf'],
    '/pdf-to-word': ['/word-to-pdf', '/pdf-to-ppt', '/pdf-to-excel', '/pdf-to-jpg', '/edit-pdf', '/extract-text'],
    '/word-to-pdf': ['/pdf-to-word', '/ppt-to-pdf', '/excel-to-pdf', '/jpg-to-pdf', '/html-to-pdf', '/merge-pdf'],
    '/pdf-to-ppt': ['/ppt-to-pdf', '/pdf-to-word', '/pdf-to-excel', '/pdf-to-jpg', '/extract-text', '/edit-pdf'],
    '/ppt-to-pdf': ['/pdf-to-ppt', '/word-to-pdf', '/excel-to-pdf', '/jpg-to-pdf', '/html-to-pdf', '/merge-pdf'],
    '/pdf-to-excel': ['/excel-to-pdf', '/pdf-to-word', '/pdf-to-ppt', '/extract-text', '/pdf-to-jpg', '/edit-pdf'],
    '/excel-to-pdf': ['/pdf-to-excel', '/word-to-pdf', '/ppt-to-pdf', '/jpg-to-pdf', '/html-to-pdf', '/merge-pdf'],
    '/edit-pdf': ['/merge-pdf', '/split-pdf', '/compress-pdf', '/sign-pdf', '/add-page-numbers', '/add-watermark'],
    '/sign-pdf': ['/edit-pdf', '/protect-pdf', '/flatten-pdf', '/compress-pdf', '/add-watermark', '/pdf-metadata'],
    '/repair-pdf': ['/compress-pdf', '/pdf-to-pdfa', '/merge-pdf', '/flatten-pdf', '/edit-pdf', '/pdf-metadata'],
    '/pdf-to-pdfa': ['/compress-pdf', '/flatten-pdf', '/repair-pdf', '/pdf-metadata', '/pdf-to-jpg', '/merge-pdf'],
    '/pdf-metadata': ['/edit-pdf', '/flatten-pdf', '/protect-pdf', '/add-page-numbers', '/compare-pdf', '/extract-text'],
    '/flatten-pdf': ['/edit-pdf', '/compress-pdf', '/protect-pdf', '/remove-annotations', '/sign-pdf', '/add-watermark'],
    '/html-to-pdf': ['/word-to-pdf', '/jpg-to-pdf', '/excel-to-pdf', '/ppt-to-pdf', '/merge-pdf', '/compress-pdf'],
    '/redact-pdf': ['/protect-pdf', '/unlock-pdf', '/edit-pdf', '/remove-annotations', '/flatten-pdf', '/remove-watermark'],
    '/remove-annotations': ['/flatten-pdf', '/redact-pdf', '/edit-pdf', '/add-watermark', '/extract-text', '/unlock-pdf'],
    '/remove-watermark': ['/add-watermark', '/redact-pdf', '/edit-pdf', '/flatten-pdf', '/remove-annotations', '/compress-pdf'],
    '/compare-pdf': ['/merge-pdf', '/split-pdf', '/pdf-metadata', '/extract-text', '/reorder-pages', '/edit-pdf'],
  };

  const related = allRelations[currentPath] || [];
  const flatTools = toolCategories.flatMap(c => c.tools);
  return related.slice(0, maxTools).map(path => flatTools.find(t => t.path === path)).filter(Boolean);
}

export default function RelatedTools() {
  const { t } = useLanguage();
  const location = useLocation();
  const related = getRelatedTools(location.pathname);

  if (related.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 border-t border-gray-200 mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('tool.relatedTools', 'Related Tools')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {related.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
              {t(tool.labelKey, tool.defaultLabel)}
            </span>
            <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

export { toolCategories };
