import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Truck,
  CheckCircle,
  Package,
  Scale,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  confirmHandoffToWarehouse,
  getClassificationBatch,
  type ClassificationBatch,
} from '@/utils/classificationMockDb';
import '@/styles/ops-shared.css';

export const HandoffBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<ClassificationBatch | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const b = getClassificationBatch(batchId);
    if (!b) {
      toast.error('Lô hàng không tồn tại.');
      navigate('/classification');
      return;
    }
    if (b.status === 'SendingToWarehouse') {
      setDone(true);
      setBatch(b);
      return;
    }
    if (b.status !== 'Classified') {
      toast.warning('Chỉ bàn giao lô đã phân loại xong.');
      navigate('/classification');
      return;
    }
    setBatch(b);
  }, [batchId, navigate, toast]);

  if (!batch) return null;

  const charity = batch.items.reduce(
    (acc, i) => ({
      jackets: acc.jackets + (i.charityJackets || 0),
      tshirts: acc.tshirts + (i.charityTshirts || 0),
      pants: acc.pants + (i.charityPants || 0),
    }),
    { jackets: 0, tshirts: 0, pants: 0 }
  );
  const recycle = batch.items.reduce((s, i) => s + (i.recycleWeightKg || 0), 0);

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      const ok = confirmHandoffToWarehouse(batch.id);
      setConfirming(false);
      if (!ok) {
        toast.error('Không thể bàn giao. Kiểm tra lại trạng thái lô.');
        return;
      }
      setDone(true);
      toast.success(`Đã bàn giao ${batch.code} vào kho. Trạng thái: SendingToWarehouse.`);
    }, 900);
  };

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/classification')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Bàn giao vào kho</h1>
          <span className={`ops-badge ${done ? 'stored' : 'classified'}`}>
            {done ? 'Đã bàn giao' : 'Chờ xác nhận'}
          </span>
        </div>
      </div>

      {done && (
        <div className="ops-success-banner">
          <CheckCircle size={22} strokeWidth={1.75} />
          <div>
            <strong>Bàn giao thành công</strong>
            <p>
              Lô {batch.code} đã chuyển trạng thái SendingToWarehouse. Kho sẽ thấy lô ở tab
              Chờ nhập kho.
            </p>
          </div>
        </div>
      )}

      <div className="ops-panel glass">
        <span className="ops-panel-label">Lô hàng</span>
        <h2>
          {batch.code} · {batch.sourceRoute}
        </h2>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Ngày nhận</span>
            <strong>{batch.receivedDate}</strong>
          </div>
          <div className="ops-kv">
            <span>Số kiện</span>
            <strong>{batch.itemCount}</strong>
          </div>
          <div className="ops-kv">
            <span>Tổng khối lượng</span>
            <strong>{batch.totalWeightKg} kg</strong>
          </div>
          <div className="ops-kv">
            <span>Phân loại xong lúc</span>
            <strong>
              {batch.classifiedAt
                ? new Date(batch.classifiedAt).toLocaleString('vi-VN')
                : 'Chưa ghi'}
            </strong>
          </div>
        </div>
      </div>

      <div className="ops-form-grid two-col">
        <div className="ops-panel glass">
          <span className="ops-panel-label">Tóm tắt từ thiện</span>
          <h2 style={{ marginBottom: 12 }}>Số lượng tách được</h2>
          <div className="ops-kv-grid">
            <div className="ops-kv">
              <span>Áo khoác</span>
              <strong>{charity.jackets}</strong>
            </div>
            <div className="ops-kv">
              <span>Áo thun / sơ mi</span>
              <strong>{charity.tshirts}</strong>
            </div>
            <div className="ops-kv">
              <span>Quần dài</span>
              <strong>{charity.pants}</strong>
            </div>
            <div className="ops-kv">
              <span>Tái chế</span>
              <strong>{recycle.toFixed(1)} kg</strong>
            </div>
          </div>
        </div>

        <div className="ops-panel glass">
          <span className="ops-panel-label">Checklist trước bàn giao</span>
          <h2 style={{ marginBottom: 12 }}>Xác nhận vật lý</h2>
          <ul className="ops-checklist">
            {[
              'Mọi kiện trong lô đã có kết quả phân loại',
              'Nhãn từ thiện / tái chế đã dán đủ',
              'Khối lượng cân lại khớp biên bản',
              'Xe / pallet sẵn sàng chuyển kho',
            ].map((line) => (
              <li key={line} className="ops-checklist-item">
                <CheckCircle size={16} strokeWidth={1.75} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                {line}
              </li>
            ))}
          </ul>

          <div className="ops-actions">
            {!done ? (
              <button
                type="button"
                className="ops-btn ops-btn-primary ops-btn-block"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <span className="ops-spinner" /> Đang xác nhận...
                  </>
                ) : (
                  <>
                    <Truck size={16} strokeWidth={1.75} /> Xác nhận bàn giao vào kho
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="ops-btn ops-btn-secondary ops-btn-block"
                onClick={() => navigate('/classification')}
              >
                <Package size={16} strokeWidth={1.75} /> Về dashboard phân loại
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ops-panel glass">
        <span className="ops-panel-label">Chi tiết kiện đã phân loại</span>
        <div className="ops-item-list" style={{ marginTop: 12 }}>
          {batch.items.map((item) => (
            <div key={item.id} className="ops-item-row" style={{ cursor: 'default' }}>
              <div className="ops-item-main">
                <strong>{item.code}</strong>
                <span>
                  Từ thiện: {item.charityJackets || 0} khoác · {item.charityTshirts || 0} thun ·{' '}
                  {item.charityPants || 0} quần · Tái chế: {item.recycleWeightKg || 0} kg
                </span>
              </div>
              <Scale size={16} strokeWidth={1.75} color="var(--color-text-muted)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandoffBatch;
