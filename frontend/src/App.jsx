import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';
import ProductList from './pages/public/ProductList';
import ProductDetail from './pages/public/ProductDetail';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageCategories from './pages/admin/ManageCategories';
import ManageUsers from './pages/admin/ManageUsers';
import ManageTranslations from './pages/admin/ManageTranslations';
import ManageBanners from './pages/admin/ManageBanners';
import ManageSystem from './pages/admin/ManageSystem';
import ManageSettings from './pages/admin/ManageSettings';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';

export default function App() {
  return (
    <LanguageProvider>
      <SiteSettingsProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/:id" element={<ProductDetail />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="banners" element={<ManageBanners />} />
              <Route path="translations" element={<ManageTranslations />} />
              <Route path="settings" element={<ManageSettings />} />
              <Route path="system" element={<ManageSystem />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SiteSettingsProvider>
    </LanguageProvider>
  );
}
