import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const NotFoundPage: React.FC = () => {
  const { t } = useApp();
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <SeoHead title="404" description={t.pages.notFoundBody} />
      <p className="font-mono text-sm font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-5xl">
        {t.pages.notFoundTitle}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-[#525252] dark:text-[#929292]">
        {t.pages.notFoundBody}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-6 py-2.5 text-sm font-semibold text-[#FFFFFF] dark:text-[#090909] hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{t.pages.returnHome}</span>
      </Link>
    </div>
  );
};
