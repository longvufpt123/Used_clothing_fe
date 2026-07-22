import React, { useState, useEffect } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Skeleton from '@/components/common/Skeleton';
import { useToast } from '@/context/ToastContext';
import { ShieldAlert, Check, RefreshCw, Heart, TrendingUp, Package, Inbox, Download, FileText, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
} from 'recharts';
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
  { id: 3, code: 'RT-2026-802', name: 'Lê Thị Bình', category: 'Quần denim cũ rách', weight: '20 kg', status: 'recycle' },
  { id: 4, code: 'RT-2026-801', name: 'Nguyễn Văn An', category: 'Áo khoác phao dày', weight: '8 kg', status: 'distributed' },
];

// Lượng vải thu gom 7 ngày gần nhất (kg) — dữ liệu vận hành mô phỏng
const COLLECTION_TREND = [
  { day: 'T2', kg: 312 },
  { day: 'T3', kg: 428 },
  { day: 'T4', kg: 386 },
  { day: 'T5', kg: 521 },
  { day: 'T6', kg: 474 },
  { day: 'T7', kg: 598 },
  { day: 'CN', kg: 450 },
];

// Phân bổ sau phân loại (kg)
const CLASSIFY_BREAKDOWN = [
  { label: 'Từ thiện', kg: 1840, key: 'charity' },
  { label: 'Tái chế', kg: 1290, key: 'recycle' },
  { label: 'Chờ xử lý', kg: 610, key: 'pending' },
];

