import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Shield, CheckCircle2, ChevronRight, Award, History, MapPin, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Temporarily disabled auth block for UI preview
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  const displayName = user?.fullName || user?.userName || 'Thành viên ReThreads';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

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
                <p className="profile-username">@{user?.userName || 'username'}</p>
                <div className="profile-badges-row">
                  <span className="badge-pill mini-badge">
                    <CheckCircle2 size={12} className="text-primary" />
                    Đã xác minh
                  </span>
                  <span className="badge-pill mini-badge">
                    <Award size={12} />
                    Hạng Bạc
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Donation Score Card */}
        <div className="bento-card col-span-1 card-shell card-fade-up delay-2">
          <div className="card-core score-bento-card">
            <span className="eyebrow-tag">Eco Impact</span>
            <h3>Điểm đóng góp</h3>
            
            <div className="score-main-display">
              <div className="leaf-glow-icon">
                <Leaf size={40} className="leaf-icon" />
              </div>
              <div className="score-numbers">
                <span className="score-count text-gradient">240</span>
                <span className="score-unit">Điểm xanh</span>
              </div>
            </div>

            <div className="score-bar-container">
              <div className="score-bar-header">
                <span>Cấp độ tiếp theo (Vàng)</span>
                <span>240/500</span>
              </div>
              <div className="score-progress-track">
                <div className="score-progress-bar" style={{ width: '48%' }}></div>
              </div>
            </div>
            
            <p className="score-tip">Bạn đã giảm thiểu khoảng 36kg khí thải CO2 ra môi trường bằng việc quyên góp quần áo.</p>
          </div>
        </div>

        {/* Card 3: Quick Navigation Islands */}
        <div className="bento-card col-span-1 card-shell card-fade-up delay-3">
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

        {/* Card 4: Detailed Account Details & Achievements */}
        <div className="bento-card col-span-2 card-shell card-fade-up delay-4">
          <div className="card-core achievements-card">
            <span className="eyebrow-tag">Hành trình xanh</span>
            <h3>Thành tựu đạt được</h3>

            <div className="achievements-grid">
              <div className="achievement-item active">
                <div className="achievement-badge-icon">
                  <Compass size={24} />
                </div>
                <div className="achievement-details">
                  <h4>Người tiên phong</h4>
                  <p>Tham gia quyên góp lần đầu tiên tại hệ thống ReThreads.</p>
                </div>
              </div>

              <div className="achievement-item active">
                <div className="achievement-badge-icon">
                  <Leaf size={24} />
                </div>
                <div className="achievement-details">
                  <h4>Đại sứ xanh</h4>
                  <p>Đạt mốc 100 điểm tích lũy bảo vệ môi trường xanh.</p>
                </div>
              </div>

              <div className="achievement-item locked">
                <div className="achievement-badge-icon">
                  <Award size={24} />
                </div>
                <div className="achievement-details">
                  <h4>Nhà phân loại thông thái</h4>
                  <p>Phân loại đúng chất liệu cho 10 đơn quyên góp liên tục (Khóa).</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
