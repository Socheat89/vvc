import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCircleInfo,
  faComments,
  faLightbulb,
  faListCheck,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';
import { productService } from '../../services/api';
import ProductImage from '../../components/ProductImage';

export default function Home() {
  const { language } = useLanguage();
  const t = translations.home;
  const [highlightProducts, setHighlightProducts] = useState([]);

  const copy = language === 'kh'
    ? {
        heroKicker: 'ជ្រើសរើសឲ្យសម ត្រឹមត្រូវ តាមតម្រូវការ',
        title: 'ស្វែងរកផលិតផលល្អបំផុត',
        titleAccent: 'សម្រាប់អ្នកគ្រប់របៀបរស់នៅ',
        heroDesc: 'មើលម៉ូឌែលពេញនិយម រូបភាពច្បាស់ និងព័ត៌មានលម្អិត ឲ្យអ្នកជ្រើសរើសបានងាយ និងមានទំនុកចិត្ត។',
        noticeLabel: 'ព័ត៌មានសំខាន់',
        noticeText: 'យើងផ្តោតលើការបង្ហាញ និងណែនាំផលិតផលឲ្យច្បាស់លាស់ ដើម្បីជួយអ្នកសម្រេចចិត្តបានលឿន។',
        panelTitle: 'ចាប់ផ្តើមស្វែងរកបានភ្លាម',
        panelDesc: 'រកតាមប្រភេទ ប្រៀបធៀបលក្ខណៈ និងទទួលបានគន្លឹះណែនាំ មុនជ្រើសរើសផលិតផលដែលសមបំផុត។',
        panelStatOne: 'Top Picks',
        panelStatOneDesc: 'ផលិតផលពេញនិយម និងគុណភាពល្អ',
        panelStatTwo: 'Smart Guide',
        panelStatTwoDesc: 'ណែនាំជម្រើសតាមតម្រូវការ',
        infoBadge: 'អ្វីដែលអ្នកទទួលបាន',
        sectionKicker: 'ហេតុអ្វីជ្រើស Van Van Cambodia',
        sectionTitle: 'បទពិសោធន៍ស្វែងរកដែលងាយស្រួល',
        sectionDesc: 'រៀបចំព័ត៌មានឲ្យខ្លី ច្បាស់ និងងាយយល់ ដើម្បីឲ្យអ្នកសម្រេចចិត្តបានលឿនជាងមុន។',
        cardOneTitle: 'ព័ត៌មានលម្អិតច្បាស់',
        cardOneDesc: 'មើលរូបភាព ពិពណ៌នា និងលក្ខណៈសម្បត្តិសំខាន់ៗ ក្នុងមួយកន្លែង។',
        cardTwoTitle: 'ណែនាំត្រឹមត្រូវ',
        cardTwoDesc: 'ទទួលបានគន្លឹះជ្រើសរើសដែលសមនឹងការប្រើប្រាស់ពិតប្រាកដរបស់អ្នក។',
        cardThreeTitle: 'សម្រេចចិត្តលឿន',
        cardThreeDesc: 'បន្ថយពេលស្វែងរក ដោយមានព័ត៌មានចាំបាច់គ្រប់គ្រាន់មុនទំនាក់ទំនងបន្ត។',
        highlightTag: 'ផលិតផលកំពុងពេញនិយម',
      }
    : {
        heroKicker: 'Find Your Best-Fit Product',
        title: 'Discover quality products',
        titleAccent: 'chosen for real needs',
        heroDesc: 'Explore popular models with clear photos and practical details so you can choose faster with confidence.',
        noticeLabel: 'Good to Know',
        noticeText: 'We focus on clear product showcasing and guidance to help you make confident decisions quickly.',
        panelTitle: 'Start exploring in seconds',
        panelDesc: 'Filter by category, compare key specs, and get useful guidance before choosing your best-fit product.',
        panelStatOne: 'Top Picks',
        panelStatOneDesc: 'Popular and quality-focused items',
        panelStatTwo: 'Smart Guide',
        panelStatTwoDesc: 'Recommendations by real needs',
        infoBadge: 'What you get here',
        sectionKicker: 'Why choose Van Van Cambodia',
        sectionTitle: 'A smoother way to discover products',
        sectionDesc: 'We organize product info into clear, practical highlights so you can decide with less effort.',
        cardOneTitle: 'Clear product details',
        cardOneDesc: 'See photos, descriptions, and core specs in one place.',
        cardTwoTitle: 'Practical guidance',
        cardTwoDesc: 'Get recommendations that match your use case and priorities.',
        cardThreeTitle: 'Faster decisions',
        cardThreeDesc: 'Shortlist confidently with focused information before contacting the team.',
        highlightTag: 'Trending Product Highlights',
      };

  useEffect(() => {
    let isMounted = true;

    const fetchHighlightProducts = async () => {
      try {
        const response = await productService.getAll();
        const items = Array.isArray(response?.data?.data) ? response.data.data : [];
        const prioritized = [...items]
          .filter((item) => item && item.name)
          .sort((a, b) => {
            const stockDelta = Number(Boolean(b.stock > 0)) - Number(Boolean(a.stock > 0));
            if (stockDelta !== 0) return stockDelta;
            return (b.id ?? 0) - (a.id ?? 0);
          })
          .slice(0, 8);

        if (isMounted) setHighlightProducts(prioritized);
      } catch (err) {
        console.error('Failed to load highlight products:', err);
        if (isMounted) setHighlightProducts([]);
      }
    };

    fetchHighlightProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackHighlights = useMemo(
    () => (language === 'kh'
      ? [
          'ជម្រើសថ្មីពេញនិយម',
          'ផលិតផលគុណភាពខ្ពស់',
          'ម៉ូឌែលលក់ដាច់',
          'ជម្រើសសម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ',
        ]
      : [
          'Popular New Picks',
          'Quality-First Products',
          'Best-Selling Models',
          'Everyday Essentials',
        ]),
    [language],
  );

  const highlightItems = useMemo(() => {
    if (!highlightProducts.length) {
      return fallbackHighlights.map((name, index) => ({
        id: `fallback-${index}`,
        name,
        url: '/products',
        image: '',
        category: copy.highlightTag,
      }));
    }

    return highlightProducts.map((item) => ({
      id: item.id,
      name: item.name,
      url: `/products/${item.id}`,
      image: item.image,
      category: item.category?.name,
    }));
  }, [copy.highlightTag, fallbackHighlights, highlightProducts]);

  const highlightTrackA = useMemo(() => {
    if (!highlightItems.length) return [];
    const minimumVisibleCards = 24;
    const repeatCount = Math.ceil(minimumVisibleCards / highlightItems.length);
    return Array.from({ length: repeatCount }, () => highlightItems).flat();
  }, [highlightItems]);

  const pillars = [
    { icon: faMagnifyingGlass, title: copy.cardOneTitle, desc: copy.cardOneDesc },
    { icon: faLightbulb, title: copy.cardTwoTitle, desc: copy.cardTwoDesc },
    { icon: faComments, title: copy.cardThreeTitle, desc: copy.cardThreeDesc },
  ];

  return (
    <div className="wave-page">
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
        <div className="reveal">
          <p className="wave-kicker">{copy.heroKicker}</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight md:text-6xl">
            {copy.title}
            <span className="block text-[var(--teal)]">{copy.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-700">{copy.heroDesc}</p>

          <div className="wave-notice mt-7">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--teal)]" />
            <p className="text-sm leading-relaxed text-slate-700">
              <strong>{copy.noticeLabel}: </strong>
              {copy.noticeText}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/products" className="btn-primary">
              {t.browseAtlas[language]}
              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
            </Link>
            <Link to="/products" className="btn-secondary">
              {t.newArrivals[language]}
            </Link>
          </div>
        </div>

        <div className="wave-panel reveal reveal-delay-1">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{t.tagline[language]}</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">{copy.panelTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.panelDesc}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="wave-stat-card">
              <div className="text-base font-semibold text-[var(--ember)]">{copy.panelStatOne}</div>
              <p className="mt-1 text-xs text-slate-600">{copy.panelStatOneDesc}</p>
            </div>
            <div className="wave-stat-card">
              <div className="text-base font-semibold text-[var(--teal)]">{copy.panelStatTwo}</div>
              <p className="mt-1 text-xs text-slate-600">{copy.panelStatTwoDesc}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--ring)] bg-white/80 p-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
              <FontAwesomeIcon icon={faListCheck} className="h-4 w-4 text-[var(--ember)]" />
              {copy.infoBadge}
            </span>
            <p className="mt-2">{copy.noticeText}</p>
          </div>
        </div>
      </section>

      <div className="wave-divider-wrap">
        <div className="wave-highlight-lanes" aria-label={copy.highlightTag}>
          <div className="wave-highlight-lane">
            <div className="wave-highlight-track">
              {highlightTrackA.map((item, index) => (
                <Link key={`${item.id}-a-${index}`} to={item.url} className="wave-highlight-card">
                  <span className="wave-highlight-thumb">
                    <ProductImage
                      src={item.image}
                      name={item.name}
                      category={item.category}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </Link>
              ))}
            </div>
            <div className="wave-highlight-track wave-highlight-track-copy" aria-hidden="true">
              {highlightTrackA.map((item, index) => (
                <Link key={`${item.id}-b-${index}`} to={item.url} className="wave-highlight-card" tabIndex={-1}>
                  <span className="wave-highlight-thumb">
                    <ProductImage
                      src={item.image}
                      name={item.name}
                      category={item.category}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="wave-divider" aria-hidden="true">
          <svg viewBox="0 0 3200 240" preserveAspectRatio="none">
            <g className="wave-track wave-track-back">
              <path className="wave-divider-soft" d="M0,92 C220,32 410,36 648,92 C888,148 1088,150 1320,92 C1466,56 1546,58 1600,92 L1600,240 L0,240 Z" />
              <path className="wave-divider-soft" d="M1600,92 C1820,32 2010,36 2248,92 C2488,148 2688,150 2920,92 C3066,56 3146,58 3200,92 L3200,240 L1600,240 Z" />
            </g>
            <g className="wave-track wave-track-front">
              <path className="wave-divider-solid" d="M0,136 C226,88 438,94 682,136 C928,178 1104,178 1338,136 C1488,108 1560,108 1600,136 L1600,240 L0,240 Z" />
              <path className="wave-divider-solid" d="M1600,136 C1826,88 2038,94 2282,136 C2528,178 2704,178 2938,136 C3088,108 3160,108 3200,136 L3200,240 L1600,240 Z" />
            </g>
          </svg>
        </div>
      </div>

      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-8">
        <div className="mx-auto mb-10 max-w-2xl text-center reveal">
          <p className="wave-kicker">{copy.sectionKicker}</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-900">{copy.sectionTitle}</h2>
          <p className="mt-4 text-slate-600">{copy.sectionDesc}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item, index) => (
            <article
              key={item.title}
              className={`wave-feature-card reveal ${index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : ''}`}
            >
              <span className="wave-icon-wrap">
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5 text-[var(--ember)]" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
