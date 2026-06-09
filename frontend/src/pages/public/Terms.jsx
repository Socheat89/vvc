import React from 'react';
import LegalDocumentPage from '../../components/LegalDocumentPage';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedSetting, useSiteSettings } from '../../context/SiteSettingsContext';
import {
  DEFAULT_TERMS_CONTENT,
  DEFAULT_TERMS_CONTENT_EN,
  DEFAULT_TERMS_CONTENT_KH,
} from '../../constants/siteDefaults';

export default function Terms() {
  const { language } = useLanguage();
  const { settings, loading } = useSiteSettings();
  const defaultContent = language === 'en' ? DEFAULT_TERMS_CONTENT_EN : DEFAULT_TERMS_CONTENT_KH;
  const content = getLocalizedSetting(settings, 'terms_content', language, defaultContent || DEFAULT_TERMS_CONTENT);

  return (
    <LegalDocumentPage
      loading={loading}
      content={content}
      fallbackLabel={language === 'en' ? 'Terms content is not available yet.' : 'ខ្លឹមសារលក្ខខណ្ឌមិនទាន់មានទេ។'}
    />
  );
}
