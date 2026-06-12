import { useState, useEffect } from 'react';
import FileUploader from '../../components/FileUploader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ResultCard from '../../components/ResultCard';
import { handleToolSubmit, useDownloadHandler, gtagEvent } from '../../services/api';
import SEO from '../../components/SEO';
import { useLanguage } from '../../index';
import { Link } from 'react-router-dom';
import AdsterraNative from '../../components/AdsterraNative';

export default function ProtectPDF() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { downloadUrl, isReady, setDownload, clearDownload, handleDownloadAgain } = useDownloadHandler();

  useEffect(() => {
    gtagEvent('tool_view', { tool_name: 'protect-pdf' });
  }, []);

  const handleProcess = async () => {
    if (!file) {
      setError(t('tool.selectPdfProtect', 'Please select a PDF file to protect.'));
      return;
    }
    if (!password) {
      setError(t('tool.enterPasswordProtect', 'Please enter a password.'));
      return;
    }
    if (password.length < 4) {
      setError(t('tool.passwordMinLength', 'Password must be at least 4 characters long.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('tool.passwordsNoMatch', 'Passwords do not match.'));
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    clearDownload();
    gtagEvent('tool_process', { tool_name: 'protect-pdf' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      const data = await handleToolSubmit('/pdf/protect', formData, 'protected.pdf');
      setResult(data);
      if (data.blobUrl) {
        setDownload(data.blobUrl, data.filename || 'protected.pdf');
      }
      gtagEvent('tool_success', { tool_name: 'protect-pdf' });
    } catch (err) {
      const msg = err.message || t('tool.protectError', 'Failed to protect PDF. Please try again.');
      setError(msg);
      gtagEvent('tool_error', { tool_name: 'protect-pdf', error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title={t('seo.protectTitle', 'Protect PDF - Add Password to PDF Free')} description={t('seo.protectDesc', 'Add password protection to your PDF files online for free. Secure your PDF documents with encryption using Doczen.')} keywords={t('tool.protectKeywords', 'protect PDF, password protect PDF, PDF security, encrypt PDF, lock PDF with password')} canonical="/protect-pdf" />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('tool.protectPdf', 'Protect PDF')}</h1>
          <p className="text-lg text-gray-600 mt-2">{t('tool.protectDesc', 'Add password protection to your PDF documents')}</p>
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

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('tool.setPassword', 'Set Password')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tool.password', 'Password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('tool.enterStrongPassword', 'Enter a strong password')}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tool.confirmPassword', 'Confirm Password')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('tool.reEnterPassword', 'Re-enter the password')}
                className="input-field"
              />
            </div>
          </div>
        </div>

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
          disabled={loading || !file || !password || !confirmPassword}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          {loading ? t('tool.protecting', 'Protecting PDF...') : t('tool.protectPdf', 'Protect PDF')}
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
            <ResultCard result={result} onReset={() => { setResult(null); setFile(null); setPassword(''); setConfirmPassword(''); clearDownload(); }} action={t('tool.protected', 'protected with password')} />
          </div>
        )}
        {/* SEO Content Section */}
        <div className="mt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Password Protect a PDF Online for Free</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-600">
              <li>Upload the PDF file you want to secure with a password</li>
              <li>Enter a strong password (minimum 4 characters required)</li>
              <li>Re-enter the same password in the confirmation field to verify</li>
              <li>Click the "Protect PDF" button to encrypt your document</li>
              <li>Download your password-protected PDF file securely</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Related PDF Tools</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/unlock-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.unlockPdf', 'Unlock PDF')}</Link>
              <Link to="/merge-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.mergePdf', 'Merge PDF')}</Link>
              <Link to="/compress-pdf" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.compressPdf', 'Compress PDF')}</Link>
              <Link to="/add-watermark" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.addWatermark', 'Add Watermark')}</Link>
              <Link to="/add-page-numbers" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">{t('tool.addPageNumbers', 'Add Page Numbers')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
