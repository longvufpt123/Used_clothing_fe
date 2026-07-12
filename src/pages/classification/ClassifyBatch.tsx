import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Minus,
  Plus,
  CheckCircle,
  Package,
  Save,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getClassificationBatch,
  saveItemClassification,
  type ClassificationBatch,
  type ClassificationItem,
} from '@/utils/classificationMockDb';
import '@/styles/ops-shared.css';

export const ClassifyBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [batch, setBatch] = useState<ClassificationBatch | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [jackets, setJackets] = useState(0);
  const [tshirts, setTshirts] = useState(0);
  const [pants, setPants] = useState(0);
  const [recycleKg, setRecycleKg] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = () => {
    if (!batchId) return;
    const b = getClassificationBatch(batchId);
    if (!b) {
      toast.error('Lô hàng không tồn tại.');
      navigate('/classification');
      return;
    }
    if (b.status !== 'PendingClassification') {
      toast.info('Lô này đã hoàn tất phân loại.');
      navigate('/classification');
      return;
    }
    setBatch(b);
    const next = b.items.find((i) => i.status === 'pending') || b.items[0];
    if (next && next.id !== activeItemId) {
      selectItem(next);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const selectItem = (item: ClassificationItem) => {
    setActiveItemId(item.id);
    if (item.status === 'done') {
      setJackets(item.charityJackets || 0);
      setTshirts(item.charityTshirts || 0);
      setPants(item.charityPants || 0);
      setRecycleKg(item.recycleWeightKg || 0);
      setNotes(item.notes || '');
    } else {
      setJackets(0);
      setTshirts(0);
      setPants(0);
      setRecycleKg(0);
      setNotes('');
    }
  };

  if (!batch) return null;

  const activeItem = batch.items.find((i) => i.id === activeItemId) || null;
  const doneCount = batch.items.filter((i) => i.status === 'done').length;

  const bump = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min = 0) => {
    setter((v) => Math.max(min, v + delta));
  };

  const handleSave = () => {
    if (!activeItem || activeItem.status === 'done') return;
    if (jackets + tshirts + pants === 0 && recycleKg <= 0) {
      toast.error('Nhập ít nhất một nhóm vật phẩm từ thiện hoặc kg tái chế.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const allDone = saveItemClassification(batch.id, activeItem.id, {
        charityJackets: jackets,
        charityTshirts: tshirts,
        charityPants: pants,
        recycleWeightKg: recycleKg,
        notes,
      });

      toast.success(`Đã lưu phân loại kiện ${activeItem.code}.`);
      setSaving(false);

      if (allDone) {
        toast.success('Toàn bộ kiện trong lô đã xong. Chuyển sang bàn giao kho.');
        navigate(`/classification/handoff/${batch.id}`);
        return;
      }

      const refreshed = getClassificationBatch(batch.id);
      if (refreshed) {
        setBatch(refreshed);
        const next = refreshed.items.find((i) => i.status === 'pending');
        if (next) selectItem(next);
      }
    }, 600);
  };

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/classification')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>{batch.code}</h1>
          <span className="ops-badge pending">Đang phân loại</span>
        </div>
      </div>

      <div className="ops-panel glass">
        <span className="ops-panel-label">Nguồn tuyến</span>
        <h2>{batch.sourceRoute}</h2>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Ngày nhận</span>
            <strong>{batch.receivedDate}</strong>
          </div>
          <div className="ops-kv">
            <span>Tiến độ kiện</span>
            <strong>
              {doneCount}/{batch.items.length}
            </strong>
          </div>
          <div className="ops-kv">
            <span>Khối lượng ước tính</span>
            <strong>{batch.totalWeightKg} kg</strong>
          </div>
          <div className="ops-kv">
            <span>Số kiện</span>
            <strong>{batch.itemCount}</strong>
          </div>
        </div>
      </div>

      <div className="ops-form-grid two-col">
        <section className="ops-panel glass">
          <span className="ops-panel-label">Danh sách kiện trong lô</span>
          <h2 style={{ marginBottom: 12 }}>Chọn kiện cần xử lý</h2>
          <div className="ops-item-list">
            {batch.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ops-item-row ${activeItemId === item.id ? 'active' : ''} ${item.status === 'done' ? 'done' : ''}`}
                onClick={() => selectItem(item)}
              >
                <div className="ops-item-main">
                  <strong>{item.code}</strong>
                  <span>
                    {item.donorName} · {item.estimatedWeightKg} kg · {item.estimatedCategory}
                  </span>
                </div>
                {item.status === 'done' ? (
                  <CheckCircle size={18} strokeWidth={1.75} color="var(--color-primary)" />
                ) : (
                  <Package size={18} strokeWidth={1.75} color="var(--color-text-muted)" />
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="ops-panel glass">
          {activeItem ? (
            <>
              <span className="ops-panel-label">Form phân loại chi tiết</span>
              <h2>
                {activeItem.code}{' '}
                {activeItem.status === 'done' && (
                  <span className="ops-badge done" style={{ marginLeft: 8 }}>
                    Đã lưu
                  </span>
                )}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Ước tính: {activeItem.estimatedCategory} · {activeItem.estimatedWeightKg} kg ·{' '}
                {activeItem.donorName}
              </p>

              <div style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: '0.85rem' }}>Từ thiện (đếm món)</strong>
              </div>

              <div className="ops-counter-row">
                <span className="ops-counter-label">Áo khoác</span>
                <div className="ops-stepper">
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setJackets, -1)}
                    aria-label="Giảm áo khoác"
                  >
                    <Minus size={14} strokeWidth={1.75} />
                  </button>
                  <span>{jackets}</span>
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setJackets, 1)}
                    aria-label="Tăng áo khoác"
                  >
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="ops-counter-row">
                <span className="ops-counter-label">Áo thun / sơ mi</span>
                <div className="ops-stepper">
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setTshirts, -1)}
                    aria-label="Giảm áo thun"
                  >
                    <Minus size={14} strokeWidth={1.75} />
                  </button>
                  <span>{tshirts}</span>
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setTshirts, 1)}
                    aria-label="Tăng áo thun"
                  >
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="ops-counter-row">
                <span className="ops-counter-label">Quần dài</span>
                <div className="ops-stepper">
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setPants, -1)}
                    aria-label="Giảm quần"
                  >
                    <Minus size={14} strokeWidth={1.75} />
                  </button>
                  <span>{pants}</span>
                  <button
                    type="button"
                    disabled={activeItem.status === 'done'}
                    onClick={() => bump(setPants, 1)}
                    aria-label="Tăng quần"
                  >
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="ops-field" style={{ marginTop: 16 }}>
                <label htmlFor="recycleKg">Tái chế (kg xơ sợi)</label>
                <input
                  id="recycleKg"
                  type="number"
                  min={0}
                  step={0.1}
                  value={recycleKg}
                  disabled={activeItem.status === 'done'}
                  onChange={(e) => setRecycleKg(Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <span className="hint">Khối lượng vải không còn dùng cho từ thiện</span>
              </div>

              <div className="ops-field" style={{ marginTop: 12 }}>
                <label htmlFor="clsNotes">Ghi chú</label>
                <textarea
                  id="clsNotes"
                  value={notes}
                  disabled={activeItem.status === 'done'}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tình trạng kiện, ghi chú tách loại..."
                />
              </div>

              {activeItem.status !== 'done' && (
                <div className="ops-actions">
                  <button
                    type="button"
                    className="ops-btn ops-btn-primary ops-btn-block"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="ops-spinner" /> Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={16} strokeWidth={1.75} /> Lưu kết quả phân loại
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)' }}>Chọn một kiện để bắt đầu.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClassifyBatch;
