import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './ReceivingLayout.css';

interface ReceivingLayoutProps {
  children: React.ReactNode;
}

export const ReceivingLayout: React.FC<ReceivingLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isShiftActive, setIsShiftActive] = useState(
    () => localStorage.getItem('receiving_shift_active') === 'true',
  );

  useEffect(() => {
    const syncShiftStatus = () => {
      setIsShiftActive(localStorage.getItem('receiving_shift_active') === 'true');
    };

    window.addEventListener('storage', syncShiftStatus);
    return () => window.removeEventListener('storage', syncShiftStatus);
  }, []);

  return (
    <div className="receiving-layout">
      {/* Top Header */}
      <header className="receiving-header glass">
        <div className="receiving-header-container">
          <div className="header-left" onClick={() => navigate('/receiving')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon text-gradient">
              <Sparkles size={20} />
            </span>
            <span className="logo-text text-gradient font-sans">GreenThread Staff</span>
          </div>

          <div className="header-right">
            {isShiftActive && (
              <span className="shift-indicator-badge">
                <span className="ping-dot"></span>
                Đang trong ca
              </span>
            )}
            
            <div className="user-profile-summary">
              <div className="user-avatar-circle">
                <User size={16} />
              </div>
              <span className="user-name-label">{user?.fullName || 'Nhân viên Tiếp nhận'}</span>
            </div>

            <button 
              className="receiving-logout-btn" 
              onClick={handleLogout} 
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="receiving-main-container">
        {children}
      </main>
    </div>
  );
};

export default ReceivingLayout;
