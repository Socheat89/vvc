import React from 'react';
import LegalDocumentPage from '../../components/LegalDocumentPage';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedSetting, useSiteSettings } from '../../context/SiteSettingsContext';
import {
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_PRIVACY_CONTENT_EN,
  DEFAULT_PRIVACY_CONTENT_KH,
} from '../../constants/siteDefaults';

export default function Privacy() {
  const { language } = useLanguage();
  const { settings, loading } = useSiteSettings();
  const defaultContent = language === 'en' ? DEFAULT_PRIVACY_CONTENT_EN : DEFAULT_PRIVACY_CONTENT_KH;
  const content = getLocalizedSetting(settings, 'privacy_content', language, defaultContent || DEFAULT_PRIVACY_CONTENT);

  return (
    <LegalDocumentPage
      loading={loading}
      content={content}
      fallbackLabel={language === 'en' ? 'Privacy content is not available yet.' : 'ខ្លឹមសារឯកជនភាពមិនទាន់មានទេ។'}
    />
  );
}
