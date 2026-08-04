import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import AdsterraNative from '../../components/AdsterraNative';
import RelatedTools from '../../components/RelatedTools';
import BamifyFooterBanner from '../../components/BamifyFooterBanner';

export default function ExcelToPDF() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();
  const [error, setError] = useState('');

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'excel-to-pdf' });
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    gtagEvent('tool_process', { tool_name: 'excel-to-pdf' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await handleToolSubmit('/pdf/excel-to-pdf', formData, 'converted.pdf');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'converted.pdf');
      }
      gtagEvent('tool_success', { tool_name: 'excel-to-pdf' });
    } catch (err) {
      const msg = err.message || t('tool.genericError', 'Something went wrong.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'excel-to-pdf', error: msg });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <>
    <SEO title={t('tool.excelToPdfTitle', 'Excel to PDF Converter Online Free')} description={t('tool.excelToPdfDesc', 'Convert Excel spreadsheets to PDF format online for free. XLSX to PDF converter by Doczen.')} keywords={t('tool.excelToPdfKeywords', 'Excel to PDF, convert Excel to PDF, XLSX to PDF, spreadsheet to PDF')} canonical="/excel-to-pdf" />
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('tool.excelToPdfTitle', 'Excel to PDF Converter Online Free')}</h1>
        <p className="mt-2 text-gray-600">
          {t('tool.excelToPdfDesc2', 'Convert your Excel spreadsheets into PDF format.')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FileUploader
          accept=".xlsx,.xls"
          label="Upload Excel file"
          onFilesSelected={(f) => { setFile(f[0] || null); setError(''); setResult(null); clearDownload(); }}
        />

        {file && !loading && (
          <button
            onClick={handleProcess}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {t('tool.convertToPdf', 'Convert to PDF')}
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

    </div>
      <BamifyFooterBanner />
      <RelatedTools />
    </>
  );
}

