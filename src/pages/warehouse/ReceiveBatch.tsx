import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Package, Archive } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  confirmPhysicalReceive,
  getWarehouseBatch,
  type WarehouseBatch,
} from '@/utils/warehouseMockDb';
import '@/styles/ops-shared.css';

export const ReceiveBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<WarehouseBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const b = getWarehouseBatch(batchId);
    if (!b) {
      toast.error('Lô hàng không tồn tại.');
      navigate('/warehouse');
      return;
    }
    if (b.status === 'WarehouseReceived' || b.status === 'Stored') {
      setDone(true);
    } else if (b.status !== 'SendingToWarehouse') {
      toast.warning('Lô không ở trạng thái chờ nhập kho.');
      navigate('/warehouse');
      return;
    }
    setBatch(b);
  }, [batchId, navigate, toast]);

  if (!batch) return null;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const ok = confirmPhysicalReceive(batch.id);
      setLoading(false);
      if (!ok) {
        toast.error('Không xác nhận được lô này.');
        return;
      }
      setDone(true);
      setBatch({ ...batch, status: 'WarehouseReceived', physicalReceivedAt: new Date().toISOString() });
      toast.success('Đã xác nhận nhận hàng vật lý. Trạng thái: Đã nhận tại kho.');
    }, 800);
  };

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/warehouse')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Tiếp nhận lô hàng</h1>
          <span className={`ops-badge ${done ? 'warehousereceived' : 'sendingtowarehouse'}`}>
            {done ? 'Đã nhận' : 'Chờ xác nhận'}
          </span>
        </div>
      </div>

      {done && (
        <div className="ops-success-banner">
          <CheckCircle size={22} strokeWidth={1.75} />
          <div>
            <strong>Nhận hàng thành công</strong>
            <p>Lô {batch.code} sẵn sàng xếp kệ. Chuyển sang bước phân bổ vị trí lưu trữ.</p>
          </div>
        </div>
      )}

      <div className="ops-panel glass">
        <span className="ops-panel-label">Thông tin lô</span>
        <h2>
          {batch.code}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
          {batch.sourceRoute}
        </p>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Ngày lô</span>
            <strong>{batch.receivedDate}</strong>
          </div>
          <div className="ops-kv">
            <span>Số kiện</span>
            <strong>{batch.itemCount}</strong>
          </div>
          <div className="ops-kv">
            <span>Khối lượng</span>
            <strong>{batch.totalWeightKg} kg</strong>
          </div>
          <div className="ops-kv">
            <span>Tái chế</span>
            <strong>{batch.recycleWeightKg} kg</strong>
          </div>
        </div>
      </div>

      <div className="ops-form-grid two-col">
        <div className="ops-panel glass">
          <span className="ops-panel-label">Biên bản từ thiện</span>
          <h2 style={{ marginBottom: 12 }}>Nội dung lô</h2>
          <div className="ops-kv-grid">
            <div className="ops-kv">
              <span>Áo khoác</span>
              <strong>{batch.charitySummary.jackets}</strong>
            </div>
            <div className="ops-kv">
              <span>Áo thun</span>
              <strong>{batch.charitySummary.tshirts}</strong>
            </div>
            <div className="ops-kv">
              <span>Quần dài</span>
              <strong>{batch.charitySummary.pants}</strong>
            </div>
            <div className="ops-kv">
              <span>Tái chế</span>
              <strong>{batch.recycleWeightKg} kg</strong>
            </div>
          </div>
        </div>

        <div className="ops-panel glass">
          <span className="ops-panel-label">Checklist nhận hàng</span>
          <h2 style={{ marginBottom: 12 }}>Đối chiếu vật lý</h2>
          <ul className="ops-checklist" style={{ marginBottom: 16 }}>
            {[
              'Số kiện khớp biên bản bàn giao',
              'Nhãn từ thiện / tái chế còn nguyên',
              'Không hư hỏng / ướt nặng',
              'Ký xác nhận với người giao',
            ].map((line) => (
              <li key={line} className="ops-checklist-item">
                <CheckCircle size={16} strokeWidth={1.75} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="ops-spinner" /> Đang xác nhận...
                  </>
                ) : (
                  <>
                    <Package size={16} strokeWidth={1.75} /> Xác nhận đã nhận hàng vật lý
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="ops-btn ops-btn-primary ops-btn-block"
                  onClick={() => navigate(`/warehouse/storage/${batch.id}`)}
                >
                  <Archive size={16} strokeWidth={1.75} /> Tiếp tục xếp kệ
                </button>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary ops-btn-block"
                  onClick={() => navigate('/warehouse')}
                >
                  Về dashboard kho
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveBatch;
