import React from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { WatchPage } from './pages/WatchPage.tsx';
import { ShortsPage } from './pages/ShortsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { OwnerAuthPage } from './pages/owner/OwnerAuthPage.tsx';
import { OwnerDashboard } from './pages/owner/OwnerDashboard.tsx';

const PublicLayout: React.FC = () => (
  <div className="flex min-h-screen flex-col bg-[#F7F5F0] text-[#171717] dark:bg-[#090909] dark:text-[#F4F1EB]">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Private Owner Routes */}
          <Route path="/owner/setup" element={<OwnerAuthPage mode="setup" />} />
          <Route path="/owner/login" element={<OwnerAuthPage mode="login" />} />
          <Route path="/owner" element={<OwnerDashboard />} />

          {/* Public Editorial Website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/documentaries" element={<CatalogPage preset="documentaries" />} />
            <Route path="/mysteries" element={<CatalogPage preset="mysteries" />} />
            <Route path="/real-stories" element={<CatalogPage preset="real-stories" />} />
            <Route path="/shorts" element={<ShortsPage />} />
            <Route path="/watch/:slug" element={<WatchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
