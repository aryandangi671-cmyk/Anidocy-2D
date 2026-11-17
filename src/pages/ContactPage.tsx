import React, { useState } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const ContactPage: React.FC = () => {
  const { language, t, settings } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (name.trim().length < 2) {
      setError(language === 'hi' ? 'कृपया कम से कम 2 अक्षरों का नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(language === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 3) {
      setError(language === 'hi' ? 'कृपया विषय दर्ज करें।' : 'Please enter a subject (at least 3 characters).');
      return;
    }
    if (message.trim().length < 10) {
      setError(
        language === 'hi'
          ? 'कृपया कम से कम 10 अक्षरों का संदेश लिखें।'
          : 'Please write a message of at least 10 characters.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.contactForm.errorFallback);
        return;
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setError(t.contactForm.errorFallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SeoHead title={t.pages.contactTitle} description={t.pages.contactSubtitle} />

      <div className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-8">
        <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
          ANIDOC 2D
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-5xl">
          {t.pages.contactTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#525252] dark:text-[#929292]">
          {t.pages.contactSubtitle}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#A47A2C] dark:text-[#D4AF62]">
              <Mail className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {language === 'hi' ? 'सीधा संपादकीय संपर्क' : 'Editorial Correspondence'}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#525252] dark:text-[#929292]">
              {language === 'hi'
                ? 'आपके द्वारा भेजा गया प्रत्येक संदेश सीधे ANIDOC 2D के सुरक्षित डेटाबेस में सहेजा जाता है।'
                : 'Every submission is validated and stored securely in the ANIDOC 2D database for editorial review.'}
            </p>
            {settings?.show_public_contact === '1' && (
              <div className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-4 space-y-1.5 text-sm">
                {settings.public_contact_name && (
                  <p className="font-semibold text-[#171717] dark:text-[#F4F1EB]">
                    {settings.public_contact_name}
                  </p>
                )}
                {settings.public_contact_mobile && (
                  <p className="font-mono text-xs text-[#A47A2C] dark:text-[#D4AF62] tabular-nums">
                    <a href={`tel:${settings.public_contact_mobile}`} className="hover:underline">
                      {settings.public_contact_mobile}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 sm:p-8 space-y-5"
          >
            {error && (
              <div
                role="alert"
                className="rounded-sm border border-[#B8202D]/40 bg-[#B8202D]/10 px-4 py-3 text-sm text-[#B8202D] dark:text-[#F4F1EB]"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-sm border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.contactForm.success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {t.contactForm.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.contactForm.namePlaceholder}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {t.contactForm.email}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.contactForm.emailPlaceholder}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {t.contactForm.subject}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.contactForm.subjectPlaceholder}
                className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {t.contactForm.message}
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.contactForm.messagePlaceholder}
                className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-[#C92332] px-6 py-2.5 text-sm font-semibold text-[#F4F1EB] hover:bg-[#B8202D] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? t.contactForm.sending : t.contactForm.submit}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
