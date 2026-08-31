import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import api, { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import { getLongTailKeywordSample } from '../../data/seoKeywords';
import { getGeoKeywordSample } from '../../data/geoKeywords';
import AdsterraNative from '../../components/AdsterraNative';
import RelatedTools from '../../components/RelatedTools';

export default function EditPDF() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editText, setEditText] = useState('');
  const [links, setLinks] = useState([]);
  const [linkText, setLinkText] = useState('');
  const [linkType, setLinkType] = useState('page');
  const [targetPage, setTargetPage] = useState(1);
  const [targetUrl, setTargetUrl] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'edit-pdf' });
  }, []);

  useEffect(() => {
    if (file) {
      const fetchPageCount = async () => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.post('/pdf/page-count', formData);
          if (response && response.data && response.data.pageCount) setPageCount(response.data.pageCount);
        } catch (_) {}
      };
      fetchPageCount();
    } else {
      setPageCount(0);
    }
  }, [file]);

  const addLink = () => {
    if (!linkText.trim()) return;
    if (linkType === 'page' && (!targetPage || targetPage < 1)) return;
    if (linkType === 'url' && !targetUrl.trim()) return;
    setLinks((prev) => [...prev, {
      text: linkText,
      linkType,
      targetPage: linkType === 'page' ? parseInt(targetPage) : undefined,
      targetUrl: linkType === 'url' ? targetUrl : undefined,
      pageIndex: 0,
      x: 50,
      y: 50 + (links.length * 25),
      fontSize: 12,
      color: [0, 0, 1],
      width: 150,
      height: 20,
    }]);
    setLinkText('');
    setTargetUrl('');
  };

  const removeLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!file) {
      setError(t('tool.selectPdfError', 'Please select a PDF file.'));
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    clearDownload();
    gtagEvent('tool_process', { tool_name: 'edit-pdf' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const edits = [];
      if (editText.trim()) {
        edits.push({ pageIndex: 0, type: 'text', x: 50, y: 50, text: editText, fontSize: 14, color: [0, 0, 0] });
      }
      if (links.length > 0) {
        links.forEach((link) => {
          edits.push({
            pageIndex: link.pageIndex || 0,
            type: 'link',
            x: link.x || 50,
            y: link.y || 50,
            text: link.text || '',
            fontSize: link.fontSize || 12,
            color: link.color || [0, 0, 1],
            linkType: link.linkType || 'page',
            targetPage: link.targetPage,
            targetUrl: link.targetUrl,
            width: link.width || 150,
            height: link.height || 20,
          });
        });
      }
      formData.append('edits', JSON.stringify(edits));
      const data = await handleToolSubmit('/pdf/edit-pdf', formData, 'edited.pdf');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'edited.pdf');
      }
      gtagEvent('tool_success', { tool_name: 'edit-pdf' });
    } catch (err) {
      const msg = err.message || t('tool.editError', 'Failed to edit PDF.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'edit-pdf', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title={t('tool.editPdfTitle', 'Edit PDF Online Free - Text, Images, Pages')} description={t('tool.editPdfDesc', 'Edit PDF files online. Add text, images, and annotations to any PDF - no sign-up required, 100% free.')} keywords={[ t('tool.editPdfKeywords', 'edit PDF, PDF editor, edit PDF online, modify PDF, annotate PDF, edit text inside a PDF, change text color in a PDF, replace text in a PDF, add an image to a PDF, remove text from a PDF, best way to edit PDF, free online PDF editor, edit PDF text, add images to PDF, modify PDF content, edit PDF without Adobe, online PDF editor free'), ...getLongTailKeywordSample(15), ...getGeoKeywordSample(15) ].join(', ')} canonical="/edit-pdf" />
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('tool.editPdfTitle', 'Edit PDF Online Free - Edit PDF Files')}</h1>
        <p className="mt-2 text-gray-600">
          {t('tool.editDesc', 'Add annotations, highlights, shapes, and text to your PDF documents.')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FileUploader
          accept=".pdf"
          label="Upload PDF to edit"
          onFilesSelected={(f) => { setFile(f[0] || null); setError(''); setResult(null); clearDownload(); }}
        />

        {file && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tool.textToAdd', 'Text to add (first page)')}</label>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={t('tool.enterTextToAdd', 'Enter text to add to the PDF')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('tool.addInternalLinks', 'Add Internal Links')}</h3>
              <p className="text-xs text-gray-500 mb-3">{t('tool.internalLinksDesc', 'Add clickable links that jump to other pages within the same PDF or to external URLs.')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tool.linkText', 'Link Text')}</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder={t('tool.linkTextPlaceholder', 'e.g. Go to Chapter 1')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tool.linkType', 'Link Type')}</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="page">{t('tool.linkTypePage', 'Jump to Page')}</option>
                    <option value="url">{t('tool.linkTypeUrl', 'External URL')}</option>
                  </select>
                </div>
              </div>
              {linkType === 'page' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tool.targetPage', 'Target Page Number')} {pageCount > 0 && `(${t('tool.of', 'of')} ${pageCount})`}</label>
                  <input
                    type="number"
                    min="1"
                    max={pageCount || 999}
                    value={targetPage}
                    onChange={(e) => setTargetPage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
              {linkType === 'url' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tool.targetUrl', 'Target URL')}</label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={addLink}
                disabled={!linkText.trim() || (linkType === 'url' && !targetUrl.trim())}
                className="mt-3 inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {t('tool.addLink', 'Add Link')}
              </button>
              {links.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {links.map((link, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                      <span className="text-indigo-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      </span>
                      <span className="flex-1 truncate text-gray-700">{link.text} ? {link.linkType === 'page' ? `${t('tool.page', 'Page')} ${link.targetPage}` : link.targetUrl}</span>
                      <button type="button" onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {file && !loading && (
          <button
            onClick={handleProcess}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {t('tool.editPdf', 'Edit PDF')}
          </button>
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isReady && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            <p>{t('tool.success', 'PDF edited successfully. Download started automatically. You can download it again below.')}</p>
            {downloadUrl && (
              <button
                type="button"
                onClick={handleDownloadAgain}
                className="mt-2 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('tool.downloadAgain', 'Download Again')}
              </button>
            )}
          </div>
        )}

        {result && !isReady && (
          <div className="mt-6">
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); setEditText(''); setLinks([]); clearDownload(); }} action={t('tool.edited', 'edited')} />
          </div>
        )}

      <AdsterraNative />

      </div>

    </div>
      <RelatedTools />
    </>
  );
}
