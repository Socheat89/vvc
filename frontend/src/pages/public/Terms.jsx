import React from 'react';
import LegalDocumentPage from '../../components/LegalDocumentPage';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { DEFAULT_TERMS_CONTENT } from '../../constants/siteDefaults';

export default function Terms() {
  const { settings, loading } = useSiteSettings();
  const content = settings?.terms_content || DEFAULT_TERMS_CONTENT;

  return (
    <LegalDocumentPage
      loading={loading}
      content={content}
      fallbackLabel="ខ្លឹមសារលក្ខខណ្ឌមិនទាន់មានទេ។"
    />
  );
}
