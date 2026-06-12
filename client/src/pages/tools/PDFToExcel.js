import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import AdsterraNative from '../../components/AdsterraNative';

export default function PDFToExcel() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();
  const [error, setError] = useState('');

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'pdf-to-excel' });
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    gtagEvent('tool_process', { tool_name: 'pdf-to-excel' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await handleToolSubmit('/pdf/pdf-to-excel', formData, 'converted.xlsx');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'converted.xlsx');
      }
      gtagEvent('tool_success', { tool_name: 'pdf-to-excel' });
    } catch (err) {
      const msg = err.message || t('tool.genericError', 'Something went wrong.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'pdf-to-excel', error: msg });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <>
    <SEO title={t('tool.pdfToExcelTitle', 'PDF to Excel Converter Online Free')} description={t('tool.pdfToExcelDesc', 'Convert PDF files to editable Excel spreadsheets online for free. Extract tables from PDF to XLSX with Doczen.')} keywords={t('tool.pdfToExcelKeywords', 'PDF to Excel, convert PDF to Excel, PDF to XLSX, extract PDF to Excel, PDF converter')} canonical="/pdf-to-excel" />
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('tool.pdfToExcel', 'PDF to Excel')}</h1>
        <p className="mt-2 text-gray-600">
          {t('tool.pdfToExcelDesc2', 'Convert your PDF data into editable Excel spreadsheets.')}
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
            {t('tool.convertToExcel', 'Convert to Excel')}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use PDF to Excel Converter</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Click the upload area and select a PDF file containing tables, forms, or data.</li>
          <li>Wait for the file to be uploaded successfully.</li>
          <li>Click the "Convert to Excel" button to extract tabular data into a spreadsheet.</li>
          <li>The XLSX file will download automatically once the conversion is complete.</li>
          <li>Open the Excel file to analyze, edit, or reformat the extracted data as needed.</li>
        </ol>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Related Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link to="/excel-to-pdf" className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-indigo-600 transition-colors text-center">Excel to PDF</Link>
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

