import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { PlusCircle, Calendar, Target, Megaphone } from 'lucide-react';
import './Campaigns.css';

interface CampaignItem {
  id: number;
  name: string;
  targetWeight: number; // kg
  collectedWeight: number; // kg
  deadline: string;
  status: 'active' | 'completed';
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  { id: 1, name: 'Áo ấm mùa đông - Hà Giang 2026', targetWeight: 1000, collectedWeight: 850, deadline: '2026-11-30', status: 'active' },
  { id: 2, name: 'Dự án Sợi Tái Sinh ReThreads', targetWeight: 5000, collectedWeight: 3890, deadline: '2026-12-31', status: 'active' },
  { id: 3, name: 'Đồng phục tới trường - Tây Nguyên', targetWeight: 800, collectedWeight: 800, deadline: '2026-06-30', status: 'completed' },
];

export const Campaigns: React.FC = () => {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  
  // Form states
  const [name, setName] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetWeight || !deadline) {
      toast.error('Vui lòng điền đầy đủ thông tin chiến dịch!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newCamp: CampaignItem = {
        id: Date.now(),
        name,
        targetWeight: parseInt(targetWeight, 10),
        collectedWeight: 0,
        deadline,
        status: 'active',
      };

      setCampaigns(prev => [newCamp, ...prev]);
      setLoading(false);
      toast.success(`Khởi tạo chiến dịch: "${name}" thành công!`);
      
      // Reset form
      setName('');
      setTargetWeight('');
      setDeadline('');
    }, 1500);
  };

  const getProgress = (collected: number, target: number) => {
    if (!target || target <= 0) return 0;
    const pct = Math.round((collected / target) * 100);
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <AdminLayout role="admin">
      <div className="campaigns-page">
        <div className="admin-page-header">
          <h2 className="dashboard-title">Quản lý chiến dịch thu gom</h2>
          <p className="dashboard-subtitle">Tạo chiến dịch từ thiện hoặc tái sinh xơ sợi bông dệt và giám sát sản lượng thu gom.</p>
        </div>

        <div className="campaigns-layout-grid">
          {/* Active Campaigns Grid */}
          <div className="campaigns-list-section">
            <h3>Chiến dịch đang hoạt động</h3>
            {campaigns.length === 0 ? (
              <div className="campaigns-empty">
                <Megaphone size={40} />
                <p>Chưa có chiến dịch nào. Tạo chiến dịch đầu tiên ở khung bên phải để bắt đầu thu gom.</p>
              </div>
            ) : (
            <div className="admin-campaign-grid">
              {campaigns.map((camp) => {
                const progressPct = getProgress(camp.collectedWeight, camp.targetWeight);

                return (
                  <div key={camp.id} className={`admin-campaign-card glass ${camp.status}`}>
                    <div className="camp-card-header">
                      <h4>{camp.name}</h4>
                      <span className={`camp-status-badge ${camp.status}`}>
                        {camp.status === 'completed' ? 'Hoàn thành' : 'Đang chạy'}
                      </span>
                    </div>

                    <div className="camp-card-body">
                      <div className="camp-meta">
                        <div className="meta-line">
                          <Target size={14} />
                          <span>Mục tiêu: <strong>{camp.targetWeight} kg</strong></span>
                        </div>
                        <div className="meta-line">
                          <Calendar size={14} />
                          <span>Hạn chót: <strong>{camp.deadline}</strong></span>
                        </div>
                      </div>

                      <div className="camp-progress-wrapper">
                        <div className="progress-label-row">
                          <span>Đã thu gom: {camp.collectedWeight} kg</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div
                          className="progress-bar-bg-camp"
                          role="progressbar"
                          aria-valuenow={progressPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Tiến độ ${camp.name}`}
                        >
                          <div
                            className="progress-bar-fill-camp"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Create Campaign Sidebar */}
          <div className="campaign-form-section glass">
            <h3>Khởi tạo chiến dịch mới</h3>
            <p className="form-sub">Nhập thông tin chiến dịch thu gom cộng đồng.</p>

            <form onSubmit={handleCreateCampaign} className="create-camp-form">
              <Input
                label="Tên chiến dịch *"
                placeholder="Ví dụ: Áo len cho trẻ vùng cao"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Chỉ tiêu thu gom (kg) *"
                type="number"
                placeholder="Ví dụ: 1500"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                required
              />
              <Input
                label="Thời hạn kết thúc *"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />

              <Button type="submit" isLoading={loading} className="submit-camp-btn">
                <PlusCircle size={16} style={{ marginRight: '6px' }} />
                Tạo chiến dịch
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Campaigns;
