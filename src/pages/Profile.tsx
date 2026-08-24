import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Shield,
  CheckCircle2,
  ChevronRight,
  History,
  MapPin,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { voucherService } from '@/services/voucherService';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [donationPoint, setDonationPoint] = useState(0);

  useEffect(() => {
    setMounted(true);

    import('@/services/api').then(({ default: apiClient }) => {
      apiClient
        .get<unknown, any[]>('/profiles')
        .then((res) => {
          if (res && res.length > 0) {
            setProfileData(res[0]);
          }
        })
        .catch(() => {});
    });

    voucherService
      .pointSummary()
      .then((summary) => setDonationPoint(summary.donationPoint))
      .catch(() => setDonationPoint(0));
  }, []);

  // Temporarily disabled auth block for UI preview
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  const displayName =
    profileData?.fullName || user?.fullName || user?.userName || 'Thành viên ReThreads';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`profile-container container ${mounted ? 'is-mounted' : ''}`}>
      {/* Background ambient orbs */}
      <div className="ambient-glow orb-1"></div>
      <div className="ambient-glow orb-2"></div>

      {/* Main Bento Grid */}
      <div className="profile-bento-grid">
        {/* Card 1: Main User Card */}
        <div className="bento-card col-span-2 card-shell card-fade-up delay-1">
          <div className="card-core profile-main-card">
            <div className="profile-header-info">
              <div className="avatar-wrapper">
                <div className="avatar-ring-outer">
                  <div className="avatar-ring-inner">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="user-profile-avatar" />
                    ) : (
                      <span className="avatar-initials">{initials || 'RT'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="identity-details">
                <span className="eyebrow-tag">
                  <Shield size={10} style={{ marginRight: 4 }} />
                  {user?.role || 'Thành viên'}
                </span>
                <h1 className="profile-name">{displayName}</h1>
                <p className="profile-username">@{user?.userName || 'thanhvien'}</p>
                <div className="profile-badges-row">
                  <span className="badge-pill mini-badge">
                    <CheckCircle2 size={12} className="text-primary" />
                    Đã xác minh
                  </span>
                </div>
                <button type="button" className="btn-logout-pill" onClick={handleLogout}>
                  <span className="btn-icon-circle">
                    <LogOut size={15} />
                  </span>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Donation Score Card */}
        <div className="bento-card col-span-1 card-shell card-fade-up delay-2">
          <div className="card-core score-bento-card">
            <span className="eyebrow-tag">Tác động xanh</span>
            <h3>Điểm đóng góp</h3>

            <div className="score-main-display">
              <div className="leaf-glow-icon">
                <Leaf size={40} className="leaf-icon" />
              </div>
              <div className="score-numbers">
                <span className="score-count text-gradient">
                  {donationPoint.toLocaleString('vi-VN')}
                </span>
                <span className="score-unit">Điểm xanh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Navigation Islands */}
        <div className="bento-card col-span-3 card-shell card-fade-up delay-3">
          <div className="card-core nav-islands-card">
            <span className="eyebrow-tag">Tiện ích nhanh</span>
            <h3>Lối tắt</h3>

            <div className="nav-islands-list">
              <Link to="/products" className="nav-island-item">
                <div className="island-icon">
                  <Leaf size={18} />
                </div>
                <div className="island-meta">
                  <h4>Quyên góp mới</h4>
                  <p>Bắt đầu quyên góp quần áo</p>
                </div>
                <div className="island-action">
                  <ChevronRight size={16} />
                </div>
              </Link>

              <Link to="/my-orders" className="nav-island-item">
                <div className="island-icon">
                  <History size={18} />
                </div>
                <div className="island-meta">
                  <h4>Lịch sử quyên góp</h4>
                  <p>Quản lý các đơn của tôi</p>
                </div>
                <div className="island-action">
                  <ChevronRight size={16} />
                </div>
              </Link>

              <Link to="/map" className="nav-island-item">
                <div className="island-icon">
                  <MapPin size={18} />
                </div>
                <div className="island-meta">
                  <h4>Điểm thu gom</h4>
                  <p>Tìm vị trí bưu cục gần bạn</p>
                </div>
                <div className="island-action">
                  <ChevronRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
