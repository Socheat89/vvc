import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/api';
import { getSiteLogoUrl } from '../utils/assetUrls';
import { DEFAULT_SITE_SETTINGS } from '../constants/siteDefaults';

const SiteSettingsContext = createContext({
  settings: DEFAULT_SITE_SETTINGS,
  displayName: DEFAULT_SITE_SETTINGS.logo_name,
  websiteName: DEFAULT_SITE_SETTINGS.website_name,
  logoUrl: '',
  loading: false,
  error: null,
  refreshSettings: async () => {},
  applySettings: () => {},
});

const normalizeSettings = (settings) => ({
  ...DEFAULT_SITE_SETTINGS,
  ...(settings || {}),
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applySettings = useCallback((nextSettings) => {
    setSettings(normalizeSettings(nextSettings));
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await settingsService.get();
      applySettings(response.data.data);
      setError(null);
    } catch (err) {
      setError(err);
      setSettings(DEFAULT_SITE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const value = useMemo(() => {
    const websiteName = settings.website_name || DEFAULT_SITE_SETTINGS.website_name;
    const displayName = settings.logo_name || websiteName;

    return {
      settings,
      displayName,
      websiteName,
      logoUrl: getSiteLogoUrl(settings.logo),
      loading,
      error,
      refreshSettings,
      applySettings,
    };
  }, [applySettings, error, loading, refreshSettings, settings]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
