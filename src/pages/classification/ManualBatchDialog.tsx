import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Modal } from '@/components/common/Modal';
import {
  classificationService,
  type ClassificationCatalog,
  type GroupedClassifiedBatch,
} from '@/services/classificationService';

export default function ManualBatchDialog({
  batch,
  mode,
  catalog,
  onClose,
  onSaved,
}: {
  batch: GroupedClassifiedBatch;
  mode: 'edit' | 'delete';
  catalog: ClassificationCatalog | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    garmentGroupId: '',
    genderId: '',
    targetUserId: '',
    conditionGradeId: '',
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(batch.totalItem);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const submitting = useRef(false);
  const report = (e: unknown) =>
    setError(
      isAxiosError<{ message?: string }>(e)
        ? e.response?.data?.message || 'Không kết nối được máy chủ. Vui lòng thử lại.'
        : 'Không thể cập nhật batch.',
    );
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoaded(false);
    setError('');
    classificationService
      .getGroupedBatch(batch.id)
      .then((data) => {
        if (!active) return;
        setCount(data.items.length);
        setForm({
          garmentGroupId: data.garmentGroupId || '',
          genderId: data.genderId || '',
          targetUserId: data.targetUserId || '',
          conditionGradeId: data.conditionGradeId || '',
        });
        setLoaded(true);
      })
      .catch((e) => {
        if (active) report(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [batch.id, retry]);
  async function submit() {
    if (submitting.current || !loaded) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (mode === 'edit') await classificationService.updateManualBatch(batch.id, form);
      else await classificationService.deleteManualBatch(batch.id);
      await onSaved();
      onClose();
    } catch (e) {
      report(e);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const fields = [
    { key: 'garmentGroupId' as const, label: 'Loại', options: catalog?.garmentGroups },
    { key: 'genderId' as const, label: 'Giới tính', options: catalog?.genders },
    { key: 'targetUserId' as const, label: 'Đối tượng', options: catalog?.targetUsers },
    { key: 'conditionGradeId' as const, label: 'Nhãn A/B/C', options: catalog?.conditionGrades },
  ];
  return (
    <Modal
      isOpen
      title={mode === 'edit' ? 'Cập nhật Classified Batch' : 'Xóa Classified Batch'}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
    >
      <form
        className="manual-batch-dialog-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <strong>{batch.batchCode}</strong>
        {error && (
          <div role="alert">
            {error}
            <button
              type="button"
              className="ops-btn ops-btn-secondary"
              disabled={busy}
              onClick={() => setRetry((x) => x + 1)}
            >
              Tải lại batch
            </button>
          </div>
        )}
        {loading ? (
          <p>Đang tải batch...</p>
        ) : mode === 'delete' ? (
          <p>
            Bạn muốn xóa batch này? {count} món trong batch sẽ được trả về danh sách chờ gom nhóm,
            vẫn giữ kết quả phân loại.
          </p>
        ) : (
          <>
            <p>
              Các món đang có phải khớp thuộc tính mới. Mã batch được giữ nguyên để theo dõi lịch
              sử.
            </p>
            <div className="ops-form-grid two-col">
              {fields.map((field) => (
                <div className="ops-field" key={field.key}>
                  <label htmlFor={`edit-${field.key}`}>{field.label} *</label>
                  <select
                    id={`edit-${field.key}`}
                    required
                    disabled={busy || !loaded}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  >
                    <option value="">Chọn {field.label.toLowerCase()}</option>
                    {!field.options?.some((o) => o.id === form[field.key]) && form[field.key] && (
                      <option value={form[field.key]} disabled>
                        Thuộc tính đã ngừng sử dụng — chọn lại
                      </option>
                    )}
                    {field.options?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="ops-actions">
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className={`ops-btn ${mode === 'delete' ? 'ops-btn-danger' : 'ops-btn-primary'}`}
            disabled={!loaded || busy || (mode === 'edit' && Object.values(form).some((x) => !x))}
          >
            {busy ? 'Đang xử lý...' : mode === 'edit' ? 'Lưu thay đổi' : 'Xác nhận xóa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
