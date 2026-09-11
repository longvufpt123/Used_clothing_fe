import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Recycle, X, Plus } from 'lucide-react';
import {
  processingService,
  type ProcessingDetail,
  type RecyclingReceiptOptions,
} from '@/services/processingService';
import { getStatusLabel } from '@/utils/statusLabels';
import { parseVietnamTimestamp } from '@/utils/dateTime';

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const date = (value?: string) =>
  value ? parseVietnamTimestamp(value)?.toLocaleDateString('vi-VN') : 'Chưa xác nhận';
type Row = {
  outputId: string;
  description: string;
  quantity: string;
  weight: string;
  storageLocationId: string;
  notes: string;
};
const blank = (): Row => ({
  outputId: crypto.randomUUID(),
  description: '',
  quantity: '',
  weight: '',
  storageLocationId: '',
  notes: '',
});

export default function RecyclingReturnPanel({
  detail,
  mode,
  onChanged,
}: {
  detail: ProcessingDetail;
  mode: string;
  onChanged: () => Promise<void>;
}) {
  const data = detail.recyclingReturn;
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [options, setOptions] = useState<RecyclingReceiptOptions>();
  const [expectedDate, setExpectedDate] = useState(
    data?.expectedReturnDate?.slice(0, 10) || today(),
  );
  const [notes, setNotes] = useState(data?.notes || '');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [completion, setCompletion] = useState('');
  const [shift, setShift] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const fail = (e: unknown) =>
    setError(
      isAxiosError<{ message?: string }>(e)
        ? e.response?.data?.message || 'Không kết nối được máy chủ. Vui lòng thử lại.'
        : 'Không thể cập nhật chuyến trả hàng.',
    );
  useEffect(() => {
    if (!action) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, [action]);
  useEffect(() => {
    if (action !== 'receive') return;
    let active = true;
    setLoading(true);
    setOptions(undefined);
    processingService
      .returnReceiptOptions(detail.id)
      .then((result) => {
        if (active) {
          setOptions(result);
          setError('');
        }
      })
      .catch((e) => {
        if (active) fail(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [action, detail.id, retry]);
  if (
    detail.operationType !== 'Recycling' ||
    !['OrganizationReceived', 'ReturnScheduled', 'ReturnInTransit', 'ReturnReceived'].includes(
      detail.status,
    )
  )
    return null;
  function open(next: string) {
    setError('');
    setRows(
      next === 'receive'
        ? (data?.batches || []).map((b) => ({
            outputId: b.outputId,
            description: b.description,
            quantity: String(b.quantity),
            weight: String(b.weight),
            storageLocationId: '',
            notes: '',
          }))
        : [blank()],
    );
    setAction(next);
  }
  const update = (index: number, key: keyof Row, value: string) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (action === 'schedule')
        await processingService.scheduleReturn(detail.id, {
          expectedReturnDate: expectedDate,
          notes,
        });
      else if (action === 'dispatch')
        await processingService.dispatchReturn(detail.id, {
          carrierName: carrier.trim(),
          trackingCode: tracking.trim(),
          completionNotes: completion.trim(),
          batches: rows.map((r) => ({
            description: r.description.trim(),
            quantity: Number(r.quantity),
            weight: Number(r.weight),
          })),
        });
      else
        await processingService.receiveReturn(detail.id, {
          shiftId: shift,
          batches: rows.map((r) => ({
            outputId: r.outputId,
            storageLocationId: r.storageLocationId,
            quantity: Number(r.quantity),
            weight: Number(r.weight),
            notes: r.notes.trim(),
          })),
        });
      setAction('');
      await onChanged();
    } catch (e) {
      fail(e);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const title =
    action === 'schedule'
      ? 'Xác nhận ngày trả đồ tái chế'
      : action === 'dispatch'
        ? 'Gửi đồ tái chế về kho'
        : 'Nhận đồ tái chế và xếp vị trí';
  return (
    <section className="ops-panel">
      <div className="processing-sectionhead">
        <h2>
          <Recycle size={19} /> Đồ tái chế trả về
        </h2>
        <div className="processing-actions">
          {mode === 'organization' &&
            ['OrganizationReceived', 'ReturnScheduled'].includes(detail.status) && (
              <button className="processing-button" onClick={() => open('schedule')}>
                {data?.expectedReturnDate ? 'Điều chỉnh ngày trả' : 'Xác nhận ngày trả'}
              </button>
            )}
          {mode === 'organization' && detail.status === 'ReturnScheduled' && (
            <button className="processing-button primary" onClick={() => open('dispatch')}>
              Gửi hàng về kho
            </button>
          )}
          {mode === 'warehouse' && detail.status === 'ReturnInTransit' && (
            <button className="processing-button primary" onClick={() => open('receive')}>
              Nhận đồ tái chế về kho
            </button>
          )}
          {mode === 'manager' && detail.status === 'ReturnReceived' && (
            <Link className="processing-button primary" to="/manager/classification-dispatch">
              Phân công phân loại lại
            </Link>
          )}
        </div>
      </div>
      <p className="processing-note">
        Hẹn ngày trả → gửi về kho → nhận vào khu đồ đã tái chế → manager phân công → phân loại lại
        theo luồng hiện có.
      </p>
      <div className="ops-kv-grid">
        <div className="ops-kv">
          <span>Ngày trả dự kiến</span>
          <strong>{date(data?.expectedReturnDate)}</strong>
        </div>
        <div className="ops-kv">
          <span>Đã gửi về</span>
          <strong>{date(data?.dispatchedAt)}</strong>
        </div>
        <div className="ops-kv">
          <span>Kho nhận về</span>
          <strong>{date(data?.receivedAt)}</strong>
        </div>
        <div className="ops-kv">
          <span>Vận chuyển chiều về</span>
          <strong>
            {data?.carrierName || 'Chưa gửi'} {data?.trackingCode && `· ${data.trackingCode}`}
          </strong>
        </div>
      </div>
      {data?.notes && <p className="processing-note">{data.notes}</p>}
      {!!data?.batches.length && (
        <div className="processing-table-scroll">
          <table className="processing-table">
            <thead>
              <tr>
                <th>Batch / mô tả</th>
                <th>Tổ chức gửi</th>
                <th>Kho thực nhận</th>
                <th>Vị trí / đội phân loại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.batches.map((b) => (
                <tr key={b.outputId}>
                  <td>
                    <strong>{b.batchCode || b.description}</strong>
                    {b.batchCode && <div>{b.description}</div>}
                    {b.receiptNotes && <small>{b.receiptNotes}</small>}
                  </td>
                  <td>
                    {b.quantity} đồ · {b.weight} kg
                  </td>
                  <td>
                    {b.intakeBatchId
                      ? `${b.receivedQuantity} đồ · ${b.receivedWeight} kg`
                      : 'Chưa nhận'}
                  </td>
                  <td>
                    {b.areaName || 'Chưa xếp vị trí'} {b.locationCode && `· ${b.locationCode}`}
                    <div>{b.classificationTeamName}</div>
                  </td>
                  <td>{b.status ? getStatusLabel(b.status) : 'Đang gửi về'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {action && (
        <dialog
          ref={dialog}
          className="ghn-create-modal processing-ghn-dialog"
          aria-labelledby="recycling-return-title"
          onCancel={(e) => {
            e.preventDefault();
            if (!submitting.current) setAction('');
          }}
        >
          <header>
            <div>
              <span>ĐỒ TÁI CHẾ TRẢ VỀ</span>
              <h2 id="recycling-return-title">{title}</h2>
              <p>
                {detail.operationCode} · {detail.warehouseName}
              </p>
            </div>
            <button aria-label="Đóng" disabled={busy} onClick={() => setAction('')}>
              <X />
            </button>
          </header>
          <form
            className="processing-confirm"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {error && (
              <div className="processing-alert" role="alert">
                {error}
                {action === 'receive' && (
                  <button
                    type="button"
                    className="processing-button"
                    onClick={() => setRetry((x) => x + 1)}
                  >
                    Tải lại vị trí
                  </button>
                )}
              </div>
            )}
            <fieldset className="processing-ghn-fields" disabled={busy || loading}>
              {action === 'schedule' ? (
                <>
                  <div className="ops-field">
                    <label htmlFor="return-date">Ngày trả dự kiến *</label>
                    <input
                      id="return-date"
                      type="date"
                      min={today()}
                      required
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>
                  <div className="ops-field">
                    <label htmlFor="return-notes">Ghi chú lịch trả</label>
                    <textarea
                      id="return-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {action === 'dispatch' ? (
                    <>
                      <p className="processing-note">
                        Khai báo các batch thực tế gửi về. Nếu tự vận chuyển, nhập tên đơn vị và mã
                        biên bản bàn giao.
                      </p>
                      <div className="ops-form-grid two-col">
                        <div className="ops-field">
                          <label htmlFor="return-carrier">Đơn vị vận chuyển *</label>
                          <input
                            id="return-carrier"
                            required
                            maxLength={100}
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                          />
                        </div>
                        <div className="ops-field">
                          <label htmlFor="return-tracking">Mã vận đơn / biên bản *</label>
                          <input
                            id="return-tracking"
                            required
                            maxLength={100}
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="ops-field">
                        <label htmlFor="return-result">Kết quả tái chế *</label>
                        <textarea
                          id="return-result"
                          required
                          value={completion}
                          onChange={(e) => setCompletion(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="processing-note">
                        Nhập số thực nhận và chọn vị trí trong khu đồ đã tái chế. Các batch sẽ chờ
                        manager phân công, chưa trở thành tồn kho sẵn dùng.
                      </p>
                      {!loading &&
                        options &&
                        (!options.locations.length || !options.shifts.length) && (
                          <p className="processing-alert">
                            Cần có ca làm việc hôm nay và vị trí trong khu “Đồ đã tái chế”. Manager
                            có thể cấu hình khu, dãy và vị trí trong quản lý kho.
                          </p>
                        )}
                      <div className="ops-field">
                        <label htmlFor="return-shift">Ca nhận hàng *</label>
                        <select
                          id="return-shift"
                          required
                          value={shift}
                          onChange={(e) => setShift(e.target.value)}
                        >
                          <option value="">Chọn ca hôm nay</option>
                          {options?.shifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {rows.map((row, index) => {
                    const source = data?.batches.find((b) => b.outputId === row.outputId);
                    const difference =
                      action === 'receive' &&
                      source &&
                      (Number(row.quantity) !== source.quantity ||
                        Number(row.weight) !== source.weight);
                    return (
                      <div className="ops-panel processing-return-row" key={row.outputId}>
                        <div className="processing-sectionhead">
                          <h3>Batch {index + 1}</h3>
                          {action === 'dispatch' && rows.length > 1 && (
                            <button
                              type="button"
                              className="processing-button"
                              onClick={() => setRows(rows.filter((_, i) => i !== index))}
                            >
                              Bỏ batch
                            </button>
                          )}
                        </div>
                        {action === 'dispatch' ? (
                          <div className="ops-field">
                            <label htmlFor={`return-description-${index}`}>Mô tả batch *</label>
                            <input
                              id={`return-description-${index}`}
                              required
                              maxLength={500}
                              value={row.description}
                              onChange={(e) => update(index, 'description', e.target.value)}
                            />
                          </div>
                        ) : (
                          <p>
                            {row.description} · Đã gửi {source?.quantity} đồ / {source?.weight} kg
                          </p>
                        )}
                        <div className="ops-form-grid two-col">
                          <div className="ops-field">
                            <label htmlFor={`return-quantity-${index}`}>
                              Số lượng {action === 'receive' ? 'thực nhận' : 'gửi'} *
                            </label>
                            <input
                              id={`return-quantity-${index}`}
                              type="number"
                              min={1}
                              step={1}
                              max={2147483647}
                              required
                              value={row.quantity}
                              onChange={(e) => update(index, 'quantity', e.target.value)}
                            />
                          </div>
                          <div className="ops-field">
                            <label htmlFor={`return-weight-${index}`}>Khối lượng (kg) *</label>
                            <input
                              id={`return-weight-${index}`}
                              type="number"
                              min={0.01}
                              max={1000000}
                              step={0.01}
                              required
                              value={row.weight}
                              onChange={(e) => update(index, 'weight', e.target.value)}
                            />
                          </div>
                        </div>
                        {action === 'receive' && (
                          <>
                            <div className="ops-field">
                              <label htmlFor={`return-location-${index}`}>
                                Vị trí đồ đã tái chế *
                              </label>
                              <select
                                id={`return-location-${index}`}
                                required
                                value={row.storageLocationId}
                                onChange={(e) => update(index, 'storageLocationId', e.target.value)}
                              >
                                <option value="">Chọn vị trí</option>
                                {options?.locations.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.areaName} · {l.code} · còn {l.availableKg} kg
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="ops-field">
                              <label htmlFor={`return-receipt-notes-${index}`}>
                                {difference ? 'Lý do chênh lệch *' : 'Ghi chú thực nhận'}
                              </label>
                              <textarea
                                id={`return-receipt-notes-${index}`}
                                required={!!difference}
                                value={row.notes}
                                onChange={(e) => update(index, 'notes', e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {action === 'dispatch' && (
                    <button
                      type="button"
                      className="processing-button"
                      disabled={rows.length >= 100}
                      onClick={() => setRows([...rows, blank()])}
                    >
                      <Plus size={16} /> Thêm batch trả về
                    </button>
                  )}
                </>
              )}
              <div className="processing-actions">
                <button type="button" className="processing-button" onClick={() => setAction('')}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="processing-button primary"
                  disabled={
                    busy ||
                    loading ||
                    (action === 'receive' && (!options || !shift || !rows.length))
                  }
                >
                  {busy ? 'Đang lưu...' : loading ? 'Đang tải...' : 'Xác nhận'}
                </button>
              </div>
            </fieldset>
          </form>
        </dialog>
      )}
    </section>
  );
}
