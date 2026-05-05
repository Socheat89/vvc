import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

export default function Home() {
  const { language } = useLanguage();
  const t = translations.home;

  const features = [
    { icon: '🚚', titleKey: 'feature1Title', descKey: 'feature1Desc' },
    { icon: '✓',  titleKey: 'feature2Title', descKey: 'feature2Desc' },
    { icon: '💬', titleKey: 'feature3Title', descKey: 'feature3Desc' },
  ];

  return (
    <div className="mesh-bg">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
        <div className="reveal">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t.tagline[language]}</p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
            {t.heroTitle[language]}
            <span className="block text-[var(--ember)]">{t.heroTitleSpan[language]}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">{t.heroDesc[language]}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/products" className="btn-primary">{t.browseAtlas[language]}</Link>
            <Link to="/products" className="btn-secondary">{t.newArrivals[language]}</Link>
          </div>
        </div>

        <div className="relative">
          <div className="glass-card reveal reveal-delay-1 rounded-3xl p-8">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t.featuredDrop[language]}</span>
              <span>{t.edition[language]}</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold">{t.featuredTitle[language]}</h2>
            <p className="mt-3 text-sm text-slate-600">{t.featuredDesc[language]}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="text-lg font-semibold text-[var(--teal)]">2.4k</div>
                <div>{t.wishlistSaves[language]}</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="text-lg font-semibold text-[var(--ember)]">12</div>
                <div>{t.makerStudios[language]}</div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 hidden w-40 rotate-[-6deg] rounded-3xl border border-white/70 bg-white/80 p-4 text-xs text-slate-600 shadow-xl md:block">
            <div className="text-sm font-semibold text-slate-700">{t.nextDispatch[language]}</div>
            <div className="mt-2">{t.releaseWindow[language]}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className={`glass-card reveal rounded-3xl p-6 ${index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : ''}`}
            >
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-4 text-2xl font-semibold">{t[feature.titleKey][language]}</h3>
              <p className="mt-3 text-sm text-slate-600">{t[feature.descKey][language]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
