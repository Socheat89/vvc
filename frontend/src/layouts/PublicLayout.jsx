import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PublicLayout() {
  const location = useLocation();
  const isProductDetail = /^\/products\/[^/]+/.test(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow public-main ${isProductDetail ? 'public-main-product-detail' : ''}`}>
        <div key={location.pathname} className="page-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
