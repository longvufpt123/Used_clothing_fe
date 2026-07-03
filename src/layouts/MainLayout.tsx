import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
      <Header />
      <main id="main-content" className="layout-main">{children}</main>
      <Footer />
    </div>
  );
};
export default MainLayout;
