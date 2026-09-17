import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/common/Modal';
import { classificationService, type GroupedClassifiedBatchDetail } from '@/services/classificationService';

export default function FinalizeBatchDialog({ batch, onClose, onSaved }: {
  batch: GroupedClassifiedBatchDetail; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [weight, setWeight] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const weightError = !weight ? 'Vui lòng nhập khối lượng thực tế.'
    : !/^\d+(?:\.\d{1,2})?$/.test(weight) || !Number.isFinite(Number(weight))
      ? 'Nhập khối lượng hợp lệ, tối đa 2 chữ số thập phân.'
      : Number(weight) < 10 ? 'Batch phải từ 10 kg trở lên để hoàn tất gom nhóm.' : '';
  async function submit() {
    setTouched(true);
    if (submitting.current || weightError) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await classificationService.finalizeManualBatch(batch.id, Number(weight));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể hoàn tất gom nhóm. Vui lòng thử lại.');
      submitting.current = false;
      setBusy(false);
      return;
    }
    onClose();
    await onSaved();
  }
  return createPortal(<Modal isOpen title="Xác nhận hoàn tất gom nhóm" onClose={() => { if (!submitting.current) onClose(); }}>
    <form className="manual-batch-dialog-form" noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <strong>{batch.batchCode}</strong>
      <p>{batch.items.length} item · Nhãn {batch.conditionGrade}</p>
      <div className="ops-field">
        <label htmlFor="finalize-weight">Khối lượng thực tế của batch (kg) *</label>
        <input id="finalize-weight" autoFocus type="text" inputMode="decimal" value={weight} disabled={busy}
          aria-invalid={touched && !!weightError} aria-describedby="finalize-weight-help" onBlur={() => setTouched(true)}
          onChange={(e) => { const value = e.target.value.replace(',', '.');
            if (/^\d*(?:\.\d{0,2})?$/.test(value)) { setWeight(value); setTouched(true); }
            else e.currentTarget.value = weight;
          }} placeholder="Nhập khối lượng đã cân" />
        <small id="finalize-weight-help" style={touched && weightError ? { color: 'var(--color-danger)' } : undefined}>
          {touched && weightError ? weightError : 'Tối thiểu 10 kg mỗi batch. Khối lượng này được dùng khi xếp vào khu.'}
        </small>
      </div>
      {error && <p role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <div className="ops-actions">
        <button type="button" className="ops-btn ops-btn-secondary" disabled={busy} onClick={onClose}>Tiếp tục gom nhóm</button>
        <button type="submit" className="ops-btn ops-btn-primary" disabled={busy || !!weightError}>{busy ? 'Đang lưu...' : 'Xác nhận hoàn tất'}</button>
      </div>
    </form>
  </Modal>, document.body);
}
