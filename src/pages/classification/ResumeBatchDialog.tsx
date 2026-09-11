import { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Modal } from '@/components/common/Modal';
import {
  classificationService,
  type CurrentClassificationTeam,
  type ClassificationBatchSummary,
} from '@/services/classificationService';

export default function ResumeBatchDialog({
  batch,
  teams,
  onClose,
  onSaved,
}: {
  batch: ClassificationBatchSummary;
  teams: CurrentClassificationTeam[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const available = teams.filter((t) => t.status === 'InProgress');
  const [teamId, setTeamId] = useState(available.length === 1 ? available[0].id : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function submit() {
    if (!teamId || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await classificationService.resumeBatch(batch.id, teamId);
      await onSaved();
      onClose();
    } catch (e) {
      setError(
        isAxiosError<{ message?: string }>(e)
          ? e.response?.data?.message || 'Không thể kết nối máy chủ.'
          : 'Không thể chuyển lô sang ca hiện tại.',
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      title="Tiếp tục lô từ ca trước"
      onClose={() => {
        if (!submitting.current) onClose();
      }}
    >
      <form
        className="classification-resume-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <p>
          <strong>{batch.batchCode}</strong> · {batch.classifiedItems} món đã phân loại.
        </p>
        <p>
          Chuyển lô sang team trong ca hiện tại. Giữ nguyên kết quả kiểm đếm, các món đã phân loại
          và vị trí của lô.
        </p>
        {error && <p role="alert">{error}</p>}
        {available.length ? (
          <div className="ops-field">
            <label htmlFor="resume-team">Team tiếp tục phân loại *</label>
            <select
              id="resume-team"
              required
              disabled={busy}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="">Chọn team đang làm việc</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teamName} · {t.startTime.slice(0, 5)}–{t.endTime.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p>
            Bạn chưa có team đang làm việc hôm nay. Bắt đầu ca ở phần đầu trang; nếu chưa được xếp
            ca, manager cần phân công bạn vào team cùng kho.
          </p>
        )}
        <div className="ops-actions">
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Đóng
          </button>
          <button type="submit" className="ops-btn ops-btn-primary" disabled={busy || !teamId}>
            {busy ? 'Đang chuyển...' : 'Tiếp tục trong ca hiện tại'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
