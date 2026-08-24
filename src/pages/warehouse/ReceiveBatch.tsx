import { useEffect, useState } from 'react';
import { AlertTriangle, Check, ChevronLeft, ImageOff, Package, Scale } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { warehouseService, type WarehouseBatch } from '@/services/warehouseService';
import '@/styles/ops-shared.css';
import { getClassifiedBatchGroupLabel } from '@/utils/classifiedBatch';

export default function ReceiveBatch() {
  const { batchId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<WarehouseBatch | null>(null);
  const [weight, setWeight] = useState(0);
  const [seal, setSeal] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!batchId) return;
    warehouseService
      .getBatch(batchId)
      .then((data) => {
        setBatch(data);
        setWeight(data.expectedWeightKg || data.expectedItemCount);
      })
      .catch(() => {
        toast.error('Không tải được batch.');
        nav('/warehouse');
      });
  }, [batchId]);
  const confirm = async () => {
    if (!batchId || weight <= 0)
      return toast.error('Nhập khối lượng thực nhận.');
    if (!seal && !notes.trim())
      return toast.error('Cần ghi nhận sai lệch khi niêm phong không nguyên vẹn.');
    setSaving(true);
    try {
      await warehouseService.confirmReceipt(batchId, {
        actualItemCount: batch?.expectedItemCount || 0,
        actualWeightKg: weight,
        sealIntact: seal,
        discrepancyNotes: notes,
      });
      toast.success('Đã lập phiếu nhận kho và ghi transaction RECEIPT.');
      nav(`/warehouse/storage/${batchId}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không xác nhận được batch.');
    } finally {
      setSaving(false);
    }
  };
  if (!batch) return <div className="ops-page">Đang tải...</div>;
  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button className="ops-back" onClick={() => nav('/warehouse')}>
          <ChevronLeft size={16} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Đối chiếu nhận hàng</h1>
          <span className="ops-badge pending">Pending receipt</span>
        </div>
      </div>
      <div className="ops-form-grid two-col">
        <section className="ops-panel glass">
          <span className="ops-panel-label">{batch.batchCode}</span>
          <h2>{getClassifiedBatchGroupLabel(batch)} · Nhãn {batch.conditionGrade}</h2>
          <div className="ops-kv-grid">
            <div className="ops-kv">
              <span>Dự kiến</span>
              <strong>
                <Package size={14} />
                {batch.expectedItemCount} item
              </strong>
            </div>
            <div className="ops-kv">
              <span>Hướng xử lý</span>
              <strong>{batch.processingDirection}</strong>
            </div>
          </div>
          <div className="ops-provenance">
            <strong>Nguồn Donation Request</strong>
            <div>
              {batch.donationRequestCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
          </div>
          <div className="ops-image-grid">
            {batch.items
              .flatMap((i) => i.imageUrls || [])
              .slice(0, 8)
              .map((url) => (
                <img key={url} src={url} alt="Classified item" />
              ))}
            {!batch.items.some((i) => i.imageUrls?.length) && (
              <div className="ops-no-image">
                <ImageOff />
                <span>Không có hình ảnh</span>
              </div>
            )}
          </div>
        </section>
        <section className="ops-panel glass">
          <span className="ops-panel-label">Biên bản thực nhận</span>
          <div className="ops-field">
            <label>Khối lượng thực nhận (kg)</label>
            <input
              type="number"
              min=".01"
              step=".01"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>
          <button
            type="button"
            className={`ops-item-row ${seal ? 'active' : ''}`}
            onClick={() => setSeal((v) => !v)}
          >
            <div className="ops-item-main">
              <strong>Niêm phong nguyên vẹn</strong>
              <span>{seal ? 'Đã kiểm tra' : 'Có bất thường'}</span>
            </div>
            {seal ? <Check /> : <AlertTriangle />}
          </button>
          <div className="ops-field">
            <label>Sai lệch / ghi chú nhận hàng</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mô tả rách bao, thiếu item, chênh lệch cân..."
            />
          </div>
          <button
            className="ops-btn ops-btn-primary ops-btn-block"
            disabled={saving}
            onClick={confirm}
          >
            <Scale size={16} />
            {saving ? 'Đang ghi nhận...' : 'Xác nhận nhận hàng vật lý'}
          </button>
        </section>
      </div>
    </div>
  );
}
