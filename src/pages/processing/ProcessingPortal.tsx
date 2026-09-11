import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Package,
  Plus,
  Recycle,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import {
  processingService,
  type ProcessingCatalog,
  type ProcessingDetail,
  type ProcessingOperation,
  type ProcessingType,
} from '@/services/processingService';
import { useToast } from '@/context/ToastContext';
import { parseVietnamTimestamp } from '@/utils/dateTime';
import Pagination from '@/components/common/Pagination';
import ProcessingGhnPanel from './ProcessingGhnPanel';
import RecyclingReturnPanel from './RecyclingReturnPanel';
import '@/styles/ops-shared.css';
import './ProcessingPortal.css';

type Mode = 'manager' | 'organization' | 'warehouse';
const labels: Record<string, string> = {
  PendingOrganizationApproval: 'Chờ tổ chức phản hồi',
  PendingManagerApproval: 'Chờ quản lý duyệt',
  Approved: 'Chờ xuất kho',
  Issued: 'Đã xuất kho',
  ReadyForGhn: 'Chờ tạo vận đơn GHN',
  GhnBooked: 'GHN chờ lấy hàng',
  InTransit: 'GHN đang vận chuyển',
  Delivered: 'GHN đã giao hàng',
  DeliveryException: 'Giao hàng cần kiểm tra',
  ShipmentCancelled: 'Vận đơn đã hủy',
  Returned: 'GHN đã hoàn hàng',
  OrganizationReceived: 'Tổ chức đã nhận',
  ReturnScheduled: 'Đã hẹn ngày trả',
  ReturnInTransit: 'Đang gửi đồ tái chế về',
  ReturnReceived: 'Đã nhận về · phân loại lại',
  Completed: 'Đã hoàn thành',
  RejectedByOrganization: 'Tổ chức từ chối',
  RejectedByManager: 'Quản lý từ chối',
  Rejected: 'Đã từ chối',
  Cancelled: 'Đã hủy',
};
const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const date = (value?: string) =>
  parseVietnamTimestamp(value)?.toLocaleString('vi-VN') ?? 'Chưa thực hiện';
const errorText = (error: unknown) =>
  isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
    : 'Không thể hoàn thành thao tác. Vui lòng thử lại.';
function Badge({ status }: { status: string }) {
  const style =
    status.startsWith('Rejected') || status === 'Cancelled'
      ? 'danger'
      : status === 'Completed'
        ? 'success'
        : status === 'Approved'
          ? 'info'
          : 'pending';
  return <span className={`processing-status ${style}`}>{labels[status] || status}</span>;
}
function Direction({ type }: { type: ProcessingType }) {
  return (
    <span className={`ops-badge processing-${type.toLowerCase()}`}>
      {type === 'Recycling' ? 'B · Tái chế' : 'C · Tiêu hủy'}
    </span>
  );
}

