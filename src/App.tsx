import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './routes/ScrollToTop';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
