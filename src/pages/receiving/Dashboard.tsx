import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Square,
  Truck,
  ClipboardList,
  CheckCircle,
  Scale,
  ArrowRight,
  Calendar,
  Layers,
  Users,
  Clock3,
  MapPin,
  Phone,
  Search,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  X,
  PackageOpen,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import { getReceivingBatchPresentation } from '@/services/receivingService';
import type {
  ReceivingBatch,
  ReceivingRequest,
  WarehouseDropOffBoard,
  WarehouseDropOffItem,
} from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './Dashboard.css';

type TabKey = 'receiving' | 'completed' | 'transferring';
type AssignedTeamView = {
  teamName: string;
  teamType: 'ReceivingPickup' | 'ReceivingWarehouse';
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  warehouseAddress: string;
  members: ReceivingBatch['teamMembers'];
};

const isTab = (v: string | null): v is TabKey =>
  v === 'receiving' || v === 'completed' || v === 'transferring';

const getLocalDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState<ReceivingBatch[]>([]);
  const [requests, setRequests] = useState<ReceivingRequest[]>([]);
  const [teamDate, setTeamDate] = useState(getLocalDateValue);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [batchShiftFilter, setBatchShiftFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [dropOffBoard, setDropOffBoard] = useState<WarehouseDropOffBoard>({
    dutyContexts: [],
    requests: [],
  });
  const [dropOffSearch, setDropOffSearch] = useState('');
  const [dropOffDate, setDropOffDate] = useState('');
  const [dropOffShiftFilter, setDropOffShiftFilter] = useState('');
  const [dropOffPage, setDropOffPage] = useState(1);
  const [receivingDropOff, setReceivingDropOff] = useState<WarehouseDropOffItem | null>(null);
  const [dropOffForm, setDropOffForm] = useState({ actualWeight: 1, notes: '' });
  const [savingDropOff, setSavingDropOff] = useState(false);
  const dropOffPageSize = 6;

  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isTab(tabParam) ? tabParam : 'receiving';
  const setActiveTab = (t: TabKey) =>
    setSearchParams(t === 'receiving' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    if (!isTab(tabParam)) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById('receiving-batch-list')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tabParam]);

  useEffect(() => {
    Promise.all([receivingService.getMyBatches(), receivingService.getMyWarehouseDropOffs()])
      .then(([data, dropOffData]) => {
        setBatches(data);
        setDropOffBoard(dropOffData);
        setRequests(data.flatMap((batch) => batch.requests));
        const today = getLocalDateValue();
        const active = data.some((batch) =>
          batch.shiftStatus === 'InProgress' && batch.teamStatus === 'InProgress'
            && batch.date.slice(0, 10) === today)
          || dropOffData.dutyContexts.some((context) =>
            context.shiftStatus === 'InProgress' && context.teamStatus === 'InProgress'
              && context.shiftDate.slice(0, 10) === today);
        setIsShiftActive(active);
      })
      .catch(() => toast.error('Không thể tải tuyến thu gom được phân công.'));
  }, []);

  const reloadDropOffs = async () =>
    setDropOffBoard(await receivingService.getMyWarehouseDropOffs());

  const reloadShiftState = async () => {
    const [data, dropOffData] = await Promise.all([
      receivingService.getMyBatches(), receivingService.getMyWarehouseDropOffs(),
    ]);
    setBatches(data);
    setDropOffBoard(dropOffData);
    setRequests(data.flatMap((batch) => batch.requests));
    const today = getLocalDateValue();
    setIsShiftActive(data.some((batch) =>
      batch.shiftStatus === 'InProgress' && batch.teamStatus === 'InProgress'
        && batch.date.slice(0, 10) === today)
      || dropOffData.dutyContexts.some((context) =>
        context.shiftStatus === 'InProgress' && context.teamStatus === 'InProgress'
          && context.shiftDate.slice(0, 10) === today));
  };

  useEffect(() => {
    const refreshFromApi = () => { void reloadShiftState(); };
    window.addEventListener('focus', refreshFromApi);
    return () => window.removeEventListener('focus', refreshFromApi);
  }, []);

  const handleToggleShift = async () => {
    const nextState = !isShiftActive;

    if (nextState) {
      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const scheduledToday = batches.filter(
        (batch) =>
          batch.teamStatus === 'Scheduled' &&
          batch.date.slice(0, 10) === localDate &&
          (batch.status === 'Planned' || batch.status === 'Receiving'),
      );
      const scheduledWarehouseTeams = dropOffBoard.dutyContexts.filter(
        (context) => context.teamStatus === 'Scheduled'
          && context.shiftDate.slice(0, 10) === localDate,
      );
      const targetShiftId = (
        scheduledToday.find(
          (batch) =>
            batch.startTime.slice(0, 5) <= currentTime && currentTime <= batch.endTime.slice(0, 5),
        ) || scheduledToday[0]
      )?.shiftId;
      const targetWarehouseTeam = scheduledWarehouseTeams.find(
        (context) => context.startTime.slice(0, 5) <= currentTime
          && currentTime <= context.endTime.slice(0, 5),
      ) || scheduledWarehouseTeams[0];
      if (!targetShiftId && !targetWarehouseTeam) {
        setIsShiftActive(false);
        return toast.warning('Không có ca làm được phân công cho hôm nay.');
      }
      if (targetShiftId) {
        await Promise.all(
          scheduledToday
            .filter((batch) => batch.shiftId === targetShiftId)
            .map((batch) => receivingService.startBatch(batch.id)),
        );
      } else {
        await receivingService.startTeam(targetWarehouseTeam!.teamId);
      }
      toast.success('Bắt đầu ca làm việc thành công! Trạng thái đơn đã sẵn sàng.');
      await reloadShiftState();
      // Update UI to reload indicators
    } else {
      const shiftIds = [
        ...new Set(
          [
            ...batches
            .filter((batch) => batch.teamStatus === 'InProgress'
                && batch.date.slice(0, 10) === getLocalDateValue())
              .map((batch) => batch.shiftId),
            ...dropOffBoard.dutyContexts
              .filter((context) => context.teamStatus === 'InProgress'
                && context.shiftDate.slice(0, 10) === getLocalDateValue())
              .map((context) => context.shiftId),
          ],
        ),
      ];
      await Promise.all(shiftIds.map((shiftId) => receivingService.completeShift(shiftId)));
      toast.info('Đã kết thúc ca làm việc.');
      await reloadShiftState();
    }
  };

  const totalWeight = requests
    .filter((r) => r.status === 'Received' && r.actualWeight)
    .reduce((sum, r) => sum + (r.actualWeight || 0), 0);

  const processedCount = requests.filter((r) => r.status !== 'Pending').length;
  const totalCount = requests.length;
  const completionPct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const assignedTeamEntries: Array<[string, AssignedTeamView]> = [
    ...batches.map((batch) => [
      `${batch.shiftId}-${batch.teamName}`,
      {
        teamName: batch.teamName,
        teamType: 'ReceivingPickup',
        shiftName: batch.shiftName,
        shiftDate: batch.date,
        startTime: batch.startTime,
        endTime: batch.endTime,
        warehouseAddress: batch.warehouseAddress,
        members: batch.teamMembers,
      },
    ] as [string, AssignedTeamView]),
    ...dropOffBoard.dutyContexts.map((context) => [
      `${context.shiftId}-${context.teamName}`,
      {
        teamName: context.teamName,
        teamType: 'ReceivingWarehouse',
        shiftName: context.shiftName,
        shiftDate: context.shiftDate,
        startTime: context.startTime,
        endTime: context.endTime,
        warehouseAddress: context.warehouseAddress,
        members: context.members,
      },
    ] as [string, AssignedTeamView]),
  ];
  const assignedTeams = Array.from(new Map(assignedTeamEntries).values());
  const filteredAssignedTeams = teamDate
    ? assignedTeams.filter((team) => team.shiftDate?.slice(0, 10) === teamDate)
    : assignedTeams;

  const dropOffDates = Array.from(
    new Set(dropOffBoard.dutyContexts.map((x) => x.shiftDate.slice(0, 10))),
  ).sort();
  const normalizedDropOffSearch = dropOffSearch
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const filteredDropOffs = dropOffBoard.requests.filter((request) => {
    const contexts = dropOffBoard.dutyContexts.filter(
      (context) =>
        context.warehouseId === request.warehouseId &&
        context.shiftDate.slice(0, 10) === request.expectedDate.slice(0, 10),
    );
    const text =
      `${request.code} ${request.contactName} ${request.phoneNumber} ${request.description} ${request.carrierName || ''} ${request.trackingCode || ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return (
      (!dropOffDate || request.expectedDate.slice(0, 10) === dropOffDate) &&
      (!dropOffShiftFilter || contexts.some((x) => x.shiftStatus === dropOffShiftFilter)) &&
      (!normalizedDropOffSearch || text.includes(normalizedDropOffSearch))
    );
  });
  const dropOffPages = Math.max(1, Math.ceil(filteredDropOffs.length / dropOffPageSize));
  const pagedDropOffs = filteredDropOffs.slice(
    (dropOffPage - 1) * dropOffPageSize,
    dropOffPage * dropOffPageSize,
  );
  useEffect(() => setDropOffPage(1), [dropOffSearch, dropOffDate, dropOffShiftFilter]);
  useEffect(() => {
    if (dropOffPage > dropOffPages) setDropOffPage(dropOffPages);
  }, [dropOffPage, dropOffPages]);
  const canReceiveDropOff = (request: WarehouseDropOffItem) =>
    dropOffBoard.dutyContexts.some(
      (context) =>
        context.warehouseId === request.warehouseId &&
        context.shiftDate.slice(0, 10) === request.expectedDate.slice(0, 10) &&
        context.shiftStatus === 'InProgress' && context.teamStatus === 'InProgress',
    );
  const confirmDropOff = async () => {
    if (!receivingDropOff || dropOffForm.actualWeight <= 0)
      return toast.warning('Khối lượng thực nhận phải lớn hơn 0.');
    setSavingDropOff(true);
    try {
      await receivingService.confirmWarehouseDropOff(receivingDropOff.id, dropOffForm);
      toast.success('Đã tiếp nhận đơn tại kho và thêm vào Intake Batch của ca hiện tại.');
      setReceivingDropOff(null);
      await reloadDropOffs();
      const data = await receivingService.getMyBatches();
      setBatches(data);
      setRequests(data.flatMap((batch) => batch.requests));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận nhận hàng tại kho.');
    } finally {
      setSavingDropOff(false);
    }
  };

  const shiftPeriod = (batch: ReceivingBatch) => {
    const normalized = batch.shiftName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalized.includes('chieu')) return 'afternoon';
    if (normalized.includes('sang')) return 'morning';
    return Number(batch.startTime.slice(0, 2)) < 12 ? 'morning' : 'afternoon';
  };
  const filteredBatches = batches.filter((batch) => {
    if (batchShiftFilter !== 'all' && shiftPeriod(batch) !== batchShiftFilter) return false;
    if (activeTab === 'receiving')
      return batch.status === 'Receiving' || batch.status === 'Planned';
    if (activeTab === 'completed') return batch.status === 'Completed';
    return ['AwaitingClassificationAssignment', 'AssignedToClassification', 'SentToClassification'].includes(batch.status);
  });

  const getBatchProgress = (batchId: string) => {
    const batchRequests = requests.filter((r) => r.batchId === batchId);
    if (batchRequests.length === 0) return { processed: 0, total: 0, percentage: 0 };
    const processed = batchRequests.filter((r) => r.status !== 'Pending').length;
    const total = batchRequests.length;
    return { processed, total, percentage: Math.round((processed / total) * 100) };
  };

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Bộ phận Tiếp nhận</span>
          <h1>Điều phối thu gom quyên góp</h1>
          <p>
            Thu gom quần áo quyên góp theo tuyến, cập nhật số liệu thực tế và bàn giao lô hàng cho
            tổ phân loại.
          </p>
        </div>
        <div className="ops-pagehead-aside">
          <button
            type="button"
            className={`rcv-shift-btn ${isShiftActive ? 'active' : ''}`}
            onClick={handleToggleShift}
          >
            {isShiftActive ? (
              <>
                <Square size={15} fill="currentColor" /> Kết thúc ca
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" /> Bắt đầu ca
              </>
            )}
          </button>
        </div>
      </header>

      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Trạng thái ca</span>
          <div className="ops-stat-value" style={{ fontSize: '1.15rem' }}>
            <span className={`rcv-shift-dot ${isShiftActive ? 'on' : ''}`} />
            {isShiftActive ? 'Trong ca' : 'Nghỉ ca'}
          </div>
          <span className="ops-stat-foot">
            {isShiftActive ? 'tuyến thu nhận đang mở' : 'bấm Bắt đầu ca để mở tuyến'}
          </span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng khối lượng</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon">
              <Scale size={18} strokeWidth={2} />
            </span>
            {totalWeight.toFixed(1)}
          </div>
          <span className="ops-stat-foot">kg đã thực nhận</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tiến độ đơn</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon">
              <ClipboardList size={18} strokeWidth={2} />
            </span>
            {processedCount}/{totalCount}
          </div>
          <span className="ops-stat-foot">đơn đã xử lý</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Hoàn thành ca</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon">
              <CheckCircle size={18} strokeWidth={2} />
            </span>
            {completionPct}%
          </div>
          <span className="ops-stat-foot">trên tổng số đơn</span>
        </div>
      </div>

      <section className="rcv-team-section" aria-labelledby="receiving-team-title">
        <div className="ops-section-head">
          <div>
            <span className="rcv-section-kicker">Phân công hiện tại</span>
            <h2 id="receiving-team-title">Thông tin nhóm của tôi</h2>
          </div>
        </div>

        <div className="rcv-team-filter">
          <div className="rcv-team-filter-field">
            <Calendar size={17} />
            <label htmlFor="dashboard-team-date-filter">Ngày làm việc</label>
            <input
              id="dashboard-team-date-filter"
              type="date"
              value={teamDate}
              onChange={(event) => setTeamDate(event.target.value)}
            />
          </div>
          {teamDate && (
            <button
              type="button"
              className="ops-btn ops-btn-secondary"
              onClick={() => setTeamDate('')}
            >
              <X size={15} /> Xóa lọc
            </button>
          )}
        </div>

        {assignedTeams.length === 0 ? (
          <div className="rcv-team-empty">
            <Users size={28} strokeWidth={1.6} />
            <div>
              <strong>Chưa có thông tin team</strong>
              <p>Manager cần tạo team, thêm thành viên và phân công Intake Batch cho team.</p>
            </div>
          </div>
        ) : filteredAssignedTeams.length === 0 ? (
          <div className="rcv-team-empty">
            <Calendar size={28} strokeWidth={1.6} />
            <div>
              <strong>Không có team trong ngày đã chọn</strong>
              <p>Chọn ngày khác hoặc xóa bộ lọc để xem toàn bộ team đã được phân công.</p>
            </div>
          </div>
        ) : (
          <div className="rcv-team-grid">
            {filteredAssignedTeams.map((team) => (
              <article
                className="rcv-team-card"
                key={`${team.shiftName}-${team.teamName}-${team.shiftDate}`}
              >
                <div className="rcv-team-card-head">
                  <span className="rcv-team-icon">
                    <Users size={21} />
                  </span>
                  <div>
                    <span>{team.teamType === 'ReceivingWarehouse' ? 'Nhóm trực kho' : 'Nhóm tiếp nhận'}</span>
                    <h3>{team.teamName || 'Chưa đặt tên team'}</h3>
                  </div>
                  <span className="rcv-member-count">{team.members.length} thành viên</span>
                </div>

                <div className="rcv-team-assignment">
                  <span>
                    <Calendar size={15} /> {team.shiftName || 'Ca được phân công'} ·{' '}
                    {team.shiftDate}
                  </span>
                  <span>
                    <Clock3 size={15} />
                    {team.startTime?.slice(0, 5) || '--:--'}–{team.endTime?.slice(0, 5) || '--:--'}
                  </span>
                  <span>
                    <MapPin size={15} /> {team.warehouseAddress || 'Chưa có địa chỉ kho'}
                  </span>
                </div>

                <div className="rcv-team-members">
                  {team.members.map((member, index) => (
                    <div className="rcv-team-member" key={member.id}>
                      <span className="rcv-member-avatar">
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
                        <a href={`tel:${member.phoneNumber}`}>
                          <Phone size={13} /> {member.phoneNumber || 'Chưa có số điện thoại'}
                        </a>
                      </div>
                      <span className="rcv-member-role">Thành viên {index + 1}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {dropOffBoard.dutyContexts.length > 0 && (
        <section className="rcv-dropoff-section">
          <div className="ops-section-head">
            <div>
              <span className="rcv-section-kicker">Tiếp nhận trực tiếp</span>
              <h2>Đơn dự kiến mang đến kho</h2>
            </div>
            <span>
              {filteredDropOffs.length}/{dropOffBoard.requests.length} đơn đang chờ
            </span>
          </div>
          <div className="rcv-dropoff-duty">
            {dropOffBoard.dutyContexts.map((context) => (
              <span
                className={context.teamStatus === 'InProgress' ? 'active' : ''}
                key={context.teamId}
              >
                <Warehouse size={15} />
                <b>{context.teamName}</b>
                <small>
                  {context.shiftName} · {context.startTime.slice(0, 5)}–
                  {context.endTime.slice(0, 5)} ·{' '}
                  {context.teamStatus === 'InProgress' ? 'Đang trực' : 'Chưa bắt đầu'}
                </small>
              </span>
            ))}
          </div>
          <div className="rcv-dropoff-filters">
            <div>
              <Search size={16} />
              <input
                value={dropOffSearch}
                onChange={(e) => setDropOffSearch(e.target.value)}
                placeholder="Tìm mã đơn, tên, SĐT, mô tả..."
              />
            </div>
            <select value={dropOffDate} onChange={(e) => setDropOffDate(e.target.value)}>
              <option value="">Tất cả ngày</option>
              {dropOffDates.map((date) => (
                <option value={date} key={date}>
                  {new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
            <select
              value={dropOffShiftFilter}
              onChange={(e) => setDropOffShiftFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái ca</option>
              <option value="InProgress">Ca đang trực</option>
              <option value="Scheduled">Ca chưa bắt đầu</option>
            </select>
            {(dropOffSearch || dropOffDate || dropOffShiftFilter) && (
              <button
                onClick={() => {
                  setDropOffSearch('');
                  setDropOffDate('');
                  setDropOffShiftFilter('');
                }}
              >
                <X size={14} />
                Xóa lọc
              </button>
            )}
          </div>
          <div className="rcv-dropoff-grid">
            {pagedDropOffs.map((request) => {
              const enabled = canReceiveDropOff(request);
              return (
                <article className="rcv-dropoff-card" key={request.id}>
                  <header>
                    <div>
                      <span>{request.code}</span>
                      <h3>{request.contactName}</h3>
                    </div>
                    <b>{request.dropOffMethod === 'ThirdPartyDelivery' ? 'Chờ đơn vị vận chuyển' : 'Chờ donor đến'}</b>
                  </header>
                  <p>
                    <Phone size={14} />
                    {request.phoneNumber}
                  </p>
                  <p>
                    <PackageOpen size={14} />
                    {request.description || 'Quần áo quyên góp'} · dự kiến {request.estimateWeight}{' '}
                    kg
                  </p>
                  <p>
                    <Calendar size={14} />
                    Dự kiến: {new Date(request.expectedDate).toLocaleString('vi-VN', {
                      dateStyle: 'short', timeStyle: 'short',
                    })}
                  </p>
                  {request.dropOffMethod === 'ThirdPartyDelivery' && (
                    <p>
                      <Truck size={14} />
                      {request.trackingCode
                        ? <>{request.carrierName} · Mã vận đơn: <strong>{request.trackingCode}</strong></>
                        : <strong>Donor chưa cập nhật mã vận đơn</strong>}
                    </p>
                  )}
                  <button
                    disabled={!enabled}
                    onClick={() => {
                      setReceivingDropOff(request);
                      setDropOffForm({ actualWeight: request.estimateWeight || 1, notes: '' });
                    }}
                  >
                    <PackageOpen size={15} />
                    {enabled
                      ? request.dropOffMethod === 'ThirdPartyDelivery'
                        ? 'Xác nhận đã nhận kiện hàng'
                        : 'Xác nhận donor đã đến'
                      : 'Bắt đầu ca trực để tiếp nhận'}
                  </button>
                </article>
              );
            })}
            {!pagedDropOffs.length && (
              <div className="ops-empty">
                <PackageOpen size={32} />
                <h4>Không có đơn chờ phù hợp</h4>
              </div>
            )}
          </div>
          {dropOffPages > 1 && (
            <nav className="rcv-dropoff-pagination">
              <button disabled={dropOffPage === 1} onClick={() => setDropOffPage((x) => x - 1)}>
                <ChevronLeft size={15} />
                Trước
              </button>
              <span>
                Trang {dropOffPage}/{dropOffPages}
              </span>
              <button
                disabled={dropOffPage === dropOffPages}
                onClick={() => setDropOffPage((x) => x + 1)}
              >
                Sau
                <ChevronRight size={15} />
              </button>
            </nav>
          )}
        </section>
      )}

      <section id="receiving-batch-list" className="rcv-batch-list-section">
        <div className="ops-section-head">
          <h2>Các lô hàng tiếp nhận</h2>
        </div>

        <div className="rcv-batch-filter-row">
        <div className="ops-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'receiving'}
            className={`ops-tab ${activeTab === 'receiving' ? 'active' : ''}`}
            onClick={() => setActiveTab('receiving')}
          >
            <Truck size={15} strokeWidth={2} />
            Đang thu nhận
            <span className="ops-tab-count">
              {batches.filter((b) => b.status === 'Receiving' || b.status === 'Planned').length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'completed'}
            className={`ops-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={15} strokeWidth={2} />
            Đã gom xong
            <span className="ops-tab-count">
              {batches.filter((b) => b.status === 'Completed').length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transferring'}
            className={`ops-tab ${activeTab === 'transferring' ? 'active' : ''}`}
            onClick={() => setActiveTab('transferring')}
          >
            <Layers size={15} strokeWidth={2} />
            Đang chuyển đi
            <span className="ops-tab-count">
              {batches.filter((b) => ['AwaitingClassificationAssignment', 'AssignedToClassification', 'SentToClassification'].includes(b.status)).length}
            </span>
          </button>
        </div>
          <label className="rcv-shift-filter">
            <Clock3 size={15} />
            <span>Ca làm</span>
            <select value={batchShiftFilter} onChange={(event) => setBatchShiftFilter(event.target.value as typeof batchShiftFilter)}>
              <option value="all">Tất cả ca</option>
              <option value="morning">Ca sáng</option>
              <option value="afternoon">Ca chiều</option>
            </select>
          </label>
        </div>

        <div className="ops-list">
          {filteredBatches.length === 0 ? (
            <div className="ops-empty">
              <ClipboardList size={36} strokeWidth={1.5} />
              <h4>Không có lô tiếp nhận nào</h4>
              <p>Không tìm thấy lô hàng nào ở mục này.</p>
            </div>
          ) : (
            filteredBatches.map((batch) => {
              const progress = getBatchProgress(batch.id);
              const isCompleted = batch.status === 'Completed';
              const isReceiving = batch.status === 'Receiving' || batch.status === 'Planned';
              const batchPresentation = getReceivingBatchPresentation(batch.status);
              const disabled = (batch.shiftStatus !== 'InProgress'
                || batch.teamStatus !== 'InProgress') && isReceiving;

              return (
                <article
                  key={batch.id}
                  className={`ops-card ${disabled ? 'rcv-card-disabled' : ''}`}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' || disabled) return;
                    navigate(`/receiving/batch/${batch.id}`);
                  }}
                  onClick={() => {
                    if (disabled) {
                      toast.warning('Vui lòng Bắt đầu ca làm trước khi xem chi tiết.');
                      return;
                    }
                    navigate(`/receiving/batch/${batch.id}`);
                  }}
                >
                  <div className="ops-card-top">
                    <div>
                      <div className="ops-card-code">{batch.code}</div>
                      <div className="ops-card-meta">
                        <span>
                          <Calendar size={12} strokeWidth={2} /> {batch.date}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`ops-badge ${batchPresentation.tone}`}
                    >
                      {batchPresentation.label}
                    </span>
                  </div>

                  <h3>{batch.route}</h3>
                  <div className="rcv-team-summary">
                    <Users size={15} />
                    <strong>{batch.teamName || 'Receiving team'}</strong>
                    <span>
                      {batch.teamMembers
                        .map((member) => `${member.fullName} (${member.phoneNumber})`)
                        .join(' · ')}
                    </span>
                  </div>

                  <div className="rcv-progress">
                    <div className="rcv-progress-labels">
                      <span>Tiến độ thu gom</span>
                      <strong>
                        {progress.processed}/{progress.total} đơn
                      </strong>
                    </div>
                    <div className="ops-cap-track">
                      <div className="ops-cap-fill" style={{ width: `${progress.percentage}%` }} />
                    </div>
                  </div>

                  <div className="ops-card-footer">
                    {isCompleted ? (
                      <button
                        type="button"
                        className="rcv-handoff-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/receiving/receiving-area?batchId=${batch.id}`);
                        }}
                      >
                        <Warehouse size={14} /> Xếp vào Khu nhận đồ <ArrowRight size={14} />
                      </button>
                    ) : (
                      <>
                        <span>Xem đơn trong lô</span>
                        <span className="ops-card-action">
                          Chi tiết <ArrowRight size={14} strokeWidth={2} />
                        </span>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      {receivingDropOff && (
        <div
          className="rcv-dropoff-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingDropOff) setReceivingDropOff(null);
          }}
        >
          <section className="rcv-dropoff-modal">
            <header>
              <div>
                <span>TIẾP NHẬN TẠI KHO</span>
                <h2>{receivingDropOff.code}</h2>
                <p>
                  {receivingDropOff.contactName} · {receivingDropOff.phoneNumber}
                </p>
              </div>
              <button onClick={() => setReceivingDropOff(null)}>
                <X />
              </button>
            </header>
            <div className="rcv-dropoff-form">
              <label>
                Khối lượng thực nhận (kg)
                <input
                  type="number"
                  min=".1"
                  step=".1"
                  value={dropOffForm.actualWeight}
                  onChange={(e) =>
                    setDropOffForm({ ...dropOffForm, actualWeight: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Ghi chú tiếp nhận
                <textarea
                  value={dropOffForm.notes}
                  onChange={(e) => setDropOffForm({ ...dropOffForm, notes: e.target.value })}
                  placeholder="Tình trạng bao bì, sai lệch khối lượng..."
                />
              </label>
              <div>
                <button onClick={() => setReceivingDropOff(null)}>Hủy</button>
                <button
                  disabled={savingDropOff || dropOffForm.actualWeight <= 0}
                  onClick={confirmDropOff}
                >
                  {savingDropOff ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
