import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Package, Truck, Home } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getDistributionByTracking,
  type DistributionRequest,
} from '@/utils/warehouseMockDb';
import '@/styles/ops-shared.css';

export const WarehouseTracking: React.FC = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [dist, setDist] = useState<DistributionRequest | null>(null);

  useEffect(() => {
    if (!trackingCode) return;
    const d = getDistributionByTracking(trackingCode);
    if (!d) {
      toast.error('Không tìm thấy vận đơn.');
      navigate('/warehouse');
      return;
    }
    setDist(d);
  }, [trackingCode, navigate, toast]);

  if (!dist) return null;

  const steps = [
    {
      key: 'created',
      title: 'Tạo vận đơn GHN',
      desc: dist.preparedAt
        ? new Date(dist.preparedAt).toLocaleString('vi-VN')
        : 'Đã tạo mã vận đơn',
      done: true,
      current: false,
    },
    {
      key: 'pickup',
      title: 'Đang lấy hàng',
      desc: dist.ghnStatus || 'Chờ shipper GHN đến kho',
      done: dist.status === 'Shipped',
      current: dist.status === 'Prepared' || dist.ghnStatus === 'Đang lấy hàng',
    },
    {
      key: 'transit',
      title: 'Đang giao',
      desc: 'Hàng trên đường đến điểm nhận',
      done: dist.ghnStatus === 'Đang giao' || dist.ghnStatus === 'Đã giao',
      current: dist.ghnStatus === 'Đang giao',
    },
    {
      key: 'delivered',
      title: 'Đã giao thành công',
      desc: dist.destination,
      done: dist.ghnStatus === 'Đã giao',
      current: false,
    },
  ];

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/warehouse')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Theo dõi vận đơn GHN</h1>
          <span className={`ops-badge ${dist.status.toLowerCase()}`}>{dist.ghnStatus || dist.status}</span>
        </div>
      </div>

      <div className="ops-panel glass">
        <span className="ops-panel-label">Mã vận đơn</span>
        <h2 style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}>
          {dist.trackingCode}
        </h2>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Yêu cầu</span>
            <strong>{dist.code}</strong>
          </div>
          <div className="ops-kv">
            <span>Chiến dịch</span>
            <strong style={{ fontSize: '0.85rem' }}>{dist.campaignName}</strong>
          </div>
          <div className="ops-kv">
            <span>Liên hệ</span>
            <strong>
              {dist.contactName} · {dist.contactPhone}
            </strong>
          </div>
          <div className="ops-kv">
            <span>Điểm đến</span>
            <strong style={{ fontSize: '0.82rem', fontWeight: 550 }}>{dist.destination}</strong>
          </div>
        </div>
      </div>

      <div className="ops-form-grid two-col">
        <div className="ops-panel glass">
          <span className="ops-panel-label">Tiến trình giao hàng</span>
          <h2 style={{ marginBottom: 16 }}>Lịch sử trạng thái</h2>
          <div className="ops-timeline">
            {steps.map((step) => (
              <div
                key={step.key}
                className={`ops-timeline-step ${step.done ? 'done' : ''} ${step.current ? 'current' : ''}`}
              >
                <span className="ops-timeline-dot" />
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-panel glass">
          <span className="ops-panel-label">Hàng đã đóng gói</span>
          <h2 style={{ marginBottom: 12 }}>Nội dung kiện</h2>
          <div className="ops-item-list">
            {(dist.packedItems || dist.itemsNeeded).map((item) => (
              <div key={item.label} className="ops-item-row" style={{ cursor: 'default' }}>
                <div className="ops-item-main">
                  <strong>{item.label}</strong>
                  <span>Số lượng: {item.qty}</span>
                </div>
                <Package size={16} strokeWidth={1.75} color="var(--color-text-muted)" />
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-tertiary)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <MapPin size={18} strokeWidth={1.75} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                Địa chỉ giao
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {dist.destination}
              </p>
            </div>
          </div>

          <div className="ops-actions">
            <button
              type="button"
              className="ops-btn ops-btn-primary ops-btn-block"
              onClick={() => navigate('/warehouse')}
            >
              <Home size={16} strokeWidth={1.75} /> Quay lại trang chủ kho
            </button>
            <button
              type="button"
              className="ops-btn ops-btn-secondary ops-btn-block"
              onClick={() => toast.info('Mock: mở trang GHN partner (demo).')}
            >
              <Truck size={16} strokeWidth={1.75} /> Mở GHN (demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseTracking;
