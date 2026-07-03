import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { ShieldAlert, Check, RefreshCw, Heart, TrendingUp, Package } from 'lucide-react';
import './Dashboard.css';

interface DonationInventory {
  id: number;
  code: string;
  name: string;
  category: string;
  weight: string;
  status: 'pending' | 'charity' | 'recycle' | 'distributed';
}

const INITIAL_INVENTORY: DonationInventory[] = [
  { id: 1, code: 'RT-2026-804', name: 'Trần Văn Hoàng', category: 'Áo khoác gió & Đồ nỉ', weight: '12 kg', status: 'pending' },
  { id: 2, code: 'RT-2026-803', name: 'Trần Minh Cường', category: 'Áo phông & Sơ mi', weight: '5 kg', status: 'charity' },
  { id: 3, code: 'RT-2026-802', name: 'Lê Thị Bình', category: 'Quần jeans cũ rách', weight: '20 kg', status: 'recycle' },
  { id: 4, code: 'RT-2026-801', name: 'Nguyễn Văn An', category: 'Áo khoác phao dày', weight: '8 kg', status: 'distributed' },
];

export const Dashboard: React.FC = () => {
  const toast = useToast();
  const [inventory, setInventory] = useState<DonationInventory[]>(INITIAL_INVENTORY);

  // Stats derived from state
  const pendingCount = inventory.filter((item) => item.status === 'pending').length;
  const charityCount = inventory.filter((item) => item.status === 'charity').length;
  const recycleCount = inventory.filter((item) => item.status === 'recycle').length;

  const handleUpdateStatus = (id: number, newStatus: 'charity' | 'recycle' | 'distributed') => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: newStatus };
        }
        return item;
      })
    );

    const code = inventory.find((i) => i.id === id)?.code;
    let message = '';
    if (newStatus === 'charity') message = `Đã phân loại đơn ${code} thành: QUẦN ÁO TỪ THIỆN.`;
    if (newStatus === 'recycle') message = `Đã phân loại đơn ${code} thành: TÁI CHẾ XÉ SỢI.`;
    if (newStatus === 'distributed') message = `Đơn ${code} đã được bàn giao PHÂN PHỐI thành công.`;

    toast.success(message);
  };

  const columns = [
    { header: 'ID', accessor: 'id' as const },
    { header: 'Mã tiếp nhận', accessor: 'code' as const },
    { header: 'Người gửi', accessor: 'name' as const },
    { header: 'Phân loại đồ', accessor: 'category' as const },
    { header: 'Cân nặng', accessor: 'weight' as const },
    {
      header: 'Trạng thái',
      accessor: (row: DonationInventory) => {
        switch (row.status) {
          case 'pending':
            return <Badge variant="warning">Chờ phân loại</Badge>;
          case 'charity':
            return <Badge variant="success">Từ thiện (Sẵn sàng)</Badge>;
          case 'recycle':
            return <Badge variant="info">Tái chế (Xé sợi)</Badge>;
          case 'distributed':
            return <Badge variant="primary">Đã phân phối</Badge>;
          default:
            return <Badge variant="warning">Chờ xử lý</Badge>;
        }
      },
    },
    {
      header: 'Phân loại & Xử lý nhanh',
      accessor: (row: DonationInventory) => {
        if (row.status === 'pending') {
          return (
            <div className="action-buttons-cell">
              <button
                className="action-btn btn-success-light"
                onClick={() => handleUpdateStatus(row.id, 'charity')}
                title="Đủ điều kiện làm từ thiện"
              >
                <Heart size={14} style={{ marginRight: '4px' }} /> Từ thiện
              </button>
              <button
                className="action-btn btn-info-light"
                onClick={() => handleUpdateStatus(row.id, 'recycle')}
                title="Chuyển xé sợi tái chế"
              >
                <RefreshCw size={14} style={{ marginRight: '4px' }} /> Tái chế
              </button>
            </div>
          );
        }
        if (row.status === 'charity' || row.status === 'recycle') {
          return (
            <div className="action-buttons-cell">
              <button
                className="action-btn btn-primary-light"
                onClick={() => handleUpdateStatus(row.id, 'distributed')}
                title="Bàn giao vận chuyển"
              >
                <Check size={14} style={{ marginRight: '4px' }} /> Xuất kho / Bàn giao
              </button>
            </div>
          );
        }
        return <span className="action-done-text">Đã đóng hồ sơ</span>;
      },
    },
  ];

  return (
    <AdminLayout role="admin">
      <div className="admin-dashboard">
        <h2 className="dashboard-title">Bảng Tổng Quan Hoạt Động</h2>
        <p className="dashboard-subtitle">Theo dõi lượng quần áo tiếp nhận, điều phối phân loại và bàn giao từ thiện.</p>
        
        <div className="metrics-grid">
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Lượng nhận hôm nay</span>
              <TrendingUp className="metric-icon text-gradient" size={20} />
            </div>
            <span className="metric-value">450 kg</span>
            <span className="metric-trend text-success">+15% so với hôm qua</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Tỷ lệ xé sợi tái chế</span>
              <RefreshCw className="metric-icon text-gradient" size={20} />
            </div>
            <span className="metric-value">46.2%</span>
            <span className="metric-trend">3.890 kg xơ bông dệt mới</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Quần áo sạch từ thiện</span>
              <Package className="metric-icon text-gradient" size={20} />
            </div>
            <span className="metric-value">2.850 bộ</span>
            <span className="metric-trend text-success">Sẵn sàng xuất kho tặng</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Chờ phân loại</span>
              <ShieldAlert className="metric-icon text-gradient" size={20} />
            </div>
            <span className="metric-value">{pendingCount} đơn</span>
            <span className="metric-trend text-warning">Yêu cầu nhân viên xử lý</span>
          </div>
        </div>

        <div className="inventory-section glass">
          <div className="section-header-dashboard">
            <div>
              <h3>Danh sách hàng tiếp nhận cần phân loại</h3>
              <p>Danh sách các đơn quần áo cũ vừa thu gom về kho. Cần phân loại tình trạng vải dệt.</p>
            </div>
            <div className="inventory-filters">
              <Badge variant="warning">Chờ xử lý: {pendingCount}</Badge>
              <Badge variant="success">Đồ từ thiện: {charityCount}</Badge>
              <Badge variant="info">Xơ tái chế: {recycleCount}</Badge>
            </div>
          </div>
          <Table columns={columns} data={inventory} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