export const Dashboard: React.FC = () => {
  const toast = useToast();
  const [inventory, setInventory] = useState<DonationInventory[]>(INITIAL_INVENTORY);
  const [isLoading, setIsLoading] = useState(true);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepText, setExportStepText] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleStartExport = (type: 'excel' | 'pdf') => {
    setExportType(type);
    setExportProgress(0);
    setExportStepText('Khởi tạo trình kết xuất dữ liệu...');

    const steps = [
      { p: 25, t: 'Đang thu thập các chỉ số phân tích dữ liệu...' },
      { p: 55, t: type === 'excel' ? 'Đang kết cấu bảng tính dạng CSV (UTF-8 BOM)...' : 'Đang định dạng phân trang tài liệu in ấn PDF...' },
      { p: 85, t: 'Đang đóng gói và gửi lệnh tải file...' },
      { p: 100, t: 'Hoàn tất kết xuất!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setExportProgress(steps[currentStep].p);
        setExportStepText(steps[currentStep].t);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (type === 'excel') {
            triggerExcelDownload();
          } else {
            triggerPdfPrint();
          }
          setExportType(null);
          toast.success(type === 'excel' ? 'Báo cáo Excel đã được xuất thành công!' : 'Đã mở hộp thoại in báo cáo PDF!');
        }, 500);
      }
    }, 400);
  };

  const triggerExcelDownload = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Vietnamese character display
    csvContent += 'BÁO CÁO THỐNG KÊ HOẠT ĐỘNG THU GOM VÀ PHÂN LOẠI QUẦN ÁO CŨ\n';
    csvContent += `Ngày xuất báo cáo:;${new Date().toLocaleDateString('vi-VN')}\n\n`;

    csvContent += '1. CÁC CHỈ SỐ VẬN HÀNH CHỦ CHỐT\n';
    csvContent += 'Chỉ số;Giá trị;Xu hướng / Ghi chú\n';
    csvContent += `Lượng nhận hôm nay;450 kg;+15% so với hôm qua\n`;
    csvContent += `Tỷ lệ xé sợi tái chế;46.2%;3.890 kg xơ bông dệt mới\n`;
    csvContent += `Quần áo sạch từ thiện;2.850 bộ;Sẵn sàng xuất kho tặng\n`;
    csvContent += `Đơn chờ phân loại;${pendingCount} đơn;Yêu cầu nhân viên xử lý\n\n`;

    csvContent += '2. LƯỢNG VẢI THU GOM TRONG 7 NGÀY GẦN NHẤT\n';
    csvContent += 'Ngày;Khối lượng (kg)\n';
    COLLECTION_TREND.forEach((item) => {
      csvContent += `${item.day};${item.kg}\n`;
    });
    csvContent += '\n';

    csvContent += '3. PHÂN BỔ PHÂN LOẠI QUẦN ÁO (TỔNG KHO)\n';
    csvContent += 'Nhóm phân loại;Khối lượng (kg)\n';
    CLASSIFY_BREAKDOWN.forEach((item) => {
      csvContent += `${item.label};${item.kg}\n`;
    });
    csvContent += '\n';

    csvContent += '4. CHI TIẾT DANH SÁCH HÀNG TIẾP NHẬN CẦN PHÂN LOẠI\n';
    csvContent += 'Mã tiếp nhận;Người gửi;Phân loại đồ;Cân nặng;Trạng thái\n';
    inventory.forEach((item) => {
      const statusText =
        item.status === 'pending'
          ? 'Chờ phân loại'
          : item.status === 'charity'
          ? 'Từ thiện (Sẵn sàng)'
          : item.status === 'recycle'
          ? 'Tái chế (Xé sợi)'
          : 'Đã phân phối';
      csvContent += `${item.code};${item.name};${item.category};${item.weight};${statusText}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_van_hanh_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPdfPrint = () => {
    window.print();
  };

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
    if (newStatus === 'charity') message = `Đã phân loại đơn ${code} thành: quần áo từ thiện.`;
    if (newStatus === 'recycle') message = `Đã phân loại đơn ${code} thành: tái chế xé sợi.`;
    if (newStatus === 'distributed') message = `Đơn ${code} đã được bàn giao phân phối thành công.`;

    toast.success(message);
  };

  const barColor = (key: string) =>
    key === 'charity'
      ? 'var(--color-primary)'
      : key === 'recycle'
      ? 'var(--color-info)'
      : 'var(--color-warning)';

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
      header: 'Phân loại & xử lý nhanh',
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
        <div className="admin-page-header no-print-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 className="dashboard-title">Bảng tổng quan hoạt động</h2>
            <p className="dashboard-subtitle">Theo dõi lượng quần áo tiếp nhận, điều phối phân loại và bàn giao từ thiện.</p>
          </div>
          <div className="dashboard-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => handleStartExport('excel')}
              className="premium-export-btn"
              title="Tải báo cáo định dạng Excel CSV"
            >
              <span>Xuất Excel (.csv)</span>
              <div className="export-btn-icon-circle">
                <Download size={13} strokeWidth={2} />
              </div>
            </button>
            <button
              onClick={() => handleStartExport('pdf')}
              className="premium-export-btn pdf-btn"
              title="Xuất báo cáo định dạng PDF"
            >
              <span>Xuất Báo cáo PDF</span>
              <div className="export-btn-icon-circle" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <FileText size={13} strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Lượng nhận hôm nay</span>
              <TrendingUp className="metric-icon" size={20} />
            </div>
            <span className="metric-value">450 kg</span>
            <span className="metric-trend text-success">+15% so với hôm qua</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Tỷ lệ xé sợi tái chế</span>
              <RefreshCw className="metric-icon" size={20} />
            </div>
            <span className="metric-value">46.2%</span>
            <span className="metric-trend">3.890 kg xơ bông dệt mới</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Quần áo sạch từ thiện</span>
              <Package className="metric-icon" size={20} />
            </div>
            <span className="metric-value">2.850 bộ</span>
            <span className="metric-trend text-success">Sẵn sàng xuất kho tặng</span>
          </div>
          <div className="metric-box glass">
            <div className="metric-header">
              <span className="metric-label">Chờ phân loại</span>
              <ShieldAlert className="metric-icon" size={20} />
            </div>
            <span className="metric-value">{pendingCount} đơn</span>
            <span className="metric-trend text-warning">Yêu cầu nhân viên xử lý</span>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card glass">
            <div className="chart-card-header">
              <h3>Lượng vải thu gom 7 ngày qua</h3>
              <span className="chart-card-unit">đơn vị: kg</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={COLLECTION_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-text-muted)" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" tickLine={false} axisLine={false} fontSize={12} width={44} />
                  <RTooltip
                    cursor={{ stroke: 'var(--color-border-strong)' }}
                    contentStyle={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    labelStyle={{ color: 'var(--color-text-secondary)' }}
                    formatter={(v) => [`${v} kg`, 'Thu gom']}
                  />
                  <Area
                    type="monotone"
                    dataKey="kg"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#collectionFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass">
            <div className="chart-card-header">
              <h3>Phân bổ sau phân loại</h3>
              <span className="chart-card-unit">đơn vị: kg</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={CLASSIFY_BREAKDOWN} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" tickLine={false} axisLine={false} fontSize={12} width={44} />
                  <RTooltip
                    cursor={{ fill: 'var(--color-primary-light)' }}
                    contentStyle={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    labelStyle={{ color: 'var(--color-text-secondary)' }}
                    formatter={(v) => [`${v} kg`, 'Khối lượng']}
                  />
                  <Bar dataKey="kg" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {CLASSIFY_BREAKDOWN.map((entry) => (
                      <Cell key={entry.key} fill={barColor(entry.key)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
          {isLoading ? (
            <div className="inventory-loading">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={52} className="inventory-skeleton-row" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="dashboard-empty">
              <Inbox size={40} />
              <p>Chưa có đơn nào trong kho. Các đơn thu gom mới sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <Table columns={columns} data={inventory} />
          )}
        </div>

        {/* Dynamic Premium Exporting Modal Overlay */}
        {exportType && (
          <div className="export-modal-overlay">
            <div className="export-modal-card">
              <div className="export-modal-header">
                <h3>Đang kết xuất dữ liệu</h3>
                <span className="export-modal-type-badge">{exportType === 'excel' ? 'EXCEL (CSV)' : 'TÀI LIỆU PDF'}</span>
              </div>
              <div className="export-modal-body">
                <div className="export-spinner-container">
                  <Loader2 className="export-spinner" size={24} />
                </div>
                <p className="export-step-text">{exportStepText}</p>
                <div className="export-progress-bg">
                  <div className="export-progress-bar" style={{ width: `${exportProgress}%` }} />
                </div>
                <span className="export-progress-percent">{exportProgress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
