import React, { useEffect, useState } from 'react';
import {
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Home,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  getCurrentUserProfileApi,
  type CurrentUserProfile,
} from '@/services/authService';
import '@/styles/ops-shared.css';
import './Profile.css';

const roleLabels: Record<string, string> = {
  Admin: 'Quản trị viên',
  Manager: 'Điều phối viên',
  ReceivingStaff: 'Nhân viên tiếp nhận',
  ClassificationStaff: 'Nhân viên phân loại',
  WarehouseStaff: 'Nhân viên kho',
};

export const StaffProfile: React.FC = () => {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      setProfile(await getCurrentUserProfileApi());
    } catch {
      setError('Không thể tải hồ sơ cá nhân. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="ops-page">
        <div className="ops-empty">
          <span className="ops-spinner" />
          <h4>Đang tải hồ sơ...</h4>
        </div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="ops-page">
        <div className="ops-empty">
          <UserRound size={38} strokeWidth={1.5} />
          <h4>{error || 'Không tìm thấy hồ sơ'}</h4>
          <button type="button" className="ops-btn ops-btn-secondary" onClick={loadProfile}>
            <RefreshCw size={15} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="ops-page staff-profile-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Tài khoản cá nhân</span>
          <h1>Hồ sơ của tôi</h1>
          <p>Thông tin tài khoản, liên hệ và nơi làm việc đang được cấu hình trên hệ thống.</p>
        </div>
      </header>

      <section className="staff-profile-hero">
        <div className="staff-profile-avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} /> : initials}
        </div>
        <div className="staff-profile-identity">
          <span>{roleLabels[profile.role] || profile.role}</span>
          <h2>{profile.fullName}</h2>
          <p><AtSign size={15} /> {profile.userName}</p>
        </div>
        <div className="staff-profile-state">
          <BadgeCheck size={18} />
          {profile.status === 'Active' ? 'Tài khoản đang hoạt động' : profile.status}
        </div>
      </section>

      <div className="staff-profile-grid">
        <section className="ops-panel staff-profile-panel">
          <div className="staff-profile-panel-title">
            <UserRound size={19} />
            <div><span>Thông tin chung</span><h3>Thông tin cá nhân</h3></div>
          </div>
          <div className="staff-profile-fields">
            <div><Mail size={17} /><span>Email</span><strong>{profile.email}</strong></div>
            <div><Phone size={17} /><span>Số điện thoại</span><strong>{profile.phoneNumber}</strong></div>
            <div><Home size={17} /><span>Địa chỉ</span><strong>{profile.address || 'Chưa cập nhật'}</strong></div>
            <div>
              <CalendarDays size={17} />
              <span>Ngày tạo tài khoản</span>
              <strong>
                {profile.createAt
                  ? new Date(profile.createAt).toLocaleDateString('vi-VN')
                  : 'Không có dữ liệu'}
              </strong>
            </div>
          </div>
        </section>

        <section className="ops-panel staff-profile-panel">
          <div className="staff-profile-panel-title">
            <Building2 size={19} />
            <div><span>Phân công hiện tại</span><h3>Nơi làm việc</h3></div>
          </div>
          <div className="staff-profile-warehouse">
            <span className="staff-profile-warehouse-icon"><Building2 size={24} /></span>
            <div>
              <span>Kho phụ trách</span>
              <strong>{profile.warehouseName || 'Chưa được phân kho'}</strong>
              <p><MapPin size={14} /> {profile.warehouseAddress || 'Chưa có địa chỉ kho'}</p>
            </div>
          </div>
          <div className="staff-profile-role">
            <ShieldCheck size={18} />
            <div><span>Vai trò hệ thống</span><strong>{roleLabels[profile.role] || profile.role}</strong></div>
          </div>
        </section>
      </div>

      <section className="ops-panel staff-profile-panel">
        <div className="staff-profile-panel-title">
          <ShieldCheck size={19} />
          <div><span>Bảo mật</span><h3>Trạng thái xác minh</h3></div>
        </div>
        <div className="staff-profile-verifications">
          <div className={profile.emailConfirmed ? 'verified' : ''}>
            <CheckCircle2 size={20} />
            <span>Email</span>
            <strong>{profile.emailConfirmed ? 'Đã xác minh' : 'Chưa xác minh'}</strong>
          </div>
          <div className={profile.phoneNumberConfirmed ? 'verified' : ''}>
            <CheckCircle2 size={20} />
            <span>Số điện thoại</span>
            <strong>{profile.phoneNumberConfirmed ? 'Đã xác minh' : 'Chưa xác minh'}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StaffProfile;
