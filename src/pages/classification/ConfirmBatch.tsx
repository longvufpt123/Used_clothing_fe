import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Package,
  Calendar,
  Scale,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getClassificationBatch,
  confirmIntakeBatch,
  type ClassificationBatch,
} from '@/utils/classificationMockDb';
import '@/styles/ops-shared.css';
import './ConfirmBatch.css';

export const ConfirmBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [batch, setBatch] = useState<ClassificationBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  // Checklist items
  const [checks, setChecks] = useState({
    seals: false,
    weight: false,
    items: false,
  });

  useEffect(() => {
    if (!batchId) return;
    const b = getClassificationBatch(batchId);
    if (!b) {
      toast.error('Lô hàng không tồn tại.');
      navigate('/classification');
      return;
    }
    if (b.status !== 'PendingConfirmation') {
      if (b.status === 'PendingClassification') {
        toast.info('Lô hàng này đã được xác nhận trước đó.');
        navigate(`/classification/classify/${b.id}`);
      } else {
        toast.info('Lô hàng này đã được xử lý xong.');
        navigate('/classification');
      }
      return;
    }
    setBatch(b);
  }, [batchId, navigate, toast]);

  if (!batch) return null;

  const toggleCheck = (key: keyof typeof checks) => {
    if (loading || confirmed) return;
    setChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isAllChecked = checks.seals && checks.weight && checks.items;

  const handleConfirm = () => {
    if (!isAllChecked || loading || confirmed) return;

    setLoading(true);
    setProgress(15);

    // Simulate haptic loading stages
    const timer1 = setTimeout(() => setProgress(45), 250);
    const timer2 = setTimeout(() => setProgress(80), 550);
    const timer3 = setTimeout(() => {
      setProgress(100);
      const success = confirmIntakeBatch(batch.id);
      setLoading(false);
      if (success) {
        setConfirmed(true);
        toast.success(`Đã xác nhận nhận lô hàng ${batch.code} thành công.`);
      } else {
        toast.error('Có lỗi xảy ra khi xác nhận lô hàng.');
        setProgress(0);
      }
    }, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  return (
    <div className="ops-page confirm-batch-page">
      <div className="ops-nav">
        <button
          type="button"
          className="ops-back"
          onClick={() => navigate('/classification')}
          style={{ transition: 'all 500ms cubic-bezier(0.32, 0.72, 0, 1)' }}
        >
          <ChevronLeft size={16} strokeWidth={1.5} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Xác nhận lô tiếp nhận</h1>
          <span className={`ops-badge ${confirmed ? 'done' : 'pending'}`}>
            {confirmed ? 'Đã nhận' : 'Chờ xác nhận từ bộ phận tiếp nhận'}
          </span>
        </div>
      </div>

      {confirmed && (
        <div
          className="ops-success-banner"
          style={{
            animation: 'confirmFadeIn 600ms cubic-bezier(0.32, 0.72, 0, 1)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <ShieldCheck size={22} strokeWidth={1.5} />
          <div>
            <strong>Tiếp nhận lô hàng thành công</strong>
            <p>
              Lô {batch.code} đã chính thức được chuyển sang trạng thái "Chờ phân loại".
              Bạn có thể tiến hành phân loại chi tiết các vật phẩm ngay bây giờ.
            </p>
          </div>
        </div>
      )}

      <div className="ops-form-grid two-col" style={{ marginTop: '8px' }}>
        {/* Left side: Batch Details with Double Bezel */}
        <div className="bezel-outer">
          <div className="bezel-inner">
            <span className="ops-panel-label">Thông tin bàn giao</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
              {batch.code}
            </h2>
            <div className="ops-kv-grid" style={{ gridTemplateColumns: '1fr', gap: '14px', marginTop: 0 }}>
              <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: '14px' }}>
                <span>Tuyến thu gom</span>
                <strong style={{ fontSize: '0.98rem', marginTop: '4px' }}>{batch.sourceRoute}</strong>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
              >
                <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: '14px' }}>
                  <span>Ngày tiếp nhận</span>
                  <strong style={{ fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} strokeWidth={1.5} color="var(--color-primary)" />
                    {batch.receivedDate}
                  </strong>
                </div>
                <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: '14px' }}>
                  <span>Khối lượng bàn giao</span>
                  <strong style={{ fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale size={14} strokeWidth={1.5} color="var(--color-primary)" />
                    {batch.totalWeightKg} kg
                  </strong>
                </div>
              </div>
              <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: '14px' }}>
                <span>Tổng số kiện ước lượng</span>
                <strong style={{ fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} strokeWidth={1.5} color="var(--color-primary)" />
                  {batch.itemCount} kiện
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '14px 16px',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                borderRadius: '14px',
                display: 'flex',
                gap: '10px',
              }}
            >
              <AlertCircle size={16} strokeWidth={1.5} color="var(--color-danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Lưu ý: Sau khi xác nhận nhận lô hàng này, bạn chịu trách nhiệm mở kiện kiểm đếm và phân chia chi tiết từng vật phẩm bên trong.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Verification Checklist with Double Bezel */}
        <div className="bezel-outer">
          <div className="bezel-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <span className="ops-panel-label">Kiểm tra thực tế</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Biên bản bàn giao vật lý
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Vui lòng kiểm tra kỹ trạng thái của kiện hàng thực tế trước khi xác nhận vào hệ thống.
            </p>

            <ul className="interactive-checklist">
              <li
                className={`checklist-item ${checks.seals ? 'checked' : ''}`}
                onClick={() => toggleCheck('seals')}
              >
                <div className="checkbox-circle">
                  {checks.seals && <Check size={12} strokeWidth={2.5} color="#fff" />}
                </div>
                <div className="checklist-text">
                  Niêm phong của các bao/kiện hàng còn nguyên vẹn, không có dấu hiệu rách, tráo đổi.
                </div>
              </li>

              <li
                className={`checklist-item ${checks.weight ? 'checked' : ''}`}
                onClick={() => toggleCheck('weight')}
              >
                <div className="checkbox-circle">
                  {checks.weight && <Check size={12} strokeWidth={2.5} color="#fff" />}
                </div>
                <div className="checklist-text">
                  Cân nặng thực tế khớp với biên bản (không chênh lệch quá ±5% so với {batch.totalWeightKg} kg).
                </div>
              </li>

              <li
                className={`checklist-item ${checks.items ? 'checked' : ''}`}
                onClick={() => toggleCheck('items')}
              >
                <div className="checkbox-circle">
                  {checks.items && <Check size={12} strokeWidth={2.5} color="#fff" />}
                </div>
                <div className="checklist-text">
                  Số lượng bao/kiện thực tế trùng khớp với thông số bàn giao ({batch.itemCount} kiện).
                </div>
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '28px' }}>
              {loading && (
                <div className="confirm-progress-container">
                  <div className="confirm-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: loading ? '16px' : '0' }}>
                {!confirmed ? (
                  <button
                    type="button"
                    className="premium-btn-island"
                    disabled={!isAllChecked || loading}
                    onClick={handleConfirm}
                  >
                    <span>
                      {loading ? 'Đang ghi nhận dữ liệu...' : 'Xác nhận nhận lô hàng'}
                    </span>
                    <div className="btn-icon-island">
                      <Check size={15} strokeWidth={2} />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="premium-btn-island"
                    onClick={() => navigate(`/classification/classify/${batch.id}`)}
                    style={{
                      background: 'var(--color-text-primary)',
                      color: 'var(--color-bg-primary)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span style={{ color: 'var(--color-bg-primary)' }}>Tiến hành phân loại</span>
                    <div className="btn-icon-island" style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--color-bg-primary)' }}>
                      <ArrowRight size={15} strokeWidth={2} />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Package Items Manifest */}
      <div className="bezel-outer" style={{ marginTop: '24px' }}>
        <div className="bezel-inner">
          <span className="ops-panel-label">Danh sách kiện ước tính từ bộ phận tiếp nhận</span>
          <div className="ops-item-list" style={{ marginTop: '12px' }}>
            {batch.items.map((item) => (
              <div
                key={item.id}
                className="ops-item-row"
                style={{
                  cursor: 'default',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="ops-item-main">
                  <strong>{item.code}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Người đóng góp: {item.donorName} · Loại ước tính: {item.estimatedCategory}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    ~{item.estimatedWeightKg} kg
                  </span>
                  <Scale size={15} strokeWidth={1.5} color="var(--color-text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBatch;
