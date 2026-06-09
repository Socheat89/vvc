import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedSetting, useSiteSettings } from '../../context/SiteSettingsContext';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_ABOUT_CONTENT_EN,
  DEFAULT_ABOUT_CONTENT_KH,
} from '../../constants/siteDefaults';
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

const splitLabelText = (text) => {
  const separatorIndex = text.search(/[៖:]/);

  if (separatorIndex <= 0 || separatorIndex > 48) {
    return { label: '', text };
  }

  return {
    label: text.slice(0, separatorIndex + 1).trim(),
    text: text.slice(separatorIndex + 1).trim(),
  };
};

const parseAboutBlock = (block, index) => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] || '';
  const numberedMatch = firstLine.match(/^([0-9០១២៣៤៥៦៧៨៩]+)[.)]\s*(.+)$/);
  const isContact = /^ទំនាក់ទំនង|^contact/i.test(firstLine);
  const isClosing = firstLine.startsWith('[');

  if (numberedMatch) {
    const { label, text } = splitLabelText(numberedMatch[2]);
    return {
      type: 'section',
      symbol: numberedMatch[1],
      title: label || numberedMatch[2],
      lines: [text, ...lines.slice(1)].filter(Boolean),
    };
  }

  if (isContact) {
    const { label, text } = splitLabelText(firstLine);
    return {
      type: 'contact',
      symbol: '@',
      title: label || firstLine,
      lines: [text, ...lines.slice(1)].filter(Boolean),
    };
  }

  return {
    type: isClosing ? 'closing' : index === 0 ? 'intro' : 'note',
    symbol: isClosing ? 'VVC' : '•',
    title: '',
    lines,
  };
};

export default function About() {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const t = translations.aboutPage;
  const [heroBanner, setHeroBanner] = useState('');
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);
  const defaultAboutContent = language === 'en' ? DEFAULT_ABOUT_CONTENT_EN : DEFAULT_ABOUT_CONTENT_KH;
  const aboutContent = String(
    getLocalizedSetting(settings, 'about_content', language, defaultAboutContent || DEFAULT_ABOUT_CONTENT)
  ).replace(/\r\n/g, '\n').trim();
  const aboutLines = aboutContent.split('\n');
  const aboutTitleIndex = aboutLines.findIndex((line) => line.trim());
  const aboutTitle = aboutTitleIndex >= 0 ? aboutLines[aboutTitleIndex].trim() : t.tagline?.[language];
  const aboutParagraphs = aboutLines
    .slice(aboutTitleIndex + 1)
    .join('\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const aboutBlocks = aboutParagraphs.map((paragraph, index) => parseAboutBlock(paragraph, index));

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

        <div className="about-hero-content">
          <span className="pill about-hero-pill reveal">{t.tagline[language]}</span>
        </div>
      </section>

      <section className="about-content-section">
        <article className="about-content-article mx-auto max-w-5xl px-4 reveal">
          <header className="about-content-header">
            <h2>{aboutTitle}</h2>
          </header>

          <div className="about-content-timeline">
            {aboutBlocks.map((block, blockIndex) => (
              <section
                key={`${block.type}-${blockIndex}`}
                className={`about-content-block about-content-block-${block.type}`}
              >
                <div className="about-content-symbol" aria-hidden="true">
                  {block.symbol}
                </div>
                <div className="about-content-panel">
                  {block.title && <h3>{block.title}</h3>}
                  <div className="about-content-lines">
                    {block.lines.map((line, lineIndex) => {
                      const { label, text } = splitLabelText(line);

                      return (
                        <p key={`${line.slice(0, 24)}-${lineIndex}`} className="about-content-line">
                          {label && <strong>{label}</strong>}
                          {text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
