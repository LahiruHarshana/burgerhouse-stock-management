import { I18nProvider } from '@/components/I18nProvider';
import HtmlLang from '@/components/HtmlLang';
import { getAuthLocale } from '@/lib/locale.server';

export default function SetupLayout({ children }) {
  const locale = getAuthLocale();
  return (
    <I18nProvider locale={locale}>
      <HtmlLang locale={locale} />
      {children}
    </I18nProvider>
  );
}