export default function ProcessingPortal({ mode }: { mode: Mode }) {
  const { operationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/${mode}/processing-operations`;
  const [list, setList] = useState<ProcessingOperation[]>([]);
  const [detail, setDetail] = useState<ProcessingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [direction, setDirection] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);
  const actionDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!action) return;
    const element = actionDialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [action]);
  const generation = useRef(0);
  const invalidateLoad = useCallback(() => {
    generation.current += 1;
  }, []);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    setDetail(null);
    try {
      if (operationId) {
        const data = await processingService.detail(operationId);
        if (generation.current === current) setDetail(data);
      } else {
        const data = await processingService.list();
        if (generation.current === current) setList(data);
      }
    } catch (e) {
      if (generation.current === current) setError(errorText(e));
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [operationId]);
  useEffect(() => {
    setAction('');
    setNotes('');
    setCreating(false);
    void reload();
    return invalidateLoad;
  }, [reload, invalidateLoad]);
  const filtered = useMemo(
    () =>
      list.filter(
        (x) =>
          (!status || x.status === status) &&
          (!direction || x.operationType === direction) &&
          `${x.operationCode} ${x.organizationName} ${x.warehouseName}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [list, status, direction, search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const activePage = Math.min(page, totalPages);
  const shown = filtered.slice((activePage - 1) * 8, activePage * 8);
  const actions: { path: string; label: string; danger?: boolean }[] = [];
  if (detail) {
    if (mode === 'manager') {
      if (detail.status === 'PendingManagerApproval')
        actions.push(
          { path: 'manager/approve', label: 'Duyệt xuất kho' },
          { path: 'manager/reject', label: 'Từ chối', danger: true },
        );
      if (
        ['PendingOrganizationApproval', 'PendingManagerApproval', 'Approved'].includes(
          detail.status,
        )
      )
        actions.push({ path: 'cancel', label: 'Hủy yêu cầu', danger: true });
    }
    if (mode === 'organization') {
      if (detail.status === 'PendingOrganizationApproval')
        actions.push(
          { path: 'organization/approve', label: 'Đồng ý tiếp nhận' },
          { path: 'organization/reject', label: 'Từ chối', danger: true },
        );
      if (['Issued', 'ReadyForGhn', 'GhnBooked', 'InTransit', 'Delivered', 'DeliveryException'].includes(detail.status))
        actions.push({
          path: 'organization/receive',
          label: 'Xác nhận đã nhận hàng',
        });
      if (detail.status === 'OrganizationReceived' && detail.operationType === 'Disposal')
        actions.push({
          path: 'organization/complete',
          label: 'Ghi nhận hoàn tất xử lý',
        });
    }
    if (mode === 'warehouse' && detail.status === 'Approved')
      actions.push({ path: 'issue', label: 'Xác nhận xuất kho' });
  }
  const needsNotes =
    action.endsWith('reject') || action === 'cancel' || action.endsWith('complete');
  async function submitAction() {
    if (!detail || mutation.current || !action || (needsNotes && !notes.trim())) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      await processingService.action(
        detail.id,
        action,
        action.endsWith('complete')
          ? { completionNotes: notes.trim() }
          : action === 'issue'
            ? {
                notes: notes.trim(),
              }
            : { rejectionReason: notes.trim() },
      );
      toast.success('Đã cập nhật yêu cầu xử lý.');
      setAction('');
      setNotes('');
      await reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="ops-page processing-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Vận hành xử lý</span>
          <h1>
            {operationId ? detail?.operationCode || 'Chi tiết yêu cầu' : 'Tái chế & tiêu hủy'}
          </h1>
          <p>
            {mode === 'manager'
              ? 'Điều phối batch nhãn B và C đến đúng tổ chức xử lý.'
              : mode === 'warehouse'
                ? 'Xuất nguyên batch theo yêu cầu đã được tổ chức và quản lý duyệt.'
                : 'Phản hồi yêu cầu, xác nhận nhận hàng và cập nhật kết quả xử lý.'}
          </p>
        </div>
        <div className="processing-actions">
          {operationId ? (
            <Link className="processing-button" to={base}>
              <ArrowLeft size={16} />
              Danh sách
            </Link>
          ) : (
            mode === 'manager' && (
              <button className="processing-button primary" onClick={() => setCreating(!creating)}>
                <Plus size={16} />
                {creating ? 'Đóng biểu mẫu' : 'Tạo yêu cầu'}
              </button>
            )
          )}
          <button
            className="processing-button"
            disabled={loading || busy}
            onClick={() => void reload()}
            aria-label="Tải lại"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      {error && (
        <div className="processing-alert" role="alert">
          {error}
          <button
            className="processing-button"
            disabled={busy}
            onClick={() => {
              setAction('');
              void reload();
            }}
          >
            Tải lại
          </button>
        </div>
      )}
      {creating && !operationId && (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreated={(id) => navigate(`${base}/${id}`)}
        />
      )}
      {loading ? (
        <div className="ops-empty" role="status">
          <RefreshCw size={24} />
          <p>Đang tải yêu cầu xử lý...</p>
        </div>
      ) : operationId ? (
        detail && (
          <>
            <section className="ops-panel">
              <div className="processing-sectionhead">
                <Direction type={detail.operationType} />
                <Badge status={detail.status} />
              </div>
              <div className="ops-kv-grid">
                <div className="ops-kv">
                  <span>Tổ chức tiếp nhận</span>
                  <strong>{detail.organizationName}</strong>
                </div>
                <div className="ops-kv">
                  <span>Kho xuất hàng</span>
                  <strong>{detail.warehouseName}</strong>
                </div>
                <div className="ops-kv">
                  <span>Tổng khối lượng</span>
                  <strong>
                    {number(detail.inputs.reduce((sum, x) => sum + x.requestedWeight, 0))} kg ·{' '}
                    {detail.inputs.length} batch
                  </strong>
                </div>
                <div className="ops-kv">
                  <span>Ngày tạo</span>
                  <strong>{date(detail.requestedAt)}</strong>
                </div>
              </div>
              {detail.requestNotes && (
                <p className="processing-note">
                  <strong>Ghi chú yêu cầu: </strong>
                  {detail.requestNotes}
                </p>
              )}
              {(detail.organizationRejectionReason || detail.managerRejectionReason) && (
                <p className="processing-alert">
                  {detail.organizationRejectionReason || detail.managerRejectionReason}
                </p>
              )}
              {detail.completionNotes && (
                <p className="processing-note">
                  <strong>Kết quả xử lý: </strong>
                  {detail.completionNotes}
                </p>
              )}
              {(detail.trackingCode || detail.carrierName) && (
                <p className="processing-note">
                  Vận chuyển: {detail.carrierName || 'Chưa ghi đơn vị'} ·{' '}
                  {detail.trackingCode || 'Chưa có mã vận đơn'}
                </p>
              )}
            </section>
            <ProcessingGhnPanel key={detail.id} detail={detail} mode={mode} onChanged={reload} />
            <RecyclingReturnPanel key={`return-${detail.id}`} detail={detail} mode={mode} onChanged={reload} />
            <section className="ops-panel">
              <h2>Tiến trình xử lý</h2>
              <ol className="processing-timeline">
                {[
                  ['Tạo yêu cầu', detail.requestedAt],
                  [
                    detail.status === 'RejectedByOrganization'
                      ? 'Tổ chức từ chối'
                      : 'Tổ chức phản hồi',
                    detail.organizationRespondedAt,
                  ],
                  [
                    detail.status === 'RejectedByManager' ? 'Quản lý từ chối' : 'Quản lý duyệt',
                    detail.managerRespondedAt,
                  ],
                  ['Xuất kho', detail.issuedAt],
                  ['Tổ chức nhận hàng', detail.organizationReceivedAt],
                  [detail.operationType === 'Recycling' ? 'Tái chế xong' : 'Hoàn tất', detail.processingCompletedAt],
                  ...(detail.operationType === 'Recycling' ? [
                    ['Ngày trả dự kiến', detail.recyclingReturn?.expectedReturnDate],
                    ['Gửi hàng về kho', detail.recyclingReturn?.dispatchedAt],
                    ['Kho đã nhận lại', detail.recyclingReturn?.receivedAt],
                  ] : []),
                ].map(([label, time]) => (
                  <li key={label} className={time ? 'done' : ''}>
                    <CheckCircle2 size={18} />
                    <strong>{label}</strong>
                    <span>{date(time)}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="ops-panel">
              <h2>Batch trong yêu cầu</h2>
              <div className="processing-table-scroll">
                <table className="processing-table">
                  <thead>
                    <tr>
                      <th>Batch / SKU</th>
                      <th>Nhãn</th>
                      <th>Khối lượng yêu cầu</th>
                      <th>Đã xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.inputs.map((x) => (
                      <tr key={x.id}>
                        <td>
                          <strong>{x.classifiedBatchCode || x.inventorySku}</strong>
                          <small>{x.inventorySku}</small>
                        </td>
                        <td>
                          <Direction type={detail.operationType} />
                        </td>
                        <td>
                          {number(x.requestedWeight)} kg
                          <small>{number(x.requestedQuantity)} món ghi nhận</small>
                        </td>
                        <td>{number(x.issuedWeight)} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {actions.length > 0 && (
              <section className="ops-panel">
                <h2>Thao tác</h2>
                <div className="processing-actions">
                  {actions.map((x) => (
                    <button
                      key={x.path}
                      disabled={busy}
                      className={`processing-button ${x.danger ? 'danger' : 'primary'}`}
                      onClick={() => {
                        setAction(x.path);
                        setNotes('');
                        setError('');
                      }}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
                {action && (
                  <dialog
                    ref={actionDialog}
                    className="ghn-create-modal processing-ghn-dialog processing-action-dialog"
                    aria-labelledby="processing-action-title"
                    onCancel={(e) => {
                      e.preventDefault();
                      if (!mutation.current) setAction('');
                    }}
                  >
                    <header>
                      <div>
                        <h2 id="processing-action-title">{actions.find((x) => x.path === action)?.label}</h2>
                        <p>{detail.operationCode} · {detail.warehouseName} → {detail.organizationName}</p>
                      </div>
                      <button type="button" aria-label="Đóng popup" disabled={busy} onClick={() => setAction('')}>
                        <X />
                      </button>
                    </header>
                  <form
                    className="processing-confirm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitAction();
                    }}
                  >
                    {error && <div className="processing-alert" role="alert">{error}</div>}
                    <p>
                      {action === 'issue'
                        ? 'Lập phiếu xuất và trừ tồn cho các batch trên. Tiếp theo, tạo vận đơn GHN để hẹn lấy hàng tại kho.'
                        : action === 'organization/receive'
                          ? 'Chỉ xác nhận khi tổ chức đã thực tế nhận hàng từ kho. Trạng thái tiếp nhận sẽ được ghi nhận ngay, không cần chờ GHN cập nhật.'
                        : action.endsWith('complete')
                          ? 'Ghi rõ kết quả tái chế hoặc tiêu hủy thực tế trước khi kết thúc yêu cầu.'
                          : 'Vui lòng xác nhận thao tác cho tổ chức, kho và các batch trong yêu cầu này.'}
                    </p>
                    {(needsNotes || action === 'issue') && (
                      <div className="ops-field">
                        <label htmlFor="processing-action-notes">
                          {action.endsWith('complete')
                            ? 'Kết quả xử lý'
                            : needsNotes
                              ? 'Lý do'
                              : 'Ghi chú bàn giao'}
                          {needsNotes && ' *'}
                        </label>
                        <textarea
                          id="processing-action-notes"
                          required={needsNotes}
                          maxLength={2000}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="processing-actions">
                      <button
                        type="submit"
                        className="processing-button primary"
                        disabled={busy || (needsNotes && !notes.trim())}
                      >
                        {busy ? 'Đang xử lý...' : 'Xác nhận'}
                      </button>
                      <button
                        type="button"
                        className="processing-button"
                        disabled={busy}
                        onClick={() => setAction('')}
                      >
                        Đóng
                      </button>
                    </div>
                  </form>
                  </dialog>
                )}
              </section>
            )}
          </>
        )
      ) : (
        <>
          <div className="processing-stats">
            {[
              {
                label: 'Tổng yêu cầu',
                value: list.length,
                icon: ClipboardList,
              },
              {
                label: 'Chờ phản hồi / duyệt',
                value: list.filter((x) => x.status.startsWith('Pending')).length,
                icon: Clock3,
              },
              {
                label: 'Chờ xuất kho',
                value: list.filter((x) => x.status === 'Approved').length,
                icon: ArrowUpFromLine,
              },
              {
                label: 'Hoàn tất',
                value: list.filter((x) => x.status === 'Completed').length,
                icon: CheckCircle2,
              },
            ].map((x) => (
              <div className="ops-panel" key={x.label}>
                <x.icon size={20} />
                <strong>{x.value}</strong>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
          <section className="ops-panel">
            <div className="processing-filters">
              <div className="ops-field processing-search">
                <label htmlFor="processing-search">
                  <Search size={14} /> Tìm yêu cầu
                </label>
                <input
                  id="processing-search"
                  placeholder="Mã yêu cầu, tổ chức, kho..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="ops-field">
                <label htmlFor="processing-direction">Hướng xử lý</label>
                <select
                  id="processing-direction"
                  value={direction}
                  onChange={(e) => {
                    setDirection(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả nhãn</option>
                  <option value="Recycling">B · Tái chế</option>
                  <option value="Disposal">C · Tiêu hủy</option>
                </select>
              </div>
              <div className="ops-field">
                <label htmlFor="processing-status">Trạng thái</label>
                <select
                  id="processing-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(labels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!shown.length ? (
              <div className="ops-empty">
                <Package size={32} />
                <h4>Chưa có yêu cầu phù hợp</h4>
                <p>
                  {mode === 'manager'
                    ? 'Tạo yêu cầu mới hoặc thay đổi bộ lọc để xem dữ liệu.'
                    : 'Yêu cầu thuộc phạm vi của bạn sẽ xuất hiện tại đây.'}
                </p>
              </div>
            ) : (
              <>
                <div className="processing-table-scroll">
                  <table className="processing-table">
                    <thead>
                      <tr>
                        <th>Yêu cầu</th>
                        <th>Tổ chức / Kho</th>
                        <th>Hướng xử lý</th>
                        <th>Khối lượng</th>
                        <th>Trạng thái</th>
                        <th>
                          <span className="processing-sr-only">Chi tiết</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((x) => (
                        <tr key={x.id}>
                          <td>
                            <Link to={`${base}/${x.id}`}>{x.operationCode}</Link>
                            <small>{date(x.requestedAt)}</small>
                          </td>
                          <td>
                            <strong>{x.organizationName}</strong>
                            <small>{x.warehouseName}</small>
                          </td>
                          <td>
                            <Direction type={x.operationType} />
                          </td>
                          <td>
                            {number(x.totalRequestedWeight)} kg
                            <small>{x.inputCount} batch</small>
                          </td>
                          <td>
                            <Badge status={x.status} />
                          </td>
                          <td>
                            <Link className="processing-button" to={`${base}/${x.id}`}>
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={activePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function CreateForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [catalog, setCatalog] = useState<ProcessingCatalog>({
    warehouses: [],
    organizations: [],
    items: [],
  });
  const [warehouseId, setWarehouseId] = useState('');
  const [operationType, setOperationType] = useState<ProcessingType>('Recycling');
  const [organizationId, setOrganizationId] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSelected([]);
    processingService
      .catalog(warehouseId || undefined, operationType)
      .then((data) => {
        if (active) {
          setCatalog(data);
          if (!warehouseId && data.warehouses.length) setWarehouseId(data.warehouses[0].id);
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [warehouseId, operationType, refresh]);
  const organizations = catalog.organizations.filter((x) => x.operationType === operationType);
  const items = catalog.items.filter((x) => selected.includes(x.inventoryId) && !x.isLocked);
  async function submit() {
    if (submitting.current || !items.length || !warehouseId || !organizationId) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await processingService.create({
        operationType,
        warehouseId,
        organizationId,
        requestNotes: notes.trim(),
        inputs: items.map((x) => ({
          inventoryId: x.inventoryId,
          requestedQuantity: x.quantity,
          requestedWeight: x.weight,
        })),
      });
      onCreated(result.id);
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      className="ops-panel processing-create"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="processing-sectionhead">
        <h2>Tạo yêu cầu xử lý</h2>
        {operationType === 'Recycling' ? <Recycle size={22} /> : <ShieldAlert size={22} />}
      </div>
      <p className="processing-note">
        Chọn nguyên batch: nhãn B gửi tái chế, nhãn C gửi tiêu hủy. Tổ chức phản hồi trước, quản lý
        duyệt sau.
      </p>
      <fieldset disabled={busy}>
        <div className="processing-filters">
          <div className="ops-field">
            <label htmlFor="create-type">Hướng xử lý *</label>
            <select
              id="create-type"
              value={operationType}
              onChange={(e) => {
                setOperationType(e.target.value as ProcessingType);
                setOrganizationId('');
                setSelected([]);
              }}
            >
              <option value="Recycling">B · Tái chế</option>
              <option value="Disposal">C · Tiêu hủy</option>
            </select>
          </div>
          <div className="ops-field">
            <label htmlFor="create-warehouse">Kho xuất *</label>
            <select
              id="create-warehouse"
              required
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setSelected([]);
              }}
            >
              <option value="">Chọn kho</option>
              {catalog.warehouses.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.warehouseName}
                </option>
              ))}
            </select>
          </div>
          <div className="ops-field">
            <label htmlFor="create-organization">Tổ chức tiếp nhận *</label>
            <select
              id="create-organization"
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              <option value="">Chọn tổ chức</option>
              {organizations.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!loading && !organizations.length && (
          <p role="status" className="processing-note">
            Chưa có tổ chức hoạt động cho hướng xử lý này.
          </p>
        )}
        {error && (
          <div className="processing-alert" role="alert">
            {error}
            <button
              type="button"
              className="processing-button"
              onClick={() => setRefresh((x) => x + 1)}
            >
              Tải lại batch
            </button>
          </div>
        )}
        {loading ? (
          <p role="status">Đang tải batch...</p>
        ) : !warehouseId ? (
          <p>Chọn kho để xem batch.</p>
        ) : !catalog.items.length ? (
          <div className="ops-empty">
            <Package size={24} />
            <p>Kho chưa có batch phù hợp.</p>
          </div>
        ) : (
          <div className="processing-batches">
            {catalog.items.map((x) => (
              <label
                key={x.inventoryId}
                className={`processing-batch ${selected.includes(x.inventoryId) ? 'selected' : ''} ${x.isLocked ? 'locked' : ''}`}
              >
                <input
                  type="checkbox"
                  disabled={x.isLocked}
                  checked={selected.includes(x.inventoryId)}
                  onChange={(e) =>
                    setSelected((current) =>
                      e.target.checked
                        ? [...current, x.inventoryId]
                        : current.filter((id) => id !== x.inventoryId),
                    )
                  }
                />
                <div>
                  <strong>{x.batchCode || x.sku}</strong>
                  <small>
                    {x.locationCode || 'Chưa có vị trí'} · {number(x.quantity)} món ghi nhận
                  </small>
                  <Direction type={x.operationType} />
                  {x.isLocked && <small>{x.lockReason}</small>}
                </div>
                <b>{number(x.weight)} kg</b>
              </label>
            ))}
          </div>
        )}
        <div className="ops-field">
          <label htmlFor="create-notes">Ghi chú yêu cầu</label>
          <textarea
            id="create-notes"
            rows={2}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mục đích, yêu cầu bàn giao..."
          />
        </div>
        <div className="processing-create-footer">
          <strong>
            Đã chọn {items.length} batch · {number(items.reduce((sum, x) => sum + x.weight, 0))} kg
          </strong>
          <div className="processing-actions">
            <button type="button" className="processing-button" onClick={onCancel}>
              Đóng
            </button>
            <button
              type="submit"
              className="processing-button primary"
              disabled={loading || !items.length || !organizationId || !warehouseId || !!error}
            >
              {busy ? 'Đang gửi...' : 'Gửi đến tổ chức'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
