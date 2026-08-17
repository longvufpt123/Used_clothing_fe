import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FilterX,
  MapPin,
  PackageCheck,
  Search,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { receivingService } from '@/services/receivingService';
import type { DispatchBoard } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import './DispatchPanel.css';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatAppointment = (value?: string) => {
  if (!value) return 'Chưa có';

  const [datePart, timePart = ''] = value.split('T');
  const [year, month, day] = datePart.split('-');
  const time = timePart.slice(0, 5);

  return `${time ? `${time} - ` : ''}${day}/${month}/${year}`;
};

const isAppointmentWithinShift = (appointment?: string, startTime?: string, endTime?: string) => {
  if (!appointment || !startTime || !endTime) return false;
  const appointmentTime = appointment.split('T')[1]?.slice(0, 5);
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  return !!appointmentTime && !!start && !!end && appointmentTime >= start && appointmentTime < end;
};
const pageItems = (page: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'end', total];
  if (page >= total - 3) return [1, 'start', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'start', page - 1, page, page + 1, 'end', total];
};

type DispatchPanelProps = {
  warehouseId?: string;
  hideWarehouseFilter?: boolean;
  onWarehouseChange?: (warehouseId: string) => void;
  onAssigned?: () => void | Promise<void>;
};

export default function DispatchPanel({
  warehouseId: sharedWarehouseId,
  hideWarehouseFilter = false,
  onWarehouseChange,
  onAssigned,
}: DispatchPanelProps = {}) {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [board, setBoard] = useState<DispatchBoard>({ requests: [], teams: [] });
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string>();
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [focusedRequestId, setFocusedRequestId] = useState<string>();
  const pageSize = 8;
  const activeWarehouseFilter = sharedWarehouseId ?? warehouseFilter;
  const load = () =>
    receivingService
      .getDispatchBoard()
      .then(setBoard)
      .catch(() => toast.error('Không thể tải dữ liệu điều phối.'));
  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (!requestId || !board.requests.length) return;
    const request = board.requests.find((x) => x.id === requestId);
    if (!request) return;
    if (sharedWarehouseId === undefined) setWarehouseFilter(request.warehouseId);
    else if (request.warehouseId !== sharedWarehouseId) onWarehouseChange?.(request.warehouseId);
    setDateFilter(request.scheduledDate?.slice(0, 10) || '');
    setMethodFilter(request.deliveryMethod);
    setSearch(request.code);
    setPage(1);
    setFocusedRequestId(requestId);
    const timer = window.setTimeout(() => setFocusedRequestId(undefined), 4000);
    return () => window.clearTimeout(timer);
  }, [board.requests, searchParams, sharedWarehouseId, onWarehouseChange]);

  const teamMap = useMemo(() => new Map(board.teams.map((t) => [t.id, t])), [board.teams]);
  const warehouses = useMemo(
    () =>
      Array.from(new Map(board.requests.map((x) => [x.warehouseId, x.warehouseName])).entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [board.requests],
  );
  const filtered = useMemo(() => {
    const query = normalize(search);
    return board.requests.filter(
      (x) =>
        (!activeWarehouseFilter || x.warehouseId === activeWarehouseFilter) &&
        (!dateFilter || x.scheduledDate?.slice(0, 10) === dateFilter) &&
        (!methodFilter || x.deliveryMethod === methodFilter) &&
        (!query ||
          normalize(`${x.code} ${x.contactName} ${x.phoneNumber} ${x.address}`).includes(query)),
    );
  }, [board.requests, activeWarehouseFilter, dateFilter, methodFilter, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [activeWarehouseFilter, dateFilter, methodFilter, search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const assign = async (requestId: string) => {
    const teamId = selectedTeams[requestId];
    if (!teamId) return toast.warning('Vui lòng chọn receiving team.');
    setLoadingId(requestId);
    try {
      await receivingService.assignRequest(requestId, teamId);
      toast.success('Đã phân công đơn cho receiving team.');
      await load();
      await onAssigned?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể phân công đơn.');
    } finally {
      setLoadingId(undefined);
    }
  };

  if (board.requests.length === 0) return null;

  return (
    <section className="dispatch-panel">
      <div className="dispatch-head">
        <div>
          <span>Điều phối thực tế</span>
          <h2>Đơn quyên góp chờ phân công</h2>
        </div>
        <strong>
          {filtered.length} / {board.requests.length} đơn
        </strong>
      </div>
      <div className={`dispatch-filters${hideWarehouseFilter ? ' without-warehouse' : ''}`}>
        {!hideWarehouseFilter && (
          <div>
            <Warehouse size={15} />
            <label htmlFor="dispatch-warehouse">Kho</label>
            <select
              id="dispatch-warehouse"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="">Tất cả kho</option>
              {warehouses.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <CalendarDays size={15} />
          <label htmlFor="dispatch-date">Ngày hẹn</label>
          <input
            id="dispatch-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="dispatch-method">Phương thức</label>
          <select
            id="dispatch-method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">Tất cả phương thức</option>
            <option value="StaffPickup">Đến lấy tận nơi</option>
            <option value="DonorDropOff">Nhận tại kho</option>
          </select>
        </div>
        <div className="dispatch-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã đơn, tên, SĐT, địa chỉ..."
          />
        </div>
        {(dateFilter || methodFilter || search) && (
          <button
            type="button"
            className="dispatch-clear"
            onClick={() => {
              setDateFilter('');
              setMethodFilter('');
              setSearch('');
            }}
          >
            <FilterX size={15} /> Xóa lọc
          </button>
        )}
      </div>
      {board.requests.length === 0 ? (
        <div className="dispatch-empty">
          <PackageCheck /> Tất cả đơn đã được phân công.
        </div>
      ) : filtered.length === 0 ? (
        <div className="dispatch-empty">
          <Search /> Không tìm thấy đơn phù hợp bộ lọc.
        </div>
      ) : (
        <>
          <div className="dispatch-grid">
            {paged.map((request) => {
              const teams = board.teams.filter(
                (t) =>
                  t.warehouseId === request.warehouseId &&
                  !!request.scheduledDate &&
                  t.shiftDate.slice(0, 10) === request.scheduledDate.slice(0, 10) &&
                  isAppointmentWithinShift(request.scheduledDate, t.startTime, t.endTime) &&
                  (request.deliveryMethod === 'DonorDropOff'
                    ? t.teamType === 'ReceivingWarehouse'
                    : t.teamType === 'Receiving' || t.teamType === 'ReceivingPickup'),
              );
              const selected = teamMap.get(selectedTeams[request.id]);
              return (
                <article
                  className={`dispatch-card${focusedRequestId === request.id ? ' notification-focus' : ''}`}
                  key={request.id}
                >
                  <div className="dispatch-card-top">
                    <b>{request.code}</b>
                    <span
                      className={request.deliveryMethod === 'DonorDropOff' ? 'dropoff' : 'pickup'}
                    >
                      {request.deliveryMethod === 'DonorDropOff'
                        ? 'Nhận tại kho'
                        : 'Đến lấy tận nơi'}
                    </span>
                  </div>
                  <h3>
                    {request.contactName} · {request.phoneNumber}
                  </h3>
                  <p>
                    <MapPin size={14} />
                    {request.address}
                  </p>
                  <div className="dispatch-warehouse-destination">
                    <Warehouse size={14} />
                    <span>Kho tiếp nhận</span>
                    <strong>{request.warehouseName}</strong>
                  </div>
                  <small>
                    <CalendarDays size={13} /> Ngày giờ hẹn: {formatAppointment(request.scheduledDate)}
                  </small>
                  <>
                      <select
                        value={selectedTeams[request.id] || ''}
                        onChange={(e) =>
                          setSelectedTeams((v) => ({ ...v, [request.id]: e.target.value }))
                        }
                      >
                        <option value="">
                          {request.deliveryMethod === 'DonorDropOff'
                            ? 'Chọn team trực kho'
                            : 'Chọn receiving team cùng kho'}
                        </option>
                        {teams.map((team) => (
                          <option value={team.id} key={team.id}>
                            {team.teamName} · {team.shiftName} ·{' '}
                            {new Date(team.shiftDate).toLocaleDateString('vi-VN')}
                          </option>
                        ))}
                      </select>
                      <small
                        className={`dispatch-team-summary${selected ? '' : ' empty'}`}
                        aria-hidden={!selected}
                      >
                        {selected && (
                          <>
                            <Users size={13} />{' '}
                            {selected.members.map((x) => x.fullName).join(' & ')} ·{' '}
                            {selected.shiftTime}
                          </>
                        )}
                      </small>
                      <button
                        onClick={() => assign(request.id)}
                        disabled={loadingId === request.id || teams.length === 0}
                      >
                        <Truck size={15} />
                        {loadingId === request.id ? 'Đang phân công...' : 'Phân công đơn'}
                      </button>
                  </>
                </article>
              );
            })}
          </div>
          {totalPages > 1 && (
            <nav className="dispatch-pagination" aria-label="Phân trang đơn chờ phân công">
              <button onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page === 1}>
                <ChevronLeft size={16} /> Trước
              </button>
              {pageItems(page, totalPages).map((value) =>
                typeof value === 'number' ? (
                  <button
                    className={value === page ? 'active' : ''}
                    onClick={() => setPage(value)}
                    key={value}
                  >
                    {value}
                  </button>
                ) : (
                  <span key={value}>…</span>
                ),
              )}
              <button
                onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
                disabled={page === totalPages}
              >
                Sau <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
