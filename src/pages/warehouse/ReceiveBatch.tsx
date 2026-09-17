import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/common/Modal';
import { AlertTriangle, Check, ChevronLeft, ImageOff, Scale } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { warehouseService, type WarehouseBatch } from '@/services/warehouseService';
import '@/styles/ops-shared.css';
import './ReceiveBatch.css';
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
  const [confirmation, setConfirmation] = useState<{ actualItemCount: number; actualWeightKg: number; sealIntact: boolean; discrepancyNotes: string } | null>(null);
  const [saveError, setSaveError] = useState('');
  const submitting = useRef(false);
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
  const confirm = () => {
    if (submitting.current) return;
    if (!batchId || !batch || !Number.isFinite(weight) || weight <= 0)
      return toast.error('Nhập khối lượng thực nhận.');
    const handedOffWeight = Number(batch.expectedWeightKg.toFixed(2));
    const receivedWeight = Number(weight.toFixed(2));
    if (receivedWeight !== handedOffWeight)
      return toast.error(`Khối lượng thực nhận phải đúng bằng ${handedOffWeight} kg do Classification Staff bàn giao.`);
    if (!seal && !notes.trim())
      return toast.error('Cần ghi nhận sai lệch khi niêm phong không nguyên vẹn.');
    setSaveError('');
    setConfirmation({ actualItemCount: batch.expectedItemCount || 0, actualWeightKg: weight,
      sealIntact: seal, discrepancyNotes: notes });
  };
  const submitReceipt = async () => {
    if (!batchId || !confirmation || submitting.current) return;
    submitting.current = true;
    setSaveError('');
    setSaving(true);
    try {
      await warehouseService.confirmReceipt(batchId, confirmation);
      setConfirmation(null);
      toast.success('Đã lập phiếu nhận kho và ghi transaction RECEIPT.');
      nav(`/warehouse/storage/${batchId}`);
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Không xác nhận được batch. Vui lòng thử lại.');
    } finally {
      submitting.current = false;
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
              <span>Khối lượng bàn giao</span>
              <strong>
                <Scale size={14} />
                {batch.expectedWeightKg} kg
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
        <section className="ops-panel glass warehouse-receipt-form">
          <span className="ops-panel-label">Biên bản thực nhận</span>
          <div className="ops-field">
            <label>Khối lượng thực nhận (kg)</label>
            <input
              type="number"
              min={batch.expectedWeightKg}
              max={batch.expectedWeightKg}
              step=".01"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
            {Number(weight.toFixed(2)) !== Number(batch.expectedWeightKg.toFixed(2)) && (
              <small style={{ color: 'var(--color-danger)' }}>
                Khối lượng phải đúng bằng {batch.expectedWeightKg} kg, không được lớn hơn hoặc nhỏ hơn.
              </small>
            )}
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
            disabled={saving
              || Number(weight.toFixed(2)) !== Number(batch.expectedWeightKg.toFixed(2))}
            onClick={confirm}
          >
            <Scale size={16} />
            {saving ? 'Đang ghi nhận...' : 'Xác nhận nhận hàng vật lý'}
          </button>
        </section>
      </div>
      {confirmation && createPortal(<Modal isOpen title="Xác nhận nhận hàng vật lý"
        className="warehouse-receipt-confirmation"
        onClose={() => { if (!submitting.current) setConfirmation(null); }}
        footer={<>
          <button type="button" className="ops-btn ops-btn-secondary" disabled={saving} onClick={() => setConfirmation(null)}>Quay lại chỉnh sửa</button>
          <button type="button" className="ops-btn ops-btn-primary" autoFocus disabled={saving} onClick={() => void submitReceipt()}>{saving ? 'Đang ghi nhận...' : 'Xác nhận nhận hàng'}</button>
        </>}>
        <div className="warehouse-receipt-summary">
          <p className="warehouse-receipt-wide">Vui lòng kiểm tra thông tin trước khi ghi nhận hàng vào kho.</p>
          <div className="ops-kv warehouse-receipt-wide"><span>Mã batch</span><strong>{batch.batchCode}</strong></div>
          <div className="ops-kv"><span>Khối lượng bàn giao</span><strong>{batch.expectedWeightKg} kg</strong></div>
          <div className="ops-kv"><span>Khối lượng thực nhận</span><strong>{confirmation.actualWeightKg} kg</strong></div>
          <div className="ops-kv"><span>Số lượng item theo bàn giao</span><strong>{confirmation.actualItemCount}</strong></div>
          <div className="ops-kv"><span>Niêm phong</span><strong>{confirmation.sealIntact ? 'Nguyên vẹn' : 'Có bất thường'}</strong></div>
          <div className="ops-kv warehouse-receipt-wide"><span>Sai lệch / ghi chú nhận hàng</span><strong style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{confirmation.discrepancyNotes.trim() || 'Không có'}</strong></div>
          {saveError && <p className="warehouse-receipt-wide" role="alert" style={{ color: 'var(--color-danger)' }}>{saveError}</p>}
        </div>
      </Modal>, document.body)}
    </div>
  );
}
