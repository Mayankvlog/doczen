import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Banner728x90 from './components/Banner728x90';
import AdLeftSidebar from './components/AdLeftSidebar';
import AdRightSidebar from './components/AdRightSidebar';

import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { gtagPageView, gtagConsent } from './services/api';
import SEO from './components/SEO';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

// ✅ PHASE 1 FIX: Implement code splitting with React.lazy() and Suspense
// Reduces initial bundle from 500KB+ to ~100KB (80% reduction)
// Tool pages load on-demand when user navigates to them
const MergePDF = React.lazy(() => import('./pages/tools/MergePDF'));
const SplitPDF = React.lazy(() => import('./pages/tools/SplitPDF'));
const CompressPDF = React.lazy(() => import('./pages/tools/CompressPDF'));
const RotatePDF = React.lazy(() => import('./pages/tools/RotatePDF'));
const ProtectPDF = React.lazy(() => import('./pages/tools/ProtectPDF'));
const UnlockPDF = React.lazy(() => import('./pages/tools/UnlockPDF'));
const AddPageNumbers = React.lazy(() => import('./pages/tools/AddPageNumbers'));
const AddWatermark = React.lazy(() => import('./pages/tools/AddWatermark'));
const ExtractText = React.lazy(() => import('./pages/tools/ExtractText'));
const ReorderPages = React.lazy(() => import('./pages/tools/ReorderPages'));
const DeletePages = React.lazy(() => import('./pages/tools/DeletePages'));
const PDFToJPG = React.lazy(() => import('./pages/tools/PDFToJPG'));
const JPGToPDF = React.lazy(() => import('./pages/tools/JPGToPDF'));
const PDFToTXT = React.lazy(() => import('./pages/tools/PDFToTXT'));
const PDFToWord = React.lazy(() => import('./pages/tools/PDFToWord'));
const WordToPDF = React.lazy(() => import('./pages/tools/WordToPDF'));
const PDFToPPT = React.lazy(() => import('./pages/tools/PDFToPPT'));
const PPTToPDF = React.lazy(() => import('./pages/tools/PPTToPDF'));
const PDFToExcel = React.lazy(() => import('./pages/tools/PDFToExcel'));
const ExcelToPDF = React.lazy(() => import('./pages/tools/ExcelToPDF'));
const EditPDF = React.lazy(() => import('./pages/tools/EditPDF'));
const SignPDF = React.lazy(() => import('./pages/tools/SignPDF'));
const RepairPDF = React.lazy(() => import('./pages/tools/RepairPDF'));
const PDFToPDFA = React.lazy(() => import('./pages/tools/PDFToPDFA'));
const Metadata = React.lazy(() => import('./pages/tools/Metadata'));
const FlattenPDF = React.lazy(() => import('./pages/tools/FlattenPDF'));
const HTMLToPDF = React.lazy(() => import('./pages/tools/HTMLToPDF'));
const RedactPDF = React.lazy(() => import('./pages/tools/RedactPDF'));
const RemoveAnnotations = React.lazy(() => import('./pages/tools/RemoveAnnotations'));
const ComparePDF = React.lazy(() => import('./pages/tools/ComparePDF'));
const RemoveWatermark = React.lazy(() => import('./pages/tools/RemoveWatermark'));
const { useLanguage } = require('./index');

