import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { AnidocLogo } from '../../components/AnidocLogo.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';

interface OwnerAuthPageProps {
  mode: 'setup' | 'login';
}

export const OwnerAuthPage: React.FC<OwnerAuthPageProps> = ({ mode }) => {
  const { auth, refreshAuth, t, language } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [mode]);

  if (auth.authenticated && auth.user) {
    return <Navigate to="/owner" replace />;
  }

  if (mode === 'setup' && auth.ownerExists) {
    return <Navigate to="/owner/login" replace />;
  }

  if (mode === 'login' && !auth.ownerExists) {
    return <Navigate to="/owner/setup" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'setup') {
      if (name.trim().length < 2) {
        setError(language === 'hi' ? 'कृपया कम से कम 2 अक्षरों का नाम दर्ज करें।' : 'Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError(
          language === 'hi' ? 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' : 'Password must be at least 8 characters.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError(language === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'setup' ? '/api/auth/setup-owner' : '/api/auth/login';
      const payload =
        mode === 'setup'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      await refreshAuth();
      navigate('/owner', { replace: true });
    } catch {
      setError('Network error while contacting server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <SeoHead
        title={mode === 'setup' ? t.owner.setupTitle : t.owner.loginTitle}
        description={t.owner.loginSubtitle}
      />

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] dark:text-[#929292] hover:text-[#171717] dark:hover:text-[#F4F1EB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.pages.returnHome}</span>
          </Link>
          <AnidocLogo compact />
        </div>

        <div className="rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#A47A2C] dark:text-[#D4AF62]">
              {mode === 'setup' ? (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              <span>ANIDOC 2D</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
              {mode === 'setup' ? t.owner.setupTitle : t.owner.loginTitle}
            </h1>
            <p className="text-sm leading-relaxed text-[#525252] dark:text-[#929292]">
              {mode === 'setup' ? t.owner.setupSubtitle : t.owner.loginSubtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-sm border border-[#B8202D]/40 bg-[#B8202D]/10 px-4 py-3 text-sm text-[#B8202D] dark:text-[#F4F1EB]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'setup' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {t.owner.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {t.owner.emailLabel}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {t.owner.passwordLabel}
              </label>
              <input
                type="password"
                required
                autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
              />
            </div>

            {mode === 'setup' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {t.owner.confirmPasswordLabel}
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 min-h-[44px] w-full rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] dark:text-[#090909] hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
            >
              {submitting
                ? t.owner.signingIn
                : mode === 'setup'
                  ? t.owner.createOwnerBtn
                  : t.owner.signInBtn}
            </button>
          </form>

          <p className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-4 text-xs text-[#6B6B6B] dark:text-[#929292]">
            {t.owner.setupLockedNotice}
          </p>
        </div>
      </div>
    </div>
  );
};
