import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilterX,
  PackageCheck,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import {
  classificationService,
  type ClassificationManagementBoard,
} from '@/services/classificationService';
import { receivingService, type ManagerShiftOverview } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import { getStatusLabel } from '@/utils/statusLabels';
import '@/styles/ops-shared.css';
import './ReceivingOperations.css';
import './ShiftDetail.css';
import './ClassificationDispatch.css';

const shortTime = (value: string) => value.slice(0, 5);

const paginationItems = (current: number, total: number): Array<number | string> => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values: Array<number | string> = [1];
  if (current > 4) values.push('left-gap');
  for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page += 1) {
    values.push(page);
  }
  if (current < total - 3) values.push('right-gap');
  values.push(total);
  return values;
};

const formatDate = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export default function ClassificationDispatch() {
  const toast = useToast();
  const [board, setBoard] = useState<ClassificationManagementBoard | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [shifts, setShifts] = useState<ManagerShiftOverview[]>([]);
  const [createShift, setCreateShift] = useState<ManagerShiftOverview | null>(null);
  const [teamName, setTeamName] = useState('Team phân loại');
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatus, setBatchStatus] = useState('all');
  const [dayPage, setDayPage] = useState(1);
  const [batchPage, setBatchPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigningId, setAssigningId] = useState('');
  const [detailShiftId, setDetailShiftId] = useState<string | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const batchPageSize = 6;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classificationService.getManagementBoard(warehouseId || undefined);
      setBoard(data);
      const selectedWarehouse = warehouseId || data.warehouses[0]?.id || '';
      if (!warehouseId && selectedWarehouse) setWarehouseId(selectedWarehouse);
      if (!selectedWarehouse) {
        setShifts([]);
        return;
      }
      const result = await receivingService.getManagerShifts({
        warehouseId: selectedWarehouse,
      });
      setShifts(result);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu điều phối phân loại.');
    } finally {
      setLoading(false);
    }
  }, [toast, warehouseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDayPage(1);
    setBatchPage(1);
  }, [warehouseId, dateFilter, yearFilter, batchSearch, batchStatus]);

  const selectedWarehouse = board?.warehouses.find((item) => item.id === warehouseId);
  const allWarehouseTeams = useMemo(
    () => board?.teams.filter((team) => team.warehouseId === warehouseId) ?? [],
    [board, warehouseId],
  );
  const teams = useMemo(
    () => allWarehouseTeams.filter((team) =>
      (!yearFilter || team.shiftDate.slice(0, 4) === yearFilter) &&
      (!dateFilter || team.shiftDate.slice(0, 10) === dateFilter)),
    [allWarehouseTeams, dateFilter, yearFilter],
  );
  const filteredShifts = useMemo(
    () => shifts.filter((shift) =>
      (!yearFilter || shift.shiftDate.slice(0, 4) === yearFilter) &&
      (!dateFilter || shift.shiftDate.slice(0, 10) === dateFilter)),
    [dateFilter, shifts, yearFilter],
  );
  const years = useMemo(
    () => Array.from(new Set(shifts.map((shift) => shift.shiftDate.slice(0, 4)))).sort(),
    [shifts],
  );
  const workDays = useMemo(
    () => Array.from(filteredShifts.reduce((groups, shift) => {
      const key = shift.shiftDate.slice(0, 10);
      const current = groups.get(key);
      if (current) current.push(shift);
      else groups.set(key, [shift]);
      return groups;
    }, new Map<string, ManagerShiftOverview[]>()).entries())
      .map(([day, dayShifts]) => ({
        day,
        shifts: dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    [filteredShifts],
  );
  const dayPageSize = 5;
  const dayPages = Math.max(1, Math.ceil(workDays.length / dayPageSize));
  const safeDayPage = Math.min(dayPage, dayPages);
  const pagedDays = workDays.slice((safeDayPage - 1) * dayPageSize, safeDayPage * dayPageSize);
  useEffect(() => {
    if (dayPage > dayPages) setDayPage(dayPages);
  }, [dayPage, dayPages]);
  const filteredBatches = useMemo(() => {
    const keyword = batchSearch.trim().toLocaleLowerCase('vi');
    return (
      board?.batches.filter((batch) => {
        const matchesWarehouse = batch.warehouseId === warehouseId;
        const matchesStatus = batchStatus === 'all' || batch.status === batchStatus;
        const matchesSearch =
          !keyword ||
          batch.batchCode.toLocaleLowerCase('vi').includes(keyword) ||
          batch.warehouseName.toLocaleLowerCase('vi').includes(keyword) ||
          (batch.teamName ?? '').toLocaleLowerCase('vi').includes(keyword) ||
          (batch.currentAreaName ?? '').toLocaleLowerCase('vi').includes(keyword);
        return matchesWarehouse && matchesStatus && matchesSearch;
      }) ?? []
    );
  }, [batchSearch, batchStatus, board, warehouseId]);
  const batchPages = Math.max(1, Math.ceil(filteredBatches.length / batchPageSize));
  const safeBatchPage = Math.min(batchPage, batchPages);
  const pagedBatches = filteredBatches.slice(
    (safeBatchPage - 1) * batchPageSize,
    safeBatchPage * batchPageSize,
  );
  const detailTeam = board?.teams.find((team) => team.id === detailTeamId) ?? null;
  const detailShift = shifts.find((shift) => shift.id === detailShiftId) ?? null;
  const detailShiftTeams = allWarehouseTeams.filter((team) => team.shiftId === detailShiftId);
  const detailShiftBatches = board?.batches.filter(
    (batch) => batch.teamId && detailShiftTeams.some((team) => team.id === batch.teamId),
  ) ?? [];
  const detailTeamBatches = useMemo(
    () => board?.batches.filter((batch) => batch.teamId === detailTeamId) ?? [],
    [board, detailTeamId],
  );

  const eligibleTeams = allWarehouseTeams.filter((team) => {
    const shiftEnd = new Date(`${team.shiftDate.slice(0, 10)}T${team.endTime}`).getTime();
    return team.status === 'Scheduled' && team.members.length >= 1 && team.members.length <= 2 && shiftEnd > Date.now();
  });
  const occupiedStaffIds = new Set(
    allWarehouseTeams
      .filter((team) => team.shiftId === createShift?.id)
      .flatMap((team) => team.members.map((member) => member.id)),
  );
  const availableStaff =
    board?.staff.filter((staff) => {
      const keyword = staffSearch.trim().toLocaleLowerCase('vi');
      return (
        staff.warehouseId === warehouseId &&
        (!keyword ||
          staff.fullName.toLocaleLowerCase('vi').includes(keyword) ||
          staff.userName.toLocaleLowerCase('vi').includes(keyword) ||
          staff.phoneNumber.includes(keyword))
      );
    }) ?? [];

  const openCreateTeam = (shift: ManagerShiftOverview) => {
    setCreateShift(shift);
    setTeamName(`Team phân loại · ${shift.shiftName}`);
    setStaffIds([]);
    setStaffSearch('');
  };

  const closeCreateTeam = () => {
    if (creating) return;
    setCreateShift(null);
    setStaffIds([]);
  };

  const createTeam = async () => {
    if (!createShift || staffIds.length < 1 || staffIds.length > 2 || !teamName.trim()) {
      toast.warning('Vui lòng nhập tên team và chọn từ 1 đến 2 nhân viên.');
      return;
    }
    setCreating(true);
    try {
      await receivingService.createTeam(createShift.id, teamName.trim(), staffIds, 'Classification');
      toast.success('Đã tạo team phân loại cho ca làm.');
      setCreateShift(null);
      setStaffIds([]);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo team phân loại.');
    } finally {
      setCreating(false);
    }
  };

  const assignBatch = async (batchId: string, teamId: string) => {
    if (!teamId) return;
    setAssigningId(batchId);
    try {
      await classificationService.assignBatch(batchId, teamId);
      toast.success('Đã phân công lô hàng và gửi thông báo cho team phân loại.');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể phân công lô hàng.');
    } finally {
      setAssigningId('');
    }
  };

  const unassignedCount =
    board?.batches.filter(
      (batch) =>
        batch.warehouseId === warehouseId && batch.status === 'AwaitingClassificationAssignment',
    ).length ?? 0;
  const processingCount =
    board?.batches.filter(
      (batch) =>
        batch.warehouseId === warehouseId &&
        !!batch.teamId &&
        !['InClassifiedArea', 'SentToWarehouse'].includes(batch.status),
    ).length ?? 0;

  return (
    <AdminLayout>
      <div className="ops-page manager-ops classification-dispatch">
        <header className="ops-pagehead">
          <div className="ops-pagehead-main">
            <span className="ops-pagehead-kicker">Điều phối phân loại</span>
            <h1>Điều phối phân loại</h1>
            <p>Quản lý ca, nhân sự phân loại và phân công lô theo đúng kho, ngày làm việc.</p>
          </div>
          <button className="ops-btn ops-btn-secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'classification-spin' : ''} /> Làm mới
          </button>
        </header>

        <div className="ops-stats classification-summary">
          <div className="ops-stat-card">
            <span className="ops-stat-label">Nhóm đã xếp lịch</span>
            <strong className="ops-stat-value">{teams.length}</strong>
            <small className="ops-stat-foot">Trong ngày đã chọn</small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Ca chưa có nhóm</span>
            <strong className="ops-stat-value">
              {filteredShifts.filter((shift) => !allWarehouseTeams.some((team) => team.shiftId === shift.id)).length}
            </strong>
            <small className="ops-stat-foot">Có thể thêm nhóm phân loại</small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Lô chờ phân công</span>
            <strong className="ops-stat-value">{unassignedCount}</strong>
            <small className="ops-stat-foot">Đang ở khu chưa phân loại</small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Lô đang xử lý</span>
            <strong className="ops-stat-value">{processingCount}</strong>
            <small className="ops-stat-foot">Đã giao cho nhóm</small>
          </div>
        </div>

        <section>
          <div className="ops-section-head">
            <div>
              <span className="ops-panel-label">QUẢN LÝ NHÓM VÀ LỊCH PHÂN LOẠI</span>
              <h2>Lịch phân loại theo ngày</h2>
            </div>
            <span>{workDays.length} ngày · {filteredShifts.length} ca</span>
          </div>

          <div className="manager-shift-toolbar">
            <div className="manager-date-filter">
              <Warehouse size={16} />
              <label>Kho</label>
              <select
                value={warehouseId}
                onChange={(event) => {
                  setWarehouseId(event.target.value);
                  setStaffIds([]);
                }}
              >
                {board?.warehouses.map((warehouse) => (
                  <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
              <CalendarDays size={16} />
              <label>Năm</label>
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option value="">Tất cả năm</option>
                {years.map((year) => <option value={year} key={year}>{year}</option>)}
              </select>
              <label>Ngày</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  if (event.target.value) setYearFilter(event.target.value.slice(0, 4));
                }}
              />
              {(yearFilter || dateFilter) && (
                <button onClick={() => { setYearFilter(''); setDateFilter(''); }}>
                  <FilterX size={16} /> Xóa ngày/năm
                </button>
              )}
            </div>
            <span>
              {workDays.length ? (safeDayPage - 1) * dayPageSize + 1 : 0}–
              {Math.min(safeDayPage * dayPageSize, workDays.length)} / {workDays.length} ngày
            </span>
          </div>

          <div className="manager-workday-list">
            {pagedDays.map(({ day, shifts: dayShifts }) => {
              const dayTeams = allWarehouseTeams.filter(
                (team) => team.shiftDate.slice(0, 10) === day,
              );
              return (
                <article className="manager-workday-card classification-day-card" key={day}>
                  <div className="manager-workday-head">
                    <div>
                      <CalendarDays size={18} />
                      <span>
                        <strong>{formatDate(day)}</strong>
                        <small>{selectedWarehouse?.name || 'Chưa chọn kho'}</small>
                      </span>
                    </div>
                    <b>
                      {dayTeams.length} team · {dayTeams.reduce(
                        (sum, team) => sum + team.assignedBatches,
                        0,
                      )} lô
                    </b>
                  </div>
                  <div className="manager-workday-shifts">
                    {dayShifts.map((shift) => {
                      const shiftTeams = allWarehouseTeams.filter(
                        (team) => team.shiftId === shift.id,
                      );
                      const assigned = shiftTeams.reduce(
                        (total, team) => total + team.assignedBatches,
                        0,
                      );
                      return (
                        <section
                          className="manager-day-shift classification-clickable-shift"
                          key={shift.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setDetailShiftId(shift.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setDetailShiftId(shift.id);
                            }
                          }}
                          aria-label={`Xem chi tiết ${shift.shiftName}`}
                        >
                          <div className="manager-shift-head">
                            <div>
                              <strong>{shift.shiftName}</strong>
                              <span>
                                <Clock3 size={13} />
                                {shortTime(shift.startTime)}–{shortTime(shift.endTime)}
                              </span>
                            </div>
                            <span className={`ops-badge ${shift.status === 'InProgress' ? 'stored' : 'pending'}`}>
                              {getStatusLabel(shift.status)}
                            </span>
                          </div>
                          <div className="manager-compact-team-row">
                            <span>
                              <Users size={15} />
                              <strong>{shiftTeams.length} team</strong>
                              <small>{assigned} lô</small>
                            </span>
                            {shift.status === 'Scheduled' && (
                              <div className="manager-shift-team-actions">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openCreateTeam(shift);
                                  }}
                                >
                                  <UserPlus size={14} /> Team
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="classification-shift-team-names">
                            {shiftTeams.map((team) => (
                              <button
                                type="button"
                                key={team.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailTeamId(team.id);
                                }}
                                aria-label={`Xem chi tiết ${team.teamName}`}
                              >
                                <span>{team.teamName}</span>
                                <b>{team.assignedBatches} lô</b>
                              </button>
                            ))}
                            {!shiftTeams.length && <small>Chưa có nhóm trong ca này.</small>}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })}
            {!pagedDays.length && (
              <div className="ops-empty">
                <CalendarDays size={34} />
                <h4>Không có ca phù hợp</h4>
              </div>
            )}
          </div>
          {dayPages > 1 && (
            <Pagination current={safeDayPage} total={dayPages} setPage={setDayPage} />
          )}
        </section>
        <section>
          <div className="ops-section-head">
            <div>
              <span className="ops-panel-label">ĐIỀU PHỐI THỦ CÔNG</span>
              <h2>Lô hàng chờ phân loại</h2>
            </div>
            <span>Chỉ chọn team cùng kho, đúng ngày và chưa bắt đầu ca</span>
          </div>
          <div className="classification-batch-toolbar">
            <label><Search size={16} /><input value={batchSearch} onChange={(event) => setBatchSearch(event.target.value)} placeholder="Tìm mã lô, khu vực hoặc team..." /></label>
            <select value={batchStatus} onChange={(event) => setBatchStatus(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="AwaitingClassificationAssignment">Chờ phân công</option>
              <option value="AssignedToClassification">Đã phân công</option>
              <option value="Classifying">Đang phân loại</option>
              <option value="InClassifiedArea">Đã phân loại</option>
            </select>
            <span>{filteredBatches.length ? (safeBatchPage - 1) * batchPageSize + 1 : 0}–{Math.min(safeBatchPage * batchPageSize, filteredBatches.length)} / {filteredBatches.length} lô</span>
          </div>
          <div className="classification-batch-grid">
            {pagedBatches.map((batch) => (
              <article className="classification-batch-card" key={batch.id}>
                <div className="ops-card-top"><strong className="ops-card-code">{batch.batchCode}</strong><span className="ops-badge pending">{getStatusLabel(batch.status)}</span></div>
                <div className="classification-batch-metrics"><span><b>{batch.totalWeight.toFixed(1)} kg</b><small>Khối lượng</small></span><span><b>{batch.donationRequests}</b><small>Đơn nguồn</small></span></div>
                <p><PackageCheck size={15} /> {batch.currentAreaName || 'Chưa ghi nhận khu vực'}</p>
                {batch.status === 'AwaitingClassificationAssignment' ? (
                  <div className="classification-card-action">
                    <label>Team phụ trách</label>
                    <select disabled={assigningId === batch.id} defaultValue="" onChange={(event) => void assignBatch(batch.id, event.target.value)}>
                      <option value="">Chọn team cùng kho và ca</option>
                      {eligibleTeams.map((team) => <option value={team.id} key={team.id}>{team.teamName} · {shortTime(team.startTime)}–{shortTime(team.endTime)} · {team.assignedBatches} lô</option>)}
                    </select>
                    {!eligibleTeams.length && <small>Chưa có team đủ điều kiện để nhận lô.</small>}
                  </div>
                ) : (
                  <div className="classification-assigned-team"><span>Team phụ trách</span><strong>{batch.teamName || 'Chưa xác định'}</strong></div>
                )}
              </article>
            ))}
            {!pagedBatches.length && <div className="ops-empty"><PackageCheck size={34} /><h4>Không có lô hàng phù hợp</h4><p>Thử đổi kho, ngày hoặc bộ lọc trạng thái.</p></div>}
          </div>
          {batchPages > 1 && <Pagination current={safeBatchPage} total={batchPages} setPage={setBatchPage} />}
        </section>

        {detailShift && (
          <div
            className="manager-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDetailShiftId(null);
            }}
          >
            <section
              className="ops-panel teams-shift-detail manager-multi-detail classification-shift-detail"
              role="dialog"
              aria-modal="true"
              aria-labelledby="classification-shift-detail-title"
            >
              <div className="teams-detail-head">
                <div>
                  <span>CHI TIẾT CA · {detailShiftTeams.length} TEAM PHÂN LOẠI</span>
                  <h2 id="classification-shift-detail-title">{detailShift.shiftName}</h2>
                  <p>{formatDate(detailShift.shiftDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailShiftId(null)}
                  aria-label="Đóng chi tiết ca"
                >
                  <X />
                </button>
              </div>

              <div className="teams-detail-summary">
                <div>
                  <span>Thời gian</span>
                  <strong>
                    <Clock3 size={16} />
                    {shortTime(detailShift.startTime)}–{shortTime(detailShift.endTime)}
                  </strong>
                </div>
                <div>
                  <span>Kho phụ trách</span>
                  <strong>
                    <Warehouse size={16} />
                    {detailShift.warehouseName}
                  </strong>
                </div>
                <div>
                  <span>Tổng tải</span>
                  <strong>
                    {detailShiftTeams.length} team · {detailShiftBatches.length} lô
                  </strong>
                </div>
              </div>

              <div className="classification-shift-detail-command">
                <div>
                  <span>Trạng thái ca</span>
                  <strong>{getStatusLabel(detailShift.status)}</strong>
                </div>
                {detailShift.status === 'Scheduled' && (
                  <button
                    type="button"
                    className="ops-btn ops-btn-secondary"
                    onClick={() => {
                      setDetailShiftId(null);
                      openCreateTeam(detailShift);
                    }}
                  >
                    <UserPlus size={15} /> Thêm team phân loại
                  </button>
                )}
              </div>

              <section className="teams-detail-section">
                <div className="teams-detail-section-title">
                  <div>
                    <span>01</span>
                    <h3>Team trong ca</h3>
                  </div>
                  <b>{detailShiftTeams.length} team</b>
                </div>
                <div className="classification-shift-team-grid">
                  {detailShiftTeams.map((team) => (
                    <button
                      type="button"
                      className="classification-shift-team-card"
                      key={team.id}
                      onClick={() => {
                        setDetailShiftId(null);
                        setDetailTeamId(team.id);
                      }}
                    >
                      <div className="classification-shift-team-card-head">
                        <div>
                          <Users size={18} />
                          <span>
                            <strong>{team.teamName}</strong>
                            <small>{team.members.length} thành viên</small>
                          </span>
                        </div>
                        <span
                          className={`ops-badge ${team.status === 'InProgress' ? 'stored' : 'pending'}`}
                        >
                          {getStatusLabel(team.status)}
                        </span>
                      </div>
                      <div className="classification-shift-team-members">
                        {team.members.map((member) => (
                          <span key={member.id}>
                            <b>{member.fullName}</b>
                            <small>{member.phoneNumber}</small>
                          </span>
                        ))}
                      </div>
                      <div className="classification-shift-team-progress">
                        <span>Tiến độ lô</span>
                        <strong>{team.completedBatches}/{team.assignedBatches} lô</strong>
                      </div>
                      <small className="classification-shift-team-link">Xem chi tiết team →</small>
                    </button>
                  ))}
                  {!detailShiftTeams.length && (
                    <div className="teams-detail-empty">
                      Ca này chưa có team phân loại. Manager có thể tạo team ngay trong chi tiết ca.
                    </div>
                  )}
                </div>
              </section>

              <div className="teams-detail-actions">
                <button
                  type="button"
                  className="ops-btn ops-btn-primary"
                  onClick={() => setDetailShiftId(null)}
                >
                  Đóng chi tiết
                </button>
              </div>
            </section>
          </div>
        )}

        {createShift && (
          <div className="manager-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeCreateTeam()}>
            <section className="ops-panel manager-team-modal classification-team-modal">
              <div className="ops-section-head classification-modal-head">
                <div><span className="ops-panel-label">TẠO TEAM PHÂN LOẠI</span><h2>{createShift.shiftName}</h2><p>{formatDate(createShift.shiftDate)} · {shortTime(createShift.startTime)}–{shortTime(createShift.endTime)}</p></div>
                <button className="manager-close" onClick={closeCreateTeam}><X /></button>
              </div>
              <div className="ops-field"><label>Tên team *</label><input value={teamName} onChange={(event) => setTeamName(event.target.value)} /></div>
              <div className="manager-staff-label"><span>Chọn từ 1 đến 2 thành viên tại {selectedWarehouse?.name}</span><strong>{staffIds.length}/2</strong></div>
              <div className="manager-staff-search"><Search size={16} /><input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Tìm tên, username hoặc số điện thoại..." />{staffSearch && <button onClick={() => setStaffSearch('')}><X size={14} /></button>}</div>
              <div className="manager-staff-list classification-modal-staff-list">
                {availableStaff.map((staff) => {
                  const occupied = occupiedStaffIds.has(staff.id);
                  const selected = staffIds.includes(staff.id);
                  return (
                    <button
                      key={staff.id}
                      disabled={occupied || (!selected && staffIds.length >= 2)}
                      className={`${selected ? 'selected' : ''} ${occupied ? 'assigned' : ''}`}
                      onClick={() => setStaffIds((ids) => selected ? ids.filter((id) => id !== staff.id) : [...ids, staff.id])}
                    >
                      <span><b>{staff.fullName}</b><small>@{staff.userName} · {staff.phoneNumber}</small>{occupied && <em className="manager-assigned-note">Đã thuộc team trong ca này</em>}</span>
                      {selected ? <CheckCircle2 size={19} /> : <i className="manager-check" />}
                    </button>
                  );
                })}
                {!availableStaff.length && <div className="ops-empty">Không tìm thấy nhân viên phù hợp.</div>}
              </div>
              <button className="ops-btn ops-btn-primary ops-btn-block" disabled={creating || staffIds.length < 1 || staffIds.length > 2 || !teamName.trim()} onClick={() => void createTeam()}><Users size={16} /> {creating ? 'Đang tạo...' : 'Lưu team phân loại'}</button>
            </section>
          </div>
        )}

        {detailTeam && (
          <div
            className="manager-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDetailTeamId(null);
            }}
          >
            <section
              className="ops-panel teams-shift-detail classification-team-detail"
              role="dialog"
              aria-modal="true"
              aria-labelledby="classification-team-detail-title"
            >
              <div className="teams-detail-head">
                <div>
                  <span>CHI TIẾT TEAM PHÂN LOẠI</span>
                  <h2 id="classification-team-detail-title">{detailTeam.teamName}</h2>
                  <p>{formatDate(detailTeam.shiftDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailTeamId(null)}
                  aria-label="Đóng chi tiết team"
                >
                  <X />
                </button>
              </div>

              <div className="teams-detail-summary">
                <div>
                  <span>Thời gian</span>
                  <strong>
                    <Clock3 size={16} />
                    {shortTime(detailTeam.startTime)}–{shortTime(detailTeam.endTime)}
                  </strong>
                </div>
                <div>
                  <span>Kho phụ trách</span>
                  <strong>
                    <Warehouse size={16} />
                    {detailTeam.warehouseName}
                  </strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong>{getStatusLabel(detailTeam.status)}</strong>
                </div>
              </div>

              <section className="teams-detail-section">
                <div className="teams-detail-section-title">
                  <div>
                    <span>01</span>
                    <h3>Thành viên team</h3>
                  </div>
                  <b>{detailTeam.members.length} thành viên</b>
                </div>
                <div className="teams-detail-members">
                  {detailTeam.members.map((member, index) => (
                    <div key={member.id}>
                      <span>
                        {member.fullName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(-2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div>
                        <strong>{member.fullName}</strong>
                        <a href={`tel:${member.phoneNumber}`}>{member.phoneNumber}</a>
                        <small>Thành viên {index + 1}</small>
                      </div>
                    </div>
                  ))}
                  {!detailTeam.members.length && (
                    <div className="teams-detail-empty">Team chưa có thành viên.</div>
                  )}
                </div>
              </section>

              <section className="teams-detail-section">
                <div className="teams-detail-section-title">
                  <div>
                    <span>02</span>
                    <h3>Intake Batch được phân công</h3>
                  </div>
                  <b>
                    {detailTeam.completedBatches}/{detailTeam.assignedBatches} lô hoàn thành
                  </b>
                </div>
                <div className="classification-detail-batches">
                  {detailTeamBatches.map((batch) => (
                    <article className="teams-detail-batch" key={batch.id}>
                      <div className="teams-detail-batch-code">
                        <PackageCheck size={18} />
                        <div>
                          <span>INTAKE BATCH</span>
                          <strong>{batch.batchCode}</strong>
                        </div>
                        <b>{getStatusLabel(batch.status)}</b>
                      </div>
                      <div className="teams-detail-batch-grid">
                        <div>
                          <span>Khu vực hiện tại</span>
                          <strong>{batch.currentAreaName || 'Chưa ghi nhận'}</strong>
                        </div>
                        <div>
                          <span>Khối lượng</span>
                          <strong>{batch.totalWeight.toFixed(1)} kg</strong>
                        </div>
                        <div>
                          <span>Đơn nguồn</span>
                          <strong>{batch.donationRequests} đơn</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!detailTeamBatches.length && (
                    <div className="teams-detail-empty">
                      Team chưa được phân công Intake Batch nào.
                    </div>
                  )}
                </div>
              </section>

              <div className="teams-detail-actions">
                <button
                  type="button"
                  className="ops-btn ops-btn-primary"
                  onClick={() => setDetailTeamId(null)}
                >
                  Đóng chi tiết
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Pagination({ current, total, setPage }: { current: number; total: number; setPage: (page: number) => void }) {
  return (
    <nav className="manager-shift-pagination">
      <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1}><ChevronLeft size={17} /> Trước</button>
      {paginationItems(current, total).map((item) => typeof item === 'number' ? <button className={item === current ? 'active' : ''} onClick={() => setPage(item)} key={item}>{item}</button> : <span className="manager-page-gap" key={item}>…</span>)}
      <button onClick={() => setPage(Math.min(total, current + 1))} disabled={current === total}>Sau <ChevronRight size={17} /></button>
    </nav>
  );
}
