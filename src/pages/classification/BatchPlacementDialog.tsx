import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Modal } from '@/components/common/Modal';
import {
  classificationService,
  type ClassificationAreaLayout,
  type GroupedClassifiedBatch,
} from '@/services/classificationService';

export default function BatchPlacementDialog({
  batch,
  onClose,
  onSaved,
}: {
  batch: GroupedClassifiedBatch;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [layout, setLayout] = useState<ClassificationAreaLayout>();
  const [areaId, setAreaId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const report = (e: unknown) =>
    setError(
      isAxiosError<{ message?: string }>(e)
        ? e.response?.data?.message || 'Không kết nối được máy chủ.'
        : 'Không thể xếp batch vào khu.',
    );
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setLayout(undefined);
    classificationService
      .getClassifiedAreaLayout()
      .then((data) => {
        if (active) setLayout(data);
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
  const area = layout?.areas.find((a) => a.id === areaId);
  const group = area?.groups.find((g) => g.id === groupId);
  const location = group?.locations.find((l) => l.id === locationId);
  const available =
    area && group && location
      ? Math.max(
          0,
          Math.min(
            area.capacityKg - area.currentKg,
            group.capacityKg - group.currentKg,
            location.capacityKg - location.currentWeightKg,
          ),
        )
      : 0;
  async function submit() {
    if (submitting.current || !location || !area || !group) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await classificationService.placeGroupedBatch(
        batch.id,
        area.id,
        group.id,
        location.id,
        Number(weight),
      );
      await onSaved();
      onClose();
    } catch (e) {
      report(e);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      title="Xếp vào khu đồ đã phân loại"
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
        <p>Chọn vị trí và nhập khối lượng cân thực tế của batch.</p>
        {error && (
          <div role="alert">
            {error}
            <button
              type="button"
              className="ops-btn ops-btn-secondary"
              disabled={busy}
              onClick={() => setRetry((n) => n + 1)}
            >
              Tải lại vị trí
            </button>
          </div>
        )}
        {loading ? (
          <p>Đang tải khu vực...</p>
        ) : (
          layout &&
          !layout.areas.length && (
            <p>Chưa có khu đồ đã phân loại. Manager cần cấu hình khu, dãy và vị trí trước.</p>
          )
        )}
        <div className="ops-field">
          <label htmlFor="placement-area">Khu đồ đã phân loại *</label>
          <select
            id="placement-area"
            required
            disabled={loading || busy}
            value={areaId}
            onChange={(e) => {
              setAreaId(e.target.value);
              setGroupId('');
              setLocationId('');
            }}
          >
            <option value="">Chọn khu</option>
            {layout?.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.areaName}
              </option>
            ))}
          </select>
        </div>
        <div className="ops-field">
          <label htmlFor="placement-group">Dãy *</label>
          <select
            id="placement-group"
            required
            disabled={!area || busy}
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setLocationId('');
            }}
          >
            <option value="">Chọn dãy</option>
            {area?.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.groupName}
              </option>
            ))}
          </select>
        </div>
        <div className="ops-field">
          <label htmlFor="placement-location">Vị trí *</label>
          <select
            id="placement-location"
            required
            disabled={!group || busy}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Chọn vị trí</option>
            {group?.locations
              .filter((l) => l.status === 'Available')
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationCode} · còn {Math.max(0, l.capacityKg - l.currentWeightKg)} kg
                </option>
              ))}
          </select>
        </div>
        <div className="ops-field">
          <label htmlFor="placement-weight">Khối lượng thực tế (kg) *</label>
          <input
            id="placement-weight"
            type="number"
            min="0.01"
            step="0.01"
            max={available || undefined}
            required
            disabled={busy}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          {location && <small>Sức chứa còn lại của vị trí/dãy/khu: {available} kg.</small>}
        </div>
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
            className="ops-btn ops-btn-primary"
            disabled={
              busy || loading || !location || !(Number(weight) > 0) || Number(weight) > available
            }
          >
            {busy ? 'Đang xếp...' : 'Xác nhận vị trí'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
