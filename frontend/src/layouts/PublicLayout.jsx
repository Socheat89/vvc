import React, { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PublicLayout() {
  const location = useLocation();
  const isProductDetail = /^\/products\/[^/]+/.test(location.pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    root.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    root.scrollTop = 0;
    body.scrollTop = 0;

    const frame = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousRootScrollBehavior;
      body.style.scrollBehavior = previousBodyScrollBehavior;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow public-main ${isProductDetail ? 'public-main-product-detail' : ''}`}>
        <div key={`${location.pathname}${location.search}`} className="page-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
