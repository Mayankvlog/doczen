import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyAPI } from '../services/api';
import SEO from '../components/SEO';
import { useLanguage } from '../index';

const actionColors = {
  merge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  split: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  compress: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  rotate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  protect: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  unlock: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'add-page-numbers': 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  'add-watermark': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  'extract-text': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  'reorder-pages': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  'delete-pages': 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
  'pdf-to-jpg': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  'jpg-to-pdf': 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  'pdf-to-txt': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'pdf-to-word': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'word-to-pdf': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  'pdf-to-ppt': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'ppt-to-pdf': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300',
  'pdf-to-excel': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'excel-to-pdf': 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300',
  editPdf: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  signPdf: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const quickActions = [
    { emoji: '🔗', label: t('dashboard.quick.mergePdf', 'Merge PDF'), path: '/merge-pdf', color: 'bg-indigo-500' },
    { emoji: '✂️', label: t('dashboard.quick.splitPdf', 'Split PDF'), path: '/split-pdf', color: 'bg-blue-500' },
    { emoji: '📦', label: t('dashboard.quick.compress', 'Compress'), path: '/compress-pdf', color: 'bg-emerald-500' },
    { emoji: '🔄', label: t('dashboard.quick.rotate', 'Rotate'), path: '/rotate-pdf', color: 'bg-amber-500' },
    { emoji: '📄', label: t('dashboard.quick.jpgToPdf', 'JPG to PDF'), path: '/jpg-to-pdf', color: 'bg-teal-500' },
    { emoji: '✏️', label: t('dashboard.quick.editPdf', 'Edit PDF'), path: '/edit-pdf', color: 'bg-rose-500' },
  ];

  const actionTranslationKeys = {
    merge: 'tool.mergePdf',
    split: 'tool.splitPdf',
    compress: 'tool.compressPdf',
    rotate: 'tool.rotatePdf',
    protect: 'tool.protectPdf',
    unlock: 'tool.unlockPdf',
    'add-page-numbers': 'tool.addPageNumbers',
    'add-watermark': 'tool.addWatermark',
    'extract-text': 'tool.extractText',
    'reorder-pages': 'tool.reorderPages',
    'delete-pages': 'tool.deletePages',
    'pdf-to-jpg': 'tool.pdfToJpg',
    'jpg-to-pdf': 'tool.jpgToPdf',
    'pdf-to-txt': 'tool.pdfToTxt',
    'pdf-to-word': 'tool.pdfToWord',
    'word-to-pdf': 'tool.wordToPdf',
    'pdf-to-ppt': 'tool.pdfToPpt',
    'ppt-to-pdf': 'tool.pptToPdf',
    'pdf-to-excel': 'tool.pdfToExcel',
    'excel-to-pdf': 'tool.excelToPdf',
    editPdf: 'tool.editPdf',
    signPdf: 'tool.signPdf',
    repair: 'tool.repairPdf',
    flatten: 'tool.flattenPdf',
    'pdf-to-pdfa': 'tool.pdfToPdfa',
    'html-to-pdf': 'tool.htmlToPdf',
    redact: 'tool.redactPdf',
    'remove-annotations': 'tool.removeAnnotations',
    'remove-watermark': 'tool.removeWatermark',
    compare: 'tool.comparePdf',
    metadata: 'tool.pdfMetadata',
  };

  const getActionLabel = (action) => {
    const fallback = String(action || '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    return actionTranslationKeys[action]
      ? t(actionTranslationKeys[action], fallback)
      : fallback;
  };

  const statusLabels = {
    completed: t('dashboard.status.completed', 'Completed'),
    failed: t('dashboard.status.failed', 'Failed'),
    pending: t('dashboard.status.pending', 'Pending'),
  };

  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stats, setStats] = useState({ total: 0, percentageUsed: 0, isLimitReached: false });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const { data: statsData } = await historyAPI.getStats();
        if (statsData && statsData.success && statsData.stats) {
          setStats(statsData.stats);
        } else {
          setStats({ total: 0, percentageUsed: 0, isLimitReached: false });
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
        setStatsError(error.message || 'Failed to load stats');
        setStats({ total: 0, percentageUsed: 0, isLimitReached: false });
      } finally {
        setLoadingStats(false);
      }
    };

    if (user && user._id) {
      fetchStats();
    }

    const refreshStats = () => { fetchStats(); };
    window.addEventListener("historyCleared", refreshStats);

    return () => {
      window.removeEventListener("historyCleared", refreshStats);
    };
  }, [user]);

  const fetchRecentActivity = async () => {
    try {
      setLoadingHistory(true);

      const response = await historyAPI.getAll(1);

      console.log("Dashboard history response:", response.data);

      const historyData = Array.isArray(response?.data?.history)
        ? response.data.history
        : [];

      setRecentActivity(historyData);

    } catch (error) {
      console.error("Dashboard history fetch failed:", error);
      setRecentActivity([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();

    const refresh = () => {
      fetchRecentActivity();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("historyCleared", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("historyCleared", refresh);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
    <SEO
  title={t('tool.seo.dashboardTitle', 'Dashboard - Doczen PDF Editor')}
  description={t('tool.seo.dashboardDesc', 'Your Doczen dashboard. View usage stats, recent activity, and quick access to all PDF tools.')}
  keywords={t('tool.seo.dashboardKeywords', 'dashboard, PDF tools, Doczen account, file management')}
  canonical="/dashboard"
  noIndex
/>
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {t('dashboard.welcome', 'Welcome back')}{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.subtitle', "Here's what's happening with your documents today.")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Files Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('dashboard.totalProcessed', 'Total Processed')}
              </p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              )}
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        {/* Usage Status Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('dashboard.usage', 'Usage')}
              </p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.percentageUsed}%
                </p>
              )}
            </div>
            <div className="text-3xl">{stats.percentageUsed >= 80 ? '⚠️' : '📊'}</div>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('dashboard.status', 'Status')}
              </p>
              {loadingStats ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className={`text-lg font-bold ${
                  stats.isLimitReached
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {stats.isLimitReached
                    ? t('dashboard.limitReached', 'Limit Reached')
                    : t('dashboard.active', 'Active')}
                </p>
              )}
            </div>
            <div className="text-3xl">{stats.isLimitReached ? '🛑' : '🟢'}</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {statsError && (
        <div className="mb-6 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 px-4 py-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {statsError}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickActions', 'Quick Actions')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} text-white text-lg`}>
                {action.emoji}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentActivity', 'Recent Activity')}</h2>
          <Link
            to="/history"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {t('dashboard.viewAll', 'View All')}
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {t('dashboard.noActivity', 'No activity yet. Start by using one of the tools above!')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentActivity.map((item) => (
                <div key={item._id} className="flex items-center gap-4 px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                      actionColors[item.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {getActionLabel(item.action)}
                  </span>
                  <span className="flex-1 truncate text-sm text-gray-600 dark:text-gray-300">
                    {item.fileName || item.outputFiles?.[0]?.originalName || item.inputFiles?.[0]?.originalName || t('dashboard.untitled', 'Untitled')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : item.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}
                  >
                    {statusLabels[item.status] || item.status || t('dashboard.status.pending', 'Pending')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
