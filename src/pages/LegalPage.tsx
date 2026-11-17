import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

interface LegalPageProps {
  doc: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ doc }) => {
  const { language, t, settings } = useApp();
  const title = doc === 'privacy' ? t.pages.privacyTitle : t.pages.termsTitle;
  const body =
    doc === 'privacy'
      ? language === 'hi'
        ? settings?.privacy_hi
        : settings?.privacy_en
      : language === 'hi'
        ? settings?.terms_hi
        : settings?.terms_en;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SeoHead title={title} description={title} />
      <div className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-6">
        <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
          ANIDOC 2D
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
          {title}
        </h1>
      </div>
      <div className="mt-8 rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 sm:p-10">
        <div className="max-w-prose whitespace-pre-line text-base leading-relaxed text-[#404040] dark:text-[#F4F1EB]/85">
          {body}
        </div>
      </div>
    </div>
  );
};
