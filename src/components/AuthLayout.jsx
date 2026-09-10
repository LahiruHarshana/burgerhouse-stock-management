'use client';
import { useI18n } from './I18nProvider';
import LocaleSwitcher from './LocaleSwitcher';

function BrandMark() {
  return (
    <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm grid place-items-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M3 11h18M5 11V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2M7 11v6M12 11v6M17 11v6" />
        <path d="M4 17h16" />
      </svg>
    </div>
  );
}

export default function AuthLayout({ children, step, totalSteps = 2, title }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel — desktop left, mobile compact header */}
      <div className="auth-gradient text-white lg:w-[42%] lg:min-h-screen flex flex-col justify-center px-6 py-8 lg:px-12 lg:py-16">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <div className="flex items-center gap-4 mb-6 lg:mb-10">
            <BrandMark />
            <div>
              <p className="text-xl lg:text-2xl font-bold tracking-tight">{title || t('login.title')}</p>
              <p className="text-white/70 text-sm mt-0.5 hidden sm:block">{t('shell.tagline')}</p>
            </div>
          </div>
          <p className="text-white/80 text-base lg:text-lg leading-relaxed hidden lg:block max-w-sm">
            {t('login.subtitle')}
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 bg-wall flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-end mb-4">
            <LocaleSwitcher variant="auth" />
          </div>
          {step != null && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm font-medium text-muted mb-2">
                <span>{t('setup.step', { current: step, total: totalSteps })}</span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="card shadow-elevated rounded-xl p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
