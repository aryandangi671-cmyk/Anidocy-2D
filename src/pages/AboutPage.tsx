import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Film, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const AboutPage: React.FC = () => {
  const { language, t, settings } = useApp();
  const aboutText = language === 'hi' ? settings?.about_hi : settings?.about_en;
  const channelUrl = settings?.youtube_channel_url || 'https://youtube.com/@anidocemedia?si=rcoYZaWMGqJ7c7na';

  const pillars =
    language === 'hi'
      ? [
          {
            icon: BookOpen,
            title: 'प्राथमिक शोध और तथ्य',
            body: 'प्रत्येक डॉक्यूमेंट्री ऐतिहासिक अभिलेखों, पुरातात्विक रिपोर्टों और प्रमाणित दस्तावेजों के अध्ययन के बाद तैयार की जाती है।',
          },
          {
            icon: Film,
            title: '2D एनिमेटेड दृश्य कथा',
            body: 'जटिल घटनाओं, प्राचीन नगर योजनाओं और समयरेखाओं को स्पष्ट 2D विज़ुअल्स के माध्यम से सरल रूप में प्रस्तुत किया जाता है।',
          },
          {
            icon: ShieldCheck,
            title: 'स्पष्ट द्विभाषी अनुभव',
            body: 'हिंदी और अंग्रेज़ी दोनों पाठकों के लिए सहज, संपादकीय स्तर का पठन और वीडियो अनुभव।',
          },
        ]
      : [
          {
            icon: BookOpen,
            title: 'Primary Research First',
            body: 'Each documentary begins with archaeological records, civic archives, and verifiable historical documentation.',
          },
          {
            icon: Film,
            title: '2D Visual Storytelling',
            body: 'Complex timelines, sunken architecture, and historical reconstructions are translated into focused 2D narrative sequences.',
          },
          {
            icon: ShieldCheck,
            title: 'Bilingual Editorial Clarity',
            body: 'Crafted natively for both Hindi and English audiences without diluting accuracy or tone.',
          },
        ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SeoHead title={t.pages.aboutTitle} description={t.pages.aboutSubtitle} />

      <div className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-8">
        <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
          ANIDOC 2D
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-5xl">
          {t.pages.aboutTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#525252] dark:text-[#929292]">
          {t.pages.aboutSubtitle}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10">
            <img
              src="/src/assets/images/about_research_archive_1794889504861.jpg"
              alt={language === 'hi' ? 'ANIDOC 2D अभिलेखीय पुस्तकालय' : 'ANIDOC 2D research desk'}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-6">
          <p className="text-base leading-relaxed text-[#404040] dark:text-[#F4F1EB]/85 whitespace-pre-line">
            {aboutText}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-[#C92332] px-5 py-2.5 text-sm font-semibold text-[#F4F1EB] hover:bg-[#B8202D] transition-colors"
            >
              <span>{t.controls.subscribeYouTube}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              to="/contact"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-5 py-2.5 text-sm font-medium text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors"
            >
              <span>{t.nav.contact}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-3"
            >
              <Icon className="h-5 w-5 text-[#A47A2C] dark:text-[#D4AF62]" aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold text-[#171717] dark:text-[#F4F1EB]">{p.title}</h2>
              <p className="text-sm leading-relaxed text-[#525252] dark:text-[#929292]">{p.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
