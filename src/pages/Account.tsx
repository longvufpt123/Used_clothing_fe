import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Award, ClipboardList, Leaf, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import './Account.css';

export const Account: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const displayName = user?.fullName || user?.userName || 'Thành viên ReThreads';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="account-page container">
      <section className="account-hero glass">
        <div className="account-identity">
          <div className="account-avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} /> : <span>{initials || 'RT'}</span>}
          </div>
          <div>
            <span className="section-subtitle">Tài khoản của tôi</span>
            <h1>{displayName}</h1>
            <p>Theo dõi hồ sơ, điểm đóng góp và lịch sử quyên góp của bạn tại ReThreads.</p>
          </div>
        </div>
        <Link to="/my-orders">
          <Button>
            Xem đơn của tôi <ClipboardList size={17} style={{ marginLeft: 8 }} />
          </Button>
        </Link>
      </section>

      <section className="account-grid">
        <div className="account-panel glass">
          <h2>Thông tin hồ sơ</h2>
          <div className="profile-list">
            <div className="profile-row">
              <UserRound size={18} />
              <div>
                <span>Họ tên</span>
                <strong>{user?.fullName || 'Chưa cập nhật'}</strong>
              </div>
            </div>
            <div className="profile-row">
              <ShieldCheck size={18} />
              <div>
                <span>Tên đăng nhập</span>
                <strong>{user?.userName}</strong>
              </div>
            </div>
            <div className="profile-row">
              <Award size={18} />
              <div>
                <span>Vai trò</span>
                <strong>{user?.role}</strong>
              </div>
            </div>
            <div className="profile-row muted">
              <Mail size={18} />
              <div>
                <span>Email / Số điện thoại</span>
                <strong>Chưa có trong dữ liệu đăng nhập</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="account-panel glass">
          <h2>Điểm số quyên góp</h2>
          <div className="donation-score-card">
            <Leaf size={34} />
            <div>
              <span className="score-value">0</span>
              <span className="score-label">điểm xanh</span>
            </div>
          </div>
          <p className="account-note">
            Điểm số sẽ được cập nhật khi backend cung cấp dữ liệu tổng hợp đóng góp của tài khoản.
          </p>
          <Link to="/leaderboard" className="account-text-link">Xem bảng vàng</Link>
        </div>
      </section>
    </div>
  );
};

export default Account;