import React from 'react';
import LegalDocumentPage from '../../components/LegalDocumentPage';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { DEFAULT_PRIVACY_CONTENT } from '../../constants/siteDefaults';

export default function Privacy() {
  const { settings, loading } = useSiteSettings();
  const content = settings?.privacy_content || DEFAULT_PRIVACY_CONTENT;

  return (
    <LegalDocumentPage
      loading={loading}
      content={content}
      fallbackLabel="ខ្លឹមសារឯកជនភាពមិនទាន់មានទេ។"
    />
  );
}
