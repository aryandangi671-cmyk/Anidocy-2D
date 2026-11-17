import React from 'react';

interface AnidocLogoProps {
  className?: string;
  compact?: boolean;
}

export const AnidocLogo: React.FC<AnidocLogoProps> = ({ className = '', compact = false }) => {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <img
        src="/assets/aistudio/Screenshot_20261017-074135_42bbe039.png"
        alt="ANIDOC 2D Official Logo"
        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-[#A47A2C]/60 dark:border-[#D4AF62]/70 shrink-0"
      />
      {!compact && (
        <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.06em] text-[#171717] dark:text-[#F4F1EB]">
          ANIDOC{' '}
          <span className="text-[#A47A2C] dark:text-[#D4AF62]">2D</span>
        </span>
      )}
    </span>
  );
};
