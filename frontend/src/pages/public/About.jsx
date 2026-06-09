import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import translations from '../../translations';
import { bannerService } from '../../services/api';

const PUBLIC_ASSET_BASE = 'https://vvc.asia/backend/public';
const VIDEO_MEDIA_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v']);

const extractUploadPath = (value) => {
  const normalizedValue = String(value || '').trim().replace(/\\/g, '/');
  const uploadIndex = normalizedValue.toLowerCase().indexOf('uploads/');

  if (uploadIndex < 0) return '';

  return normalizedValue.slice(uploadIndex).replace(/^\/+/, '');
};

const getBannerMediaUrl = (media) => {
  if (!media) return '';
  const rawMedia = String(media).trim().replace(/\\/g, '/');
  if (!rawMedia) return '';
  if (/^(data:|blob:)/i.test(rawMedia)) return rawMedia;

  const uploadPath = extractUploadPath(rawMedia);
  if (uploadPath) return `${PUBLIC_ASSET_BASE}/${uploadPath}`;

  if (/^https?:\/\//i.test(rawMedia)) return rawMedia;

  const mediaPath = rawMedia
    .replace(/^\/+/, '')
    .replace(/^public\//i, '')
    .replace(/^backend\/public\//i, '')
    .replace(/^uploads\//i, '');

  return `${PUBLIC_ASSET_BASE}/uploads/banners/${mediaPath}`;
};

const getMediaTypeFromUrl = (media) => {
  if (!media) return 'image';

  const rawMedia = String(media).trim().replace(/\\/g, '/');
  if (/^data:video\//i.test(rawMedia)) return 'video';
  if (/^data:image\//i.test(rawMedia)) return 'image';

  const mediaPath = rawMedia.split(/[?#]/)[0];
  const extension = mediaPath.includes('.')
    ? mediaPath.split('.').pop().toLowerCase()
    : '';

  return VIDEO_MEDIA_EXTENSIONS.has(extension) ? 'video' : 'image';
};

export default function About() {
  const { language } = useLanguage();
  const { displayName } = useSiteSettings();
  const t = translations.aboutPage;
  const brandName = displayName || t.title[language] || 'Van Van Cambodia';
  const [heroBanner, setHeroBanner] = useState('');
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);

  const values = [
    { titleKey: 'value1Title', descKey: 'value1Desc' },
    { titleKey: 'value2Title', descKey: 'value2Desc' },
    { titleKey: 'value3Title', descKey: 'value3Desc' },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchHeroBanner = async () => {
      try {
        const response = await bannerService.getForPlacement('about');
        const banners = response.data.data || [];
        const firstBanner = banners.find((banner) => banner?.image && banner.active !== false);

        if (isMounted && firstBanner) {
          setHeroBanner(getBannerMediaUrl(firstBanner.image));
          setBannerLoadFailed(false);
        }
      } catch (error) {
        console.error('Failed to fetch about banner:', error);
      }
    };

    fetchHeroBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  const showHeroBanner = heroBanner && !bannerLoadFailed;
  const heroBannerType = getMediaTypeFromUrl(heroBanner);

  return (
    <div className="about-page">
      <section className={`about-hero ${showHeroBanner ? 'about-hero-has-image' : ''}`}>
        {showHeroBanner && heroBannerType === 'video' && (
          <video
            src={heroBanner}
            className="about-hero-image"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setBannerLoadFailed(true)}
          />
        )}
        {showHeroBanner && heroBannerType !== 'video' && (
          <img
            src={heroBanner}
            alt=""
            className="about-hero-image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => setBannerLoadFailed(true)}
          />
        )}
        <div className="about-hero-shade" aria-hidden="true" />

        <div className="about-hero-content mx-auto max-w-6xl px-4">
          <div className="about-hero-copy reveal">
            <span className="pill">{t.tagline[language]}</span>
            <h1>
              {brandName}
              <span>{t.titleSpan[language]}</span>
            </h1>
            <p>{t.heroDesc[language]}</p>
            <div className="about-hero-actions">
              <Link to="/products" className="btn-primary">
                {t.primaryCta[language]}
              </Link>
              <a href="#about-values" className="btn-secondary">
                {t.secondaryCta[language]}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="about-mission-section">
        <div className="about-mission-layout mx-auto max-w-6xl px-4">
          <div className="about-section-copy reveal">
            <span>{t.missionKicker[language]}</span>
            <h2>{t.missionTitle[language]}</h2>
            <p>{t.missionDesc[language]}</p>
          </div>

          <div className="about-mission-statement reveal reveal-delay-1">
            <p>{t.missionQuote[language]}</p>
          </div>
        </div>
      </section>

      <section id="about-values" className="about-values-section mx-auto max-w-6xl px-4">
        <div className="about-section-copy about-section-copy-centered reveal">
          <span>{t.valuesKicker[language]}</span>
          <h2>{t.valuesTitle[language]}</h2>
        </div>

        <div className="about-values-grid">
          {values.map((value, index) => (
            <article key={value.titleKey} className={`about-value-card reveal reveal-delay-${index + 1}`}>
              <div>{String(index + 1).padStart(2, '0')}</div>
              <h3>{t[value.titleKey][language]}</h3>
              <p>{t[value.descKey][language]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta-band">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2>{t.ctaTitle[language]}</h2>
            <p>{t.ctaDesc[language]}</p>
          </div>
          <Link to="/products" className="btn-primary">
            {t.ctaButton[language]}
          </Link>
        </div>
      </section>
    </div>
  );
}
