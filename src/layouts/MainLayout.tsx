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
      <Header />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
};
export default MainLayout;
