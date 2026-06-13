import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, gtagEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { useLanguage } from '../index';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { setUserData } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    gtagEvent('page_view', { page_name: 'reset-password' });
    if (!token || !email) {
      setError(t('resetPassword.error.invalidLink', 'Invalid or missing reset link parameters.'));
    }
  }, [token, email, t]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.newPassword || !form.confirmPassword) {
      setError(t('resetPassword.error.required', 'Please fill in all fields.'));
      return;
    }

    if (form.newPassword.length < 8) {
      setError(t('resetPassword.error.shortPassword', 'Password must be at least 8 characters.'));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t('resetPassword.error.mismatch', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        token,
        email,
        newPassword: form.newPassword
      });
      
      const { token: newToken, _id, name, email: userEmail, storageUsed, storageLimit } = response.data;
      setUserData({ _id, name, email: userEmail, storageUsed, storageLimit }, newToken);
      
      setMessage(response.data.message || t('resetPassword.success', 'Password reset successfully!'));
      setSuccess(true);
      gtagEvent('reset_password_success', {});
      
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || t('resetPassword.error.failed', 'Failed to reset password.');
      setError(msg);
      gtagEvent('reset_password_error', { error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={t('tool.seo.resetPasswordTitle', 'Reset Password - Doczen PDF Editor')}
        description={t('tool.seo.resetPasswordDesc', 'Create a new password for your Doczen account')}
        keywords={t('tool.seo.resetPasswordKeywords', 'reset password, new password, Doczen')}
        canonical="/reset-password"
        noIndex
      />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('resetPassword.title', 'Create New Password')}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('resetPassword.subtitle', 'Enter your new password')}
              </p>
            </div>

            {message && (
              <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {!success && !error?.includes('Invalid or missing reset link') ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('resetPassword.newPassword', 'New Password')}
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder={t('resetPassword.passwordPlaceholder', 'Enter new password')}
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('resetPassword.confirmPassword', 'Confirm Password')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('resetPassword.confirmPlaceholder', 'Confirm password')}
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    t('resetPassword.reset', 'Reset Password')
                  )}
                </button>
              </form>
            ) : success ? (
              <div className="text-center py-6">
                <div className="mb-4 text-green-600 dark:text-green-400">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('resetPassword.redirecting', 'Password reset successfully! Redirecting to dashboard...')}
                </p>
              </div>
            ) : null}

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('resetPassword.backToLogin', 'Back to')}{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                {t('resetPassword.login', 'Login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
