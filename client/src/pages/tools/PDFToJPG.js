import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../index';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import AdsterraNative from '../../components/AdsterraNative';

export default function PDFToJPG() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'pdf-to-jpg' });
  }, []);

  const handleProcess = async () => {
    if (!file) {
      setError(t('tool.selectPdfError', 'Please select a PDF file.'));
      return;
    }
    setLoading(true);
    setError('');
    gtagEvent('tool_process', { tool_name: 'pdf-to-jpg' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await handleToolSubmit('/pdf/pdf-to-jpg', formData, 'pdf_pages.zip');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'pdf_pages.zip');
      }
      gtagEvent('tool_success', { tool_name: 'pdf-to-jpg' });
    } catch (err) {
      const msg = err.message || t('tool.conversionFailed', 'Conversion failed. Try again.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'pdf-to-jpg', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title={t('seo.pdfToJpg.title', 'PDF to JPG Converter Online Free')} description={t('seo.pdfToJpg.desc', 'Convert PDF pages to high-quality JPG images online for free. PDF to image converter by Doczen.')} keywords={t('seo.pdfToJpg.keywords', 'PDF to JPG, convert PDF to image, PDF to picture, PDF to JPEG, extract images from PDF')} canonical="/pdf-to-jpg" />
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('tool.pdfToJpg', 'PDF to JPG')}</h1>
        <p className="mt-2 text-gray-600">
          {t('tool.pdfToJpgDesc2', 'Convert each PDF page into a high-quality JPG image.')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FileUploader
          accept=".pdf"
          label={t('tool.uploadPdfFile', 'Upload PDF file')}
          onFilesSelected={(f) => { setFile(f[0] || null); setError(''); setResult(null); clearDownload(); }}
        />

        {file && !loading && (
          <button
            onClick={handleProcess}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {t('tool.convertToJpg', 'Convert to JPG')}
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
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); clearDownload(); }} action={t('tool.converted', 'converted')} />
          </div>
        )}

      <AdsterraNative />

      </div>

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use PDF to JPG Converter</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Click the upload area above and select a PDF file from your device.</li>
          <li>Wait for the file to be uploaded successfully.</li>
          <li>Click the "Convert to JPG" button to start the conversion process.</li>
          <li>Once complete, a ZIP file containing JPG images (one per page) will download automatically.</li>
          <li>Extract the ZIP file to access your individual JPG images.</li>
        </ol>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Related Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link to="/jpg-to-pdf" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">JPG to PDF</Link>
          <Link to="/pdf-to-word" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">PDF to Word</Link>
          <Link to="/pdf-to-ppt" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">PDF to PPT</Link>
          <Link to="/pdf-to-txt" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">PDF to TXT</Link>
          <Link to="/edit-pdf" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">Edit PDF</Link>
        </div>
      </div>
    </div>
    </>
  );
}
