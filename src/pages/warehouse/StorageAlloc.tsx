import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Archive } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  allocateShelf,
  getShelves,
  getWarehouseBatch,
  type ShelfSlot,
  type WarehouseBatch,
} from '@/utils/warehouseMockDb';
import '@/styles/ops-shared.css';

export const StorageAlloc: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<WarehouseBatch | null>(null);
  const [shelves, setShelves] = useState<ShelfSlot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const b = getWarehouseBatch(batchId);
    if (!b) {
      toast.error('Lô hàng không tồn tại.');
      navigate('/warehouse');
      return;
    }
    if (b.status === 'Stored') {
      setDone(true);
      setBatch(b);
      setShelves(getShelves());
      return;
    }
    if (b.status !== 'WarehouseReceived') {
      toast.warning('Chỉ xếp kệ lô đã nhận vật lý.');
      navigate('/warehouse');
      return;
    }
    setBatch(b);
    setShelves(getShelves());
  }, [batchId, navigate, toast]);

  if (!batch) return null;

  const handleSave = () => {
    if (!selected) {
      toast.error('Chọn một kệ còn chỗ.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const ok = allocateShelf(batch.id, selected);
      setSaving(false);
      if (!ok) {
        toast.error('Không đủ chỗ trên kệ hoặc lô không hợp lệ.');
        return;
      }
      const refreshed = getWarehouseBatch(batch.id);
      if (refreshed) setBatch(refreshed);
      setShelves(getShelves());
      setDone(true);
      toast.success('Lưu trữ thành công. Tồn kho đã được cập nhật.');
    }, 700);
  };

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/warehouse')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Phân bổ vị trí kệ</h1>
          <span className={`ops-badge ${done ? 'stored' : 'warehousereceived'}`}>
            {done ? 'Đã lưu trữ' : 'Chọn kệ'}
          </span>
        </div>
      </div>

      {done && (
        <div className="ops-success-banner">
          <CheckCircle size={22} strokeWidth={1.75} />
          <div>
            <strong>Đã xếp kệ</strong>
            <p>
              Lô {batch.code} lưu tại {batch.shelfLabel || 'kệ đã chọn'}. Tồn kho đã cộng
              thêm số lượng từ lô.
            </p>
          </div>
        </div>
      )}

      <div className="ops-panel glass">
        <span className="ops-panel-label">Lô cần xếp</span>
        <h2>
          {batch.code} · {batch.totalWeightKg} kg
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
          {batch.sourceRoute}
        </p>
        <div className="ops-kv-grid" style={{ marginTop: 12 }}>
          <div className="ops-kv">
            <span>Áo khoác</span>
            <strong>{batch.charitySummary.jackets}</strong>
          </div>
          <div className="ops-kv">
            <span>Áo thun</span>
            <strong>{batch.charitySummary.tshirts}</strong>
          </div>
          <div className="ops-kv">
            <span>Quần</span>
            <strong>{batch.charitySummary.pants}</strong>
          </div>
          <div className="ops-kv">
            <span>Tái chế</span>
            <strong>{batch.recycleWeightKg} kg</strong>
          </div>
        </div>
      </div>

      {!done && (
        <div className="ops-panel glass">
          <span className="ops-panel-label">Kệ trống / còn chỗ</span>
          <h2 style={{ marginBottom: 12 }}>Chọn kệ phù hợp (≥ {batch.totalWeightKg} kg trống)</h2>
          <div className="ops-shelf-grid">
            {shelves.map((shelf) => {
              const free = shelf.capacityKg - shelf.usedKg;
              const tooSmall = free < batch.totalWeightKg;
              const pct = Math.min(100, Math.round((shelf.usedKg / shelf.capacityKg) * 100));
              return (
                <button
                  key={shelf.id}
                  type="button"
                  className={`ops-shelf ${selected === shelf.id ? 'selected' : ''}`}
                  disabled={tooSmall}
                  onClick={() => setSelected(shelf.id)}
                >
                  <div className="ops-shelf-zone">{shelf.zone}</div>
                  <div className="ops-shelf-label">{shelf.label}</div>
                  <div className="ops-shelf-cap">
                    Còn {free.toFixed(0)} / {shelf.capacityKg} kg
                    {tooSmall ? ' · Không đủ chỗ' : ''}
                  </div>
                  <div className="ops-cap-track">
                    <div className="ops-cap-fill" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ops-actions">
            <button
              type="button"
              className="ops-btn ops-btn-primary ops-btn-block"
              onClick={handleSave}
              disabled={saving || !selected}
            >
              {saving ? (
                <>
                  <span className="ops-spinner" /> Đang lưu...
                </>
              ) : (
                <>
                  <Archive size={16} strokeWidth={1.75} /> Lưu trữ vào kệ đã chọn
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="ops-actions">
          <button
            type="button"
            className="ops-btn ops-btn-secondary ops-btn-block"
            onClick={() => navigate('/warehouse')}
          >
            Về dashboard kho
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageAlloc;
