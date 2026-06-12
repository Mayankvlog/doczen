import { useState, useEffect } from 'react';
import { useLanguage } from '../../index';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { Link } from 'react-router-dom';
import AdsterraNative from '../../components/AdsterraNative';

export default function ExtractText() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();
  const { t } = useLanguage();

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'extract-text' });
  }, []);

  const handleProcess = async () => {
    if (!file) {
      setError(t('tool.selectPdfError', 'Please select a PDF file.'));
      return;
    }
    setError('');
    setLoading(true);
    setExtractedText('');
    setResult(null);
    clearDownload();
    gtagEvent('tool_process', { tool_name: 'extract-text' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await handleToolSubmit('/pdf/extract-text', formData, 'extracted-text.txt');
      setExtractedText(data.text || '');
      setResult({ success: true, fileName: data.fileName, size: data.size });
      if (data.downloadUrl) {
        const resp = await fetch(`${process.env.REACT_APP_API_URL || ''}${data.downloadUrl}`);
        if (!resp.ok) {
          console.warn('Text download fetch failed:', resp.status);
        } else {
          const blob = await resp.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          setDownload(objectUrl, data.fileName || data.originalName || 'extracted-text.txt');
        }
      }
      gtagEvent('tool_success', { tool_name: 'extract-text' });
    } catch (err) {
      const msg = err.message || t('tool.extractTextError', 'Failed to extract text. Please try again.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'extract-text', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title={t('seo.extractText.title', 'Extract Text from PDF Online Free')} description={t('seo.extractText.desc', 'Extract text from PDF files online for free. Copy text from scanned PDFs and documents with Doczen\'s text extractor.')} keywords={t('seo.extractText.keywords', 'extract text from PDF, PDF text extractor, copy text from PDF, PDF to text, read PDF')} canonical="/extract-text" />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('tool.extractText', 'Extract Text')}</h1>
          <p className="text-lg text-gray-600 mt-2">{t('tool.extractTextDesc2', 'Extract all text content from a PDF document')}</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tool.uploadPdf', 'Upload PDF')}</h2>
          <FileUploader
            accept=".pdf"
            onFilesSelected={(selected) => { setFile(selected[0] || null); setError(''); setResult(null); setExtractedText(''); clearDownload(); }}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {loading ? t('tool.extracting', 'Extracting text...') : t('tool.extractText', 'Extract Text')}
        </button>

        {loading && (
          <div className="mt-6">
            <LoadingSpinner />
          </div>
        )}

        {extractedText && (
          <div className="mt-6 card">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('tool.extractedText', 'Extracted Text')}</h2>
            <textarea
              readOnly
              value={extractedText}
              rows={15}
              className="input-field font-mono text-sm resize-y"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(extractedText);
              }}
              className="mt-3 btn-secondary text-sm"
            >
              {t('tool.copyToClipboard', 'Copy to Clipboard')}
            </button>
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
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); setExtractedText(''); clearDownload(); }} action="processed" onDownloadAgain={isReady ? handleDownloadAgain : undefined} />
          </div>
        )}
        {/* SEO Content Section */}
        <div className="mt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Extract Text from a PDF Online for Free</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-600">
              <li>Upload a PDF file that contains text content you want to extract</li>
              <li>Click the "Extract Text" button to begin the extraction process</li>
              <li>View the extracted text in the text area displayed on screen</li>
              <li>Use the "Copy to Clipboard" button to copy the text for reuse</li>
              <li>Download the extracted text as a .txt file for offline use</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Related PDF Tools</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/merge-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.mergePdf', 'Merge PDF')}</Link>
              <Link to="/split-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.splitPdf', 'Split PDF')}</Link>
              <Link to="/compress-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.compressPdf', 'Compress PDF')}</Link>
              <Link to="/rotate-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.rotatePdf', 'Rotate PDF')}</Link>
              <Link to="/delete-pages" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.deletePages', 'Delete Pages')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
