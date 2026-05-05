import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import logo from '../../assets/logo.png';

export default function Home() {
  const { language } = useLanguage();
  const t = translations.home;

  const principles = [
    { step: '01', titleKey: 'feature1Title', descKey: 'feature1Desc' },
    { step: '02', titleKey: 'feature2Title', descKey: 'feature2Desc' },
    { step: '03', titleKey: 'feature3Title', descKey: 'feature3Desc' },
  ];

  const meaningChips = ['chipStory', 'chipQuality', 'chipGuidance'];

  const passportPoints = [
    { titleKey: 'passportStory', descKey: 'passportStoryDesc' },
    { titleKey: 'passportQuality', descKey: 'passportQualityDesc' },
    { titleKey: 'passportUse', descKey: 'passportUseDesc' },
    { titleKey: 'passportCare', descKey: 'passportCareDesc' },
  ];

  return (
    <div className="home-intro mesh-bg">
      <section className="home-hero-section">
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-6xl items-center gap-10 px-4 pb-44 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:pb-48 lg:pt-14">
          <div className="relative z-10 reveal">
            <span className="pill">{t.tagline[language]}</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-[var(--coal)] sm:text-5xl lg:text-6xl">
              {t.heroTitle[language]}{' '}
              <span className="block text-[var(--gold)]">{t.heroTitleSpan[language]}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              {t.heroDesc[language]}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/products" className="btn-primary">
                {t.browseAtlas[language]}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#product-story" className="btn-secondary">
                {t.newArrivals[language]}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="home-meaning-chips">
              {meaningChips.map((chip) => (
                <div key={chip} className="home-meaning-chip">
                  <span />
                  {t[chip][language]}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 reveal reveal-delay-1">
            <div className="home-showcase glass-card rounded-lg p-5">
              <div className="home-showcase-meta">
                <span>{t.featuredDrop[language]}</span>
                <span>{t.edition[language]}</span>
              </div>

              <div className="mt-5">
                <div className="home-showcase-title-row">
                  <div className="home-logo-mark">
                    <img src={logo} alt="Van Van Cambodia" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--coal)] md:text-2xl">
                      {t.featuredTitle[language]}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{t.featuredDesc[language]}</p>
                  </div>
                </div>

                <div className="home-product-preview mt-5">
                  <div className="home-product-core">
                    <span>VVC</span>
                    <strong>Atlas</strong>
                    <small>{t.passportBadge[language]}</small>
                  </div>
                </div>

                <div className="home-passport-points">
                  {passportPoints.map((point) => (
                    <div key={point.titleKey} className="home-passport-point">
                      <span className="home-passport-dot" />
                      <div>
                        <strong>{t[point.titleKey][language]}</strong>
                        <p>{t[point.descKey][language]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="home-note">
                <div className="text-sm font-semibold text-slate-800">{t.nextDispatch[language]}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{t.releaseWindow[language]}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="home-wave-ui" aria-hidden="true">
          <svg className="home-wave home-wave-back" viewBox="0 0 1440 260" preserveAspectRatio="none">
            <path d="M0,118 C170,178 270,46 440,104 C610,162 725,206 900,132 C1060,64 1186,92 1440,132 L1440,260 L0,260 Z" />
          </svg>
          <svg className="home-wave home-wave-mid" viewBox="0 0 1440 260" preserveAspectRatio="none">
            <path d="M0,156 C160,94 300,92 460,150 C620,208 740,194 910,126 C1080,58 1240,88 1440,152 L1440,260 L0,260 Z" />
          </svg>
          <svg className="home-wave home-wave-front" viewBox="0 0 1440 260" preserveAspectRatio="none">
            <path d="M0,188 C180,126 320,132 480,180 C650,232 790,220 960,164 C1130,106 1280,126 1440,180 L1440,260 L0,260 Z" />
          </svg>
        </div>
      </section>

      <section id="product-story" className="home-story-section mx-auto max-w-6xl px-4 pb-16 pt-14">
        <div className="home-guide-header reveal">
          <span className="home-guide-kicker">{t.guideTagline[language]}</span>
          <h2>{t.guideTitle[language]}</h2>
          <p>{t.guideDesc[language]}</p>
        </div>

        <div className="home-guide-map reveal reveal-delay-1">
          {principles.map((feature, index) => (
            <article
              key={feature.step}
              className={`home-guide-step ${index === 1 ? 'home-guide-step-lower' : ''}`}
            >
              <div className="home-guide-pin">
                <span>{feature.step}</span>
              </div>
              <div className="home-guide-card">
                <div className="home-guide-card-meta">{t.guideStep[language]} {feature.step}</div>
                <h3>{t[feature.titleKey][language]}</h3>
                <p>{t[feature.descKey][language]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
