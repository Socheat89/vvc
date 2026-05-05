import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import logo from '../../assets/logo.png';

export default function About() {
  const { language } = useLanguage();
  const t = translations.aboutPage;

  const chips = ['chipStory', 'chipQuality', 'chipCare', 'chipTrust'];
  const stats = [
    { value: t.stat1Value[language], label: t.stat1Label[language] },
    { value: t.stat2Value[language], label: t.stat2Label[language] },
    { value: t.stat3Value[language], label: t.stat3Label[language] },
    { value: t.stat4Value[language], label: t.stat4Label[language] },
  ];
  const values = [
    { titleKey: 'value1Title', descKey: 'value1Desc' },
    { titleKey: 'value2Title', descKey: 'value2Desc' },
    { titleKey: 'value3Title', descKey: 'value3Desc' },
  ];
  const process = [
    { number: '01', titleKey: 'process1Title', descKey: 'process1Desc' },
    { number: '02', titleKey: 'process2Title', descKey: 'process2Desc' },
    { number: '03', titleKey: 'process3Title', descKey: 'process3Desc' },
    { number: '04', titleKey: 'process4Title', descKey: 'process4Desc' },
  ];

  return (
    <div className="about-page">
      <section className="about-hero mx-auto max-w-6xl px-4">
        <div className="about-hero-copy reveal">
          <span className="pill">{t.tagline[language]}</span>
          <h1>
            {t.title[language]}
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

        <div className="about-identity reveal reveal-delay-1" aria-label={t.brandNote[language]}>
          <div className="about-identity-board">
            <div className="about-brand-core">
              <div className="about-logo-frame">
                <img src={logo} alt="Van Van Cambodia" />
              </div>
              <div>
                <span>{t.brandNote[language]}</span>
                <strong>{t.identityTitle[language]}</strong>
                <p>{t.identityDesc[language]}</p>
              </div>
            </div>

            <div className="about-chip-grid">
              {chips.map((chip, index) => (
                <div key={chip} className={`about-chip about-chip-${index + 1}`}>
                  <span />
                  {t[chip][language]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="about-stat-strip reveal reveal-delay-2">
          {stats.map((stat) => (
            <div key={stat.label} className="about-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
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

      <section className="about-process-section">
        <div className="mx-auto max-w-6xl px-4">
          <div className="about-process-header reveal">
            <span>{t.processKicker[language]}</span>
            <h2>{t.processTitle[language]}</h2>
          </div>

          <div className="about-process-list">
            {process.map((item) => (
              <article key={item.number} className="about-process-step">
                <strong>{item.number}</strong>
                <h3>{t[item.titleKey][language]}</h3>
                <p>{t[item.descKey][language]}</p>
              </article>
            ))}
          </div>
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
