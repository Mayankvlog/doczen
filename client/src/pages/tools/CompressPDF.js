import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import AdsterraNative from '../../components/AdsterraNative';

export default function CompressPDF() {
  const { t } = useLanguage();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'compress-pdf' });
  }, []);

  const handleProcess = async () => {
    if (!file) {
      const msg = t('tool.selectPdfCompress', 'Please select a PDF file to compress.');
      setError(msg);
      toast.error(msg);
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    clearDownload();
    setProgress(0);
    gtagEvent('tool_process', { tool_name: 'compress-pdf', quality });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality);
      const data = await handleToolSubmit('/pdf/compress', formData, 'compressed.pdf');
      setResult(data);
      toast.success(t('tool.toast.compressed', 'PDF compressed successfully!'));
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'compressed.pdf');
      }
      gtagEvent('tool_success', { tool_name: 'compress-pdf' });
    } catch (err) {
      const msg = err.message || t('tool.compressError', 'Failed to compress PDF. Please try again.');
      setError(msg);
      toast.error(msg);
      gtagEvent('tool_error', { tool_name: 'compress-pdf', error: msg });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <>
    <SEO title={t('seo.compressTitle', 'Compress PDF Online - Reduce PDF File Size Free')} description={t('seo.compressDesc', 'Compress PDF files online to reduce file size without losing quality. Free PDF compressor tool by Doczen. Reduce PDF size from MB to KB instantly.')} keywords={t('tool.compressKeywords', 'compress PDF, reduce PDF size, PDF compressor, shrink PDF, optimize PDF, compress PDF online free')} canonical="/compress-pdf" toolName={t('tool.compressPdf', 'Compress PDF')} />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('tool.compressPdf', 'Compress PDF')}</h1>
          <p className="text-lg text-gray-600 mt-2">{t('tool.compressDesc', 'Reduce the file size of your PDF without losing quality')}</p>
        </div>

        <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tool.uploadPdf', 'Upload PDF')}</h2>
          <FileUploader
            accept=".pdf"
            onFilesSelected={(selected) => { setFile(selected[0] || null); setError(''); setResult(null); clearDownload(); }}
            progress={progress}
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

        <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tool.qualitySettings', 'Quality Settings')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t('tool.compressionQuality', 'Compression Quality')}</span>
              <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('tool.lowSmaller', 'Low (smaller file)')}</span>
              <span>{t('tool.highBetter', 'High (better quality)')}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={loading || !file}
          className="btn-primary w-full flex items-center justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )}
          {loading ? t('tool.compressing', 'Compressing PDF...') : t('tool.compressPdf', 'Compress PDF')}
        </button>

        {loading && !progress && (
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
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); clearDownload(); }} action={t('tool.compressed', 'compressed')} />
          </div>
        )}

        {/* SEO Content Section */}
        <div className="mt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.howToCompress', 'How to Compress a PDF Online for Free')}</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-600">
              <li>Upload your PDF file by clicking the upload area above (supports files up to 50 MB)</li>
              <li>Adjust the compression quality slider — move left for smaller file size or right for better quality</li>
              <li>Preview the estimated file size based on your quality selection before processing</li>
              <li>Click "Compress PDF" and wait a few seconds for the optimization to complete</li>
              <li>Download your compressed PDF file that is smaller, faster to share, and email-ready</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.whyCompress', 'Why Compress PDF Files?')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('tool.whyCompressDesc', 'Large PDF files are hard to share via email, slow to upload, and take up valuable storage space. Compressing your PDF reduces file size significantly while keeping the visual quality intact. Perfect for sending documents through email, uploading to websites, or archiving files.')}
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-600">
              <li>{t('tool.benefit1', 'Faster email attachments — stay under size limits')}</li>
              <li>{t('tool.benefit2', 'Quick uploads to websites and cloud storage')}</li>
              <li>{t('tool.benefit3', 'Save disk space on your devices')}</li>
              <li>{t('tool.benefit4', 'Faster document processing and downloads')}</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tool.relatedTools', 'Related PDF Tools')}</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/merge-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.mergePdf', 'Merge PDF')}</Link>
              <Link to="/split-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.splitPdf', 'Split PDF')}</Link>
              <Link to="/pdf-to-jpg" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.pdfToJpg', 'PDF to JPG')}</Link>
              <Link to="/pdf-to-word" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.pdfToWord', 'PDF to Word')}</Link>
              <Link to="/edit-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.editPdf', 'Edit PDF')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
