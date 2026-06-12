import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import AdsterraNative from '../../components/AdsterraNative';

export default function SplitPDF() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'split-pdf' });
  }, []);

  const handleProcess = async () => {
    if (!file) {
      setError(t('tool.selectPdf', 'Please select a PDF file.'));
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    clearDownload();
    gtagEvent('tool_process', { tool_name: 'split-pdf' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await handleToolSubmit('/pdf/split', formData, 'split_pages.zip');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'split_pages.zip');
      }
      gtagEvent('tool_success', { tool_name: 'split-pdf' });
    } catch (err) {
      const msg = err.message || t('tool.splitError', 'Failed to split PDF. Please try again.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'split-pdf', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title={t('seo.splitTitle', 'Split PDF Online - Separate PDF Pages Free')} description={t('seo.splitDesc', 'Split PDF files into multiple documents online for free. Extract pages from PDF or split by page ranges with Doczen. Free PDF splitter tool.')} keywords={t('tool.splitKeywords', 'split PDF, separate PDF pages, extract PDF pages, PDF splitter, divide PDF, split PDF online free')} canonical="/split-pdf" toolName={t('tool.splitPdf', 'Split PDF')} />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l-2 2m0 0l-2-2m2 2v6m0 0l2 2m-2-2l-2 2M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('tool.splitPdf', 'Split PDF')}</h1>
          <p className="text-lg text-gray-600 mt-2">{t('tool.splitDesc', 'Extract individual pages from a PDF into separate files')}</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tool.uploadPdf', 'Upload PDF')}</h2>
          <FileUploader
            accept=".pdf"
            onFilesSelected={(selected) => { setFile(selected[0] || null); setError(''); setResult(null); clearDownload(); }}
          />
          {file && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.name}
            </div>
          )}
        </div>

        <AdsterraNative />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={loading || !file}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l-2 2m0 0l-2-2m2 2v6m0 0l2 2m-2-2l-2 2M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          )}
          {loading ? t('tool.splitting', 'Splitting PDF...') : t('tool.splitPdf', 'Split PDF')}
        </button>

        {loading && (
          <div className="mt-6">
            <LoadingSpinner />
          </div>
        )}

        {isReady && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <p>{t('tool.success', 'File converted successfully. Download started automatically. You can download it again below.')}</p>
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
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); clearDownload(); }} action={t('tool.split', 'split')} />
          </div>
        )}

        {/* SEO Content Section */}
        <div className="mt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.howToSplit', 'How to Split a PDF Online for Free')}</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-600">
              <li>{t('tool.splitStep1', 'Upload your PDF file by clicking the upload area above')}</li>
              <li>{t('tool.splitStep2', 'Select the pages you want to extract or split by page ranges')}</li>
              <li>{t('tool.splitStep3', 'Click "Split PDF" and wait for processing')}</li>
              <li>{t('tool.splitStep4', 'Download your separated PDF pages as individual files')}</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.whySplit', 'Why Split PDF Files?')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('tool.whySplitDesc', 'Splitting a PDF lets you extract specific pages, remove unwanted sections, or divide a large document into smaller, more manageable files. Perfect for sharing only relevant pages with colleagues, creating custom document sets, or organizing your files.')}
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-600">
              <li>{t('tool.splitBenefit1', 'Extract specific pages from a large document')}</li>
              <li>{t('tool.splitBenefit2', 'Remove unwanted pages before sharing')}</li>
              <li>{t('tool.splitBenefit3', 'Create separate files for each chapter or section')}</li>
              <li>{t('tool.splitBenefit4', 'Reduce file size by keeping only essential pages')}</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.relatedTools', 'Related PDF Tools')}</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/merge-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.mergePdf', 'Merge PDF')}</Link>
              <Link to="/compress-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.compressPdf', 'Compress PDF')}</Link>
              <Link to="/delete-pages" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.deletePages', 'Delete Pages')}</Link>
              <Link to="/reorder-pages" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.reorderPages', 'Reorder Pages')}</Link>
              <Link to="/extract-text" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.extractText', 'Extract Text')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