function About() {
  const { t } = useLanguage();
  return (
    <>
    <SEO title={t('about.title', 'How Doczen Simplifies Documentation for Your Business')} description={t('about.metaDesc', 'Learn about Doczen - the free online PDF editor. Our mission is to make PDF editing accessible to everyone with 30+ free tools.')} canonical="/about" />
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('about.title', 'How Doczen Simplifies Documentation for Your Business')}</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
        <p>{t('about.p1', 'Doczen is a free, powerful online PDF editor designed to make document management simple and accessible for everyone. Whether you need to merge, split, compress, convert, or edit PDFs, Doczen provides all the tools you need right in your browser — no downloads, no installations.')}</p>
        <p>{t('about.p2', 'Our mission is to democratize PDF editing by offering a comprehensive suite of tools that are completely free to use. We believe that essential document management should not require expensive software subscriptions.')}</p>
        <p>{t('about.p3', 'Every tool on Doczen is built with modern web technologies to ensure fast, secure, and reliable processing. Your privacy is our priority — all files are encrypted during upload and automatically deleted from our servers within 24 hours.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('about.whyTitle', 'Why Doczen?')}</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t('about.why1', '<strong>100% Free</strong> — No hidden charges, no credit card required')}</li>
          <li>{t('about.why2', "<strong>30+ Tools</strong> — From merging to converting, we've got you covered")}</li>
          <li>{t('about.why3', '<strong>Secure</strong> — Encrypted uploads and automatic file deletion')}</li>
          <li>{t('about.why4', '<strong>Fast</strong> — Optimized processing for quick results')}</li>
          <li>{t('about.why5', '<strong>No Registration</strong> — Start using tools immediately')}</li>
        </ul>
      </div>
    </div>
    </>
  );
}

function PrivacyPolicy() {
  const { t } = useLanguage();
  return (
    <>
    <SEO title={t('privacy.title', 'Privacy Policy')} description={t('privacy.metaDesc', 'Doczen Privacy Policy - Learn how we protect your data and privacy. Your uploaded files are encrypted and automatically deleted within 24 hours.')} canonical="/privacy-policy" />
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('privacy.title', 'Privacy Policy')}</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
        <p>{t('privacy.lastUpdated', 'Last updated: January 2025')}</p>
        <p>{t('privacy.p1', 'Doczen ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('privacy.collectTitle', 'Information We Collect')}</h2>
        <p>{t('privacy.collectIntro', 'We collect minimal information necessary to provide our PDF editing services:')}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t('privacy.collect1', '<strong>Files You Upload:</strong> PDFs and documents you upload for processing are temporarily stored on our servers.')}</li>
          <li>{t('privacy.collect2', '<strong>Account Information:</strong> If you create an account, we collect your name and email address.')}</li>
          <li>{t('privacy.collect3', '<strong>Usage Data:</strong> Anonymous usage statistics to improve our service.')}</li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('privacy.filesTitle', 'How We Handle Your Files')}</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t('privacy.files1', 'All uploaded files are encrypted during transmission and at rest.')}</li>
          <li>{t('privacy.files2', 'Files are automatically and permanently deleted from our servers within 24 hours.')}</li>
          <li>{t('privacy.files3', 'We do not access, view, or share your uploaded documents.')}</li>
          <li>{t('privacy.files4', 'Processed files are available for download for a limited time before automatic deletion.')}</li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('privacy.cookiesTitle', 'Cookies')}</h2>
        <p>{t('privacy.cookiesDesc', 'We use essential cookies for authentication and service functionality. We do not use tracking cookies for advertising purposes.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('privacy.thirdPartyTitle', 'Third-Party Services')}</h2>
        <p>{t('privacy.thirdPartyDesc', 'We do not sell, trade, or transfer your information to third parties. We may share anonymized data with service providers who assist us in operating our website and improving our service.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('privacy.contactTitle', 'Contact')}</h2>
        <p>{t('privacy.contactDesc', 'If you have questions about this Privacy Policy, please contact us at support@doczen.com.')}</p>
      </div>
    </div>
    </>
  );
}

function TermsOfService() {
  const { t } = useLanguage();
  return (
    <>
    <SEO title={t('terms.title', 'Terms of Service')} description={t('terms.metaDesc', 'Doczen Terms of Service - Read the terms governing your use of our free online PDF editing tools and services.')} canonical="/terms-of-service" />
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('terms.title', 'Terms of Service')}</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
        <p>{t('terms.lastUpdated', 'Last updated: January 2025')}</p>
        <p>{t('terms.p1', 'By using Doczen, you agree to these Terms of Service. If you do not agree, please do not use our service.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('terms.useTitle', 'Use of Service')}</h2>
        <p>{t('terms.useIntro', 'Doczen provides free online PDF editing tools for personal and business use. You agree to:')}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>{t('terms.use1', 'Not upload malicious files or content that violates any law.')}</li>
          <li>{t('terms.use2', 'Not attempt to disrupt or overload our servers.')}</li>
          <li>{t('terms.use3', 'Not use the service for any unlawful purpose.')}</li>
          <li>{t('terms.use4', 'Comply with all applicable laws and regulations.')}</li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('terms.ipTitle', 'Intellectual Property')}</h2>
        <p>{t('terms.ipDesc', 'You retain all rights to your uploaded documents. Doczen claims no ownership over your files. Our software, brand, and website content are protected by applicable intellectual property laws.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('terms.limitationTitle', 'Limitation of Liability')}</h2>
        <p>{t('terms.limitationDesc', 'Doczen is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service. We do not guarantee that the service will be uninterrupted or error-free.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('terms.storageTitle', 'File Storage')}</h2>
        <p>{t('terms.storageDesc', 'Uploaded files are automatically deleted within 24 hours. We recommend downloading your processed files promptly. We are not responsible for data loss.')}</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-8">{t('terms.changesTitle', 'Changes to Terms')}</h2>
        <p>{t('terms.changesDesc', 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.')}</p>
      </div>
    </div>
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    gtagPageView(pathname);
  }, [pathname]);
  return null;
}

const toolPaths = new Set([
  '/merge-pdf', '/split-pdf', '/compress-pdf', '/rotate-pdf',
  '/protect-pdf', '/unlock-pdf', '/add-page-numbers', '/add-watermark',
  '/extract-text', '/reorder-pages', '/delete-pages', '/pdf-to-jpg',
  '/jpg-to-pdf', '/pdf-to-txt', '/pdf-to-word', '/word-to-pdf',
  '/pdf-to-ppt', '/ppt-to-pdf', '/pdf-to-excel', '/excel-to-pdf',
  '/edit-pdf', '/sign-pdf', '/repair-pdf', '/pdf-to-pdfa',
  '/pdf-metadata', '/flatten-pdf', '/html-to-pdf', '/redact-pdf',
  '/remove-annotations', '/compare-pdf', '/remove-watermark',
]);

function AppContent() {
  const { dir } = useLanguage();
  const { pathname } = useLocation();
  const isToolPage = toolPaths.has(pathname);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={dir}>
      <ScrollToTop />
      <Navbar />
      <Banner728x90 />
      {isToolPage && <AdLeftSidebar />}
      {isToolPage && <AdRightSidebar />}
      <main className={'flex-1 page-enter-active' + (isToolPage ? ' lg:mx-[160px]' : '')}>
        {/* ✅ PHASE 1 FIX: Suspense + ErrorBoundary for code-split components */}
        <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/merge-pdf" element={<MergePDF />} />
            <Route path="/split-pdf" element={<SplitPDF />} />
            <Route path="/compress-pdf" element={<CompressPDF />} />
            <Route path="/rotate-pdf" element={<RotatePDF />} />
            <Route path="/protect-pdf" element={<ProtectPDF />} />
            <Route path="/unlock-pdf" element={<UnlockPDF />} />
            <Route path="/add-page-numbers" element={<AddPageNumbers />} />
            <Route path="/add-watermark" element={<AddWatermark />} />
            <Route path="/extract-text" element={<ExtractText />} />
            <Route path="/reorder-pages" element={<ReorderPages />} />
            <Route path="/delete-pages" element={<DeletePages />} />
            <Route path="/pdf-to-jpg" element={<PDFToJPG />} />
            <Route path="/jpg-to-pdf" element={<JPGToPDF />} />
            <Route path="/pdf-to-txt" element={<PDFToTXT />} />
            <Route path="/pdf-to-word" element={<PDFToWord />} />
            <Route path="/word-to-pdf" element={<WordToPDF />} />
            <Route path="/pdf-to-ppt" element={<PDFToPPT />} />
            <Route path="/ppt-to-pdf" element={<PPTToPDF />} />
            <Route path="/pdf-to-excel" element={<PDFToExcel />} />
            <Route path="/excel-to-pdf" element={<ExcelToPDF />} />
            <Route path="/edit-pdf" element={<EditPDF />} />
            <Route path="/sign-pdf" element={<SignPDF />} />
            <Route path="/repair-pdf" element={<RepairPDF />} />
            <Route path="/pdf-to-pdfa" element={<PDFToPDFA />} />
            <Route path="/pdf-metadata" element={<Metadata />} />
            <Route path="/flatten-pdf" element={<FlattenPDF />} />
            <Route path="/html-to-pdf" element={<HTMLToPDF />} />
            <Route path="/redact-pdf" element={<RedactPDF />} />
            <Route path="/remove-annotations" element={<RemoveAnnotations />} />
            <Route path="/compare-pdf" element={<ComparePDF />} />
            <Route path="/remove-watermark" element={<RemoveWatermark />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

const CONSENT_KEY = 'doczen_consent';

function getStoredConsent() {
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === 'accepted') return 'accepted';
  if (stored === 'rejected') return 'rejected';
  return null;
}

function CookieConsent() {
  const [consent, setConsent] = useState(getStoredConsent);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    gtagConsent({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
    gtagConsent({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }, []);

  if (consent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Cookie Consent</span>
          <span className="ml-1">
            We use cookies to analyze site usage and improve your experience. You can choose to accept or reject analytics cookies.
          </span>
          <a href="/privacy-policy" className="text-indigo-600 hover:text-indigo-800 underline ml-1 whitespace-nowrap">
            Read our privacy policy
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
    <ToastProvider>
      <AppContent />
      <CookieConsent />
    </ToastProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
