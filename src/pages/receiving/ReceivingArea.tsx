import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  PackageCheck,
  Search,
  Send,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingBatch, ReceivingLocationBatch } from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './ReceivingArea.css';

type StageFilter = 'waiting' | 'stored' | 'transferred';
type ShiftFilter = 'all' | 'morning' | 'afternoon';

const transferStatuses = new Set([
  'AwaitingClassificationAssignment',
  'AssignedToClassification',
  'SentToClassification',
]);

const getShiftPeriod = (batch: ReceivingBatch): Exclude<ShiftFilter, 'all'> => {
  const normalized = batch.shiftName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (normalized.includes('chieu')) return 'afternoon';
  if (normalized.includes('sang')) return 'morning';
  return Number(batch.startTime.slice(0, 2)) < 12 ? 'morning' : 'afternoon';
};

const statusLabel = (status: ReceivingBatch['status']) => {
  if (status === 'Completed') return 'Chờ xếp vị trí';
  if (status === 'ReceivedAtWarehouse') return 'Đã vào Khu nhận đồ';
  if (status === 'AssignedToClassification') return 'Đã phân công phân loại';
  if (status === 'AwaitingClassificationAssignment') return 'Chờ điều phối phân loại';
  return 'Đang chuyển phân loại';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const ReceivingArea: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [batches, setBatches] = useState<ReceivingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sendingBatchId, setSendingBatchId] = useState<string | null>(null);
  const [stage, setStage] = useState<StageFilter>('waiting');
  const [shift, setShift] = useState<ShiftFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [placementBatch, setPlacementBatch] = useState<ReceivingBatch | null>(null);
  const [areaName, setAreaName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selectedLocationCode, setSelectedLocationCode] = useState<string | null>(null);
  const [locationBatches, setLocationBatches] = useState<ReceivingLocationBatch[]>([]);
  const [locationBatchesLoading, setLocationBatchesLoading] = useState(false);
  const [detailBatch, setDetailBatch] = useState<ReceivingBatch | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const pageSize = 6;
  const requestPageSize = 3;

  const load = async () => {
    setLoading(true);
    try {
      const data = await receivingService.getMyBatches();
      setBatches(data);
      const requestedId = searchParams.get('batchId');
      const requested = data.find(
        (batch) => batch.id === requestedId && batch.status === 'Completed',
      );
      if (requested) openPlacement(requested);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu Khu nhận đồ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => setPage(1), [stage, shift, search]);

  const counts = useMemo(
    () => ({
      waiting: batches.filter((batch) => batch.status === 'Completed').length,
      stored: batches.filter((batch) => batch.status === 'ReceivedAtWarehouse').length,
      transferred: batches.filter((batch) => transferStatuses.has(batch.status)).length,
    }),
    [batches],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return batches.filter((batch) => {
      const matchesStage =
        stage === 'waiting'
          ? batch.status === 'Completed'
          : stage === 'stored'
            ? batch.status === 'ReceivedAtWarehouse'
            : transferStatuses.has(batch.status);
      const matchesShift = shift === 'all' || getShiftPeriod(batch) === shift;
      const matchesSearch =
        !query ||
        batch.code.toLocaleLowerCase('vi').includes(query) ||
        batch.route.toLocaleLowerCase('vi').includes(query) ||
        batch.teamName.toLocaleLowerCase('vi').includes(query) ||
        batch.warehouseName.toLocaleLowerCase('vi').includes(query) ||
        (batch.currentLocationCode || '').toLocaleLowerCase('vi').includes(query);
      return matchesStage && matchesShift && matchesSearch;
    });
  }, [batches, search, shift, stage]);

  const receivingGroups = useMemo(() => {
    const unique = new Map<string, ReceivingBatch['receivingGroups'][number]>();
    batches.forEach((batch) => {
      batch.receivingGroups.forEach((group) => unique.set(group.id, group));
    });
    return [...unique.values()].sort((a, b) => a.groupName.localeCompare(b.groupName, 'vi'));
  }, [batches]);

  useEffect(() => {
    if (receivingGroups.length > 0 && openGroups.size === 0) {
      setOpenGroups(new Set(receivingGroups.map((group) => group.id)));
    }
  }, [receivingGroups]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openLocation = async (locationId: string, locationCode: string) => {
    setSelectedLocationCode(locationCode);
    setLocationBatches([]);
    setLocationBatchesLoading(true);
    try {
      setLocationBatches(await receivingService.getLocationBatches(locationId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải các batch tại vị trí.');
    } finally {
      setLocationBatchesLoading(false);
    }
  };

  const requestTotalPages = detailBatch
    ? Math.max(1, Math.ceil(detailBatch.requests.length / requestPageSize))
    : 1;
  const safeRequestPage = Math.min(requestPage, requestTotalPages);
  const pagedRequests = detailBatch
    ? detailBatch.requests.slice(
        (safeRequestPage - 1) * requestPageSize,
        safeRequestPage * requestPageSize,
      )
    : [];

  const openBatchDetail = (batch: ReceivingBatch) => {
    setRequestPage(1);
    setDetailBatch(batch);
  };

  function openPlacement(batch: ReceivingBatch) {
    const firstArea = batch.receivingGroups[0]?.areaName || '';
    setPlacementBatch(batch);
    setAreaName(firstArea);
    setGroupId('');
    setLocationId('');
  }

  const closePlacement = () => {
    if (busy) return;
    setPlacementBatch(null);
    setSearchParams({}, { replace: true });
  };

  const areaOptions = placementBatch
    ? [...new Set(placementBatch.receivingGroups.map((group) => group.areaName))]
    : [];
  const groupOptions =
    placementBatch?.receivingGroups.filter((group) => group.areaName === areaName) ?? [];
  const selectedGroup = groupOptions.find((group) => group.id === groupId);
  const locationOptions =
    selectedGroup?.locations.filter(
      (location) =>
        location.status.toLowerCase() === 'available' &&
        location.availableKg >= (placementBatch?.totalWeight ?? 0),
    ) ?? [];

  const submitPlacement = async () => {
    if (!placementBatch || !groupId || !locationId) {
      toast.warning('Vui lòng chọn đầy đủ khu vực, dãy và vị trí nhận đồ.');
      return;
    }
    setBusy(true);
    try {
      await receivingService.receiveAtWarehouse(placementBatch.id, groupId, locationId);
      toast.success(`Đã xếp ${placementBatch.code} vào Khu nhận đồ.`);
      setPlacementBatch(null);
      setSearchParams({}, { replace: true });
      setStage('stored');
      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Không thể xếp Intake Batch vào vị trí đã chọn.',
      );
    } finally {
      setBusy(false);
    }
  };

  const sendToClassification = async (batch: ReceivingBatch) => {
    if (sendingBatchId) return;
    setSendingBatchId(batch.id);
    try {
      await receivingService.sendToClassification(batch.id);
      setBatches((current) => current.map((item) => ({
        ...item,
        ...(item.id === batch.id
          ? {
              status: 'AwaitingClassificationAssignment' as const,
              currentAreaName: null,
              currentGroupName: null,
              currentLocationCode: null,
            }
          : {}),
        receivingGroups: item.receivingGroups.map((group) => {
          const containsLocation = group.locations.some(
            (location) => location.locationCode === batch.currentLocationCode,
          );
          if (!containsLocation) return group;
          return {
            ...group,
            currentKg: Math.max(0, group.currentKg - batch.totalWeight),
            availableKg: Math.min(group.capacityKg, group.availableKg + batch.totalWeight),
            locations: group.locations.map((location) =>
              location.locationCode === batch.currentLocationCode
                ? {
                    ...location,
                    currentKg: Math.max(0, location.currentKg - batch.totalWeight),
                    availableKg: Math.min(
                      location.capacityKg,
                      location.availableKg + batch.totalWeight,
                    ),
                    batchCount: Math.max(0, location.batchCount - 1),
                  }
                : location,
            ),
          };
        }),
      })));
      setLocationBatches((current) => current.filter((item) => item.id !== batch.id));
      toast.success(`Đã gửi ${batch.code} sang điều phối phân loại.`);
      if (detailBatch?.id === batch.id) setDetailBatch(null);
      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Không thể gửi Intake Batch sang phân loại.',
      );
    } finally {
      setSendingBatchId(null);
    }
  };

  const toggleGroup = (groupIdToToggle: string) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(groupIdToToggle)) next.delete(groupIdToToggle);
      else next.add(groupIdToToggle);
      return next;
    });
  };

  const renderBatchCard = (batch: ReceivingBatch) => (
    <article
      className="receiving-area-card"
      key={batch.id}
      onClick={() => setDetailBatch(batch)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') setDetailBatch(batch);
      }}
    >
      <header>
        <div>
          <b>{batch.code}</b>
          <span>
            <Calendar size={13} /> {batch.date} · {batch.shiftName}
          </span>
        </div>
        <em>{statusLabel(batch.status)}</em>
      </header>
      <h3>{batch.route}</h3>
      <div className="receiving-area-warehouse">
        <Warehouse size={15} />
        <div>
          <span>Kho tiếp nhận</span>
          <strong>{batch.warehouseName}</strong>
          <small>{batch.warehouseAddress}</small>
        </div>
      </div>
      <div className="receiving-area-card__facts">
        <span>Team</span>
        <strong>{batch.teamName}</strong>
        <span>Khối lượng</span>
        <strong>{batch.totalWeight.toFixed(1)} kg</strong>
      </div>
      {batch.currentLocationCode && (
        <div className="receiving-area-location">
          <MapPin size={15} />
          <div>
            <span>Vị trí hiện tại</span>
            <strong>
              {batch.currentAreaName} · {batch.currentGroupName}
              <br />
              {batch.currentLocationCode}
            </strong>
          </div>
        </div>
      )}
      {batch.status === 'Completed' && (
        <button
          className="receiving-area-primary"
          onClick={(event) => {
            event.stopPropagation();
            openPlacement(batch);
          }}
        >
          <Warehouse size={16} /> Xếp vào Khu nhận đồ
        </button>
      )}
      {batch.status === 'ReceivedAtWarehouse' && (
        <button
          className="receiving-area-primary"
          disabled={sendingBatchId === batch.id}
          onClick={(event) => {
            event.stopPropagation();
            void sendToClassification(batch);
          }}
        >
          <Send size={16} /> {sendingBatchId === batch.id ? 'Đang gửi...' : 'Gửi đi phân loại'}
        </button>
      )}
    </article>
  );

  return (
    <div className="ops-page receiving-area-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Vận hành tiếp nhận</span>
          <h1>Khu nhận đồ</h1>
          <p>
            Xếp các lô đã gom xong vào đúng khu vực, dãy và vị trí trước khi gửi phân loại.
          </p>
        </div>
      </header>

      <div className="ops-stats receiving-area-stats">
        <div className="ops-stat-card">
          <PackageCheck size={21} />
          <span>Chờ xếp vị trí</span>
          <strong>{counts.waiting}</strong>
        </div>
        <div className="ops-stat-card">
          <Warehouse size={21} />
          <span>Đang ở Khu nhận đồ</span>
          <strong>{counts.stored}</strong>
        </div>
        <div className="ops-stat-card">
          <Send size={21} />
          <span>Đã gửi phân loại</span>
          <strong>{counts.transferred}</strong>
        </div>
      </div>

      <section className="ops-panel glass">
        <div className="receiving-area-toolbar">
          <label className="receiving-area-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã lô, tuyến, team, kho hoặc vị trí..."
            />
          </label>
          <label>
            <span>Ca làm</span>
            <select
              value={shift}
              onChange={(event) => setShift(event.target.value as ShiftFilter)}
            >
              <option value="all">Tất cả ca</option>
              <option value="morning">Ca sáng</option>
              <option value="afternoon">Ca chiều</option>
            </select>
          </label>
        </div>
        <div className="ops-tabs" role="tablist">
          <button
            className={`ops-tab ${stage === 'waiting' ? 'active' : ''}`}
            onClick={() => setStage('waiting')}
          >
            Chờ xếp vị trí <span className="ops-tab-count">{counts.waiting}</span>
          </button>
          <button
            className={`ops-tab ${stage === 'stored' ? 'active' : ''}`}
            onClick={() => setStage('stored')}
          >
            Đã vào Khu nhận đồ <span className="ops-tab-count">{counts.stored}</span>
          </button>
          <button
            className={`ops-tab ${stage === 'transferred' ? 'active' : ''}`}
            onClick={() => setStage('transferred')}
          >
            Đã gửi phân loại <span className="ops-tab-count">{counts.transferred}</span>
          </button>
        </div>
      </section>

      {loading ? (
        <div className="ops-empty">
          <span className="ops-spinner" /> Đang tải dữ liệu...
        </div>
      ) : stage === 'stored' ? (
        <section className="receiving-storage-map">
          {receivingGroups.length === 0 ? (
            <div className="ops-empty">
              <Warehouse size={38} />
              <h3>Kho chưa có cấu trúc Khu nhận đồ</h3>
              <p>Manager cần cấu hình dãy và vị trí trước khi tiếp nhận lô.</p>
            </div>
          ) : (
            receivingGroups.map((group) => {
              const expanded = openGroups.has(group.id);
              const groupBatchCount = group.locations.reduce(
                (total, location) => total + location.batchCount,
                0,
              );
              return (
                <article className="receiving-storage-group" key={group.id}>
                  <button
                    className="receiving-storage-group__header"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={expanded}
                  >
                    <div>
                      <Warehouse size={17} />
                      <span>
                        <strong>{group.groupName}</strong>
                        <small>{group.areaName}</small>
                      </span>
                    </div>
                    <span>
                      {groupBatchCount} batch · {group.currentKg.toFixed(1)}/
                      {group.capacityKg.toFixed(1)} kg
                      <ChevronDown size={17} className={expanded ? 'expanded' : ''} />
                    </span>
                  </button>
                  {expanded && (
                    <div className="receiving-storage-locations">
                      {group.locations.map((location) => {
                        return (
                          <button
                            className={`receiving-storage-location ${location.batchCount ? 'occupied' : ''}`}
                            key={location.id}
                            onClick={() => void openLocation(location.id, location.locationCode)}
                          >
                            <MapPin size={16} />
                            <span>
                              <strong>{location.locationCode}</strong>
                              <small>
                                {location.batchCount} batch · {location.currentKg.toFixed(1)}/
                                {location.capacityKg.toFixed(1)} kg
                              </small>
                            </span>
                            <em>{location.batchCount}</em>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      ) : paged.length === 0 ? (
        <div className="ops-empty">
          <Boxes size={38} />
          <h3>Không có Intake Batch phù hợp</h3>
          <p>Thử đổi ca làm, trạng thái hoặc nội dung tìm kiếm.</p>
        </div>
      ) : (
        <div className="receiving-area-grid">{paged.map(renderBatchCard)}</div>
      )}

      {stage !== 'stored' && totalPages > 1 && (
        <nav className="receiving-area-pagination">
          <button disabled={safePage === 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft size={16} /> Trước
          </button>
          <span>
            Trang {safePage}/{totalPages}
          </span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {selectedLocationCode && (
        <div
          className="receiving-area-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSelectedLocationCode(null)
          }
        >
          <section className="receiving-area-modal receiving-location-modal" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>INTAKE BATCH TẠI VỊ TRÍ</span>
                <h2>{selectedLocationCode}</h2>
                <p>{locationBatches.length} batch đang được lưu tại vị trí này.</p>
              </div>
              <button onClick={() => setSelectedLocationCode(null)} aria-label="Đóng">
                <X />
              </button>
            </header>
            <div className="receiving-location-batches">
              {locationBatchesLoading ? (
                <div className="ops-empty compact">
                  <span className="ops-spinner" /> Đang tải batch...
                </div>
              ) : locationBatches.length === 0 ? (
                <div className="ops-empty compact">
                  <Package size={34} />
                  <h3>Vị trí đang trống</h3>
                </div>
              ) : (
                locationBatches.map((batch) => (
                  <article
                    className="receiving-location-batch"
                    key={batch.id}
                  >
                    <Package size={19} />
                    <button
                      className="receiving-location-batch__detail"
                      onClick={() => {
                        const myBatch = batches.find((item) => item.id === batch.id);
                        if (myBatch) openBatchDetail(myBatch);
                      }}
                    >
                      <strong>{batch.code}</strong>
                      <small>
                        {batch.route} · {batch.totalWeight.toFixed(1)} kg
                      </small>
                    </button>
                    <div className="receiving-location-batch__actions">
                      {batch.canManage && (
                        <button onClick={() => {
                          const myBatch = batches.find((item) => item.id === batch.id);
                          if (myBatch) openBatchDetail(myBatch);
                        }}>Xem chi tiết</button>
                      )}
                      {batch.canManage && batch.status === 'ReceivedAtWarehouse' && (
                        <button
                          className="send"
                          disabled={sendingBatchId === batch.id}
                          onClick={() => {
                            const myBatch = batches.find((item) => item.id === batch.id);
                            if (myBatch) void sendToClassification(myBatch);
                          }}
                        >
                          <Send size={14} /> {sendingBatchId === batch.id ? 'Đang gửi...' : 'Gửi đi phân loại'}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
            <footer>
              <button className="secondary" onClick={() => setSelectedLocationCode(null)}>
                Đóng
              </button>
            </footer>
          </section>
        </div>
      )}

      {detailBatch && (
        <div
          className="receiving-area-modal-backdrop receiving-detail-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setDetailBatch(null)}
        >
          <section className="receiving-area-modal receiving-batch-detail" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>CHI TIẾT INTAKE BATCH</span>
                <h2>{detailBatch.code}</h2>
                <p>{statusLabel(detailBatch.status)}</p>
              </div>
              <button onClick={() => setDetailBatch(null)} aria-label="Đóng">
                <X />
              </button>
            </header>
            <div className="receiving-batch-detail__summary">
              <div><span>Tuyến tiếp nhận</span><strong>{detailBatch.route}</strong></div>
              <div><span>Kho tiếp nhận</span><strong>{detailBatch.warehouseName}</strong><small>{detailBatch.warehouseAddress}</small></div>
              <div><span>Team thực hiện</span><strong>{detailBatch.teamName}</strong></div>
              <div><span>Ca làm</span><strong>{detailBatch.shiftName} · {detailBatch.date}</strong></div>
              <div><span>Khối lượng</span><strong>{detailBatch.totalWeight.toFixed(1)} kg</strong></div>
              <div><span>Thời gian nhập khu</span><strong>{formatDateTime(detailBatch.warehouseReceivedAt)}</strong></div>
              <div><span>Người thực hiện</span><strong>{detailBatch.warehouseReceivedBy || '—'}</strong></div>
              <div><span>Vị trí</span><strong>{detailBatch.currentAreaName} · {detailBatch.currentGroupName}<br />{detailBatch.currentLocationCode}</strong></div>
            </div>
            <div className="receiving-batch-detail__requests">
              <h3><Users size={17} /> Đơn trong batch ({detailBatch.requests.length})</h3>
              {pagedRequests.map((request) => (
                <div key={request.id}>
                  <span><strong>{request.code}</strong><small>{request.donorName} · {request.phoneNumber}</small></span>
                        <em>
                          {request.actualWeight != null
                            ? `${request.actualWeight} kg`
                            : request.weight || "Chưa cân"}
                        </em>
                </div>
              ))}
              {requestTotalPages > 1 && (
                <nav className="receiving-request-pagination" aria-label="Phân trang đơn trong batch">
                  <button
                    disabled={safeRequestPage === 1}
                    onClick={() => setRequestPage((value) => Math.max(1, value - 1))}
                  >
                    <ChevronLeft size={15} /> Trước
                  </button>
                  <span>
                    Trang {safeRequestPage}/{requestTotalPages}
                  </span>
                  <button
                    disabled={safeRequestPage === requestTotalPages}
                    onClick={() =>
                      setRequestPage((value) => Math.min(requestTotalPages, value + 1))
                    }
                  >
                    Sau <ChevronRight size={15} />
                  </button>
                </nav>
              )}
            </div>
            <footer>
              <button className="secondary" onClick={() => setDetailBatch(null)}>Đóng</button>
              {detailBatch.status === 'ReceivedAtWarehouse' && (
                <button
                  className="primary"
                  disabled={sendingBatchId === detailBatch.id}
                  onClick={() => void sendToClassification(detailBatch)}
                >
                  <Send size={16} /> {sendingBatchId === detailBatch.id ? 'Đang gửi...' : 'Gửi đi phân loại'}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}

      {placementBatch && (
        <div
          className="receiving-area-modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && closePlacement()}
        >
          <section className="receiving-area-modal" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>XẾP VỊ TRÍ KHU NHẬN ĐỒ</span>
                <h2>{placementBatch.code}</h2>
                <p>{placementBatch.totalWeight.toFixed(1)} kg · {placementBatch.route}</p>
              </div>
              <button onClick={closePlacement} aria-label="Đóng">
                <X />
              </button>
            </header>
            <div className="receiving-area-placement-grid">
              <label>
                <span>Khu vực *</span>
                <select
                  value={areaName}
                  onChange={(event) => {
                    setAreaName(event.target.value);
                    setGroupId('');
                    setLocationId('');
                  }}
                >
                  <option value="">Chọn Khu nhận đồ</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Dãy *</span>
                <select
                  value={groupId}
                  onChange={(event) => {
                    setGroupId(event.target.value);
                    setLocationId('');
                  }}
                >
                  <option value="">Chọn dãy</option>
                  {groupOptions
                    .filter((group) => group.availableKg >= placementBatch.totalWeight)
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.groupName} · còn {group.availableKg.toFixed(1)} kg
                      </option>
                    ))}
                </select>
              </label>
              <fieldset className="receiving-area-location-picker full" disabled={!groupId}>
                <legend>Vị trí *</legend>
                {!groupId ? (
                  <div className="receiving-area-location-placeholder">
                    Chọn dãy để xem các vị trí có thể chứa lô.
                  </div>
                ) : locationOptions.length > 0 ? (
                  <div className="receiving-area-location-options">
                    {locationOptions.map((location) => {
                      const selected = location.id === locationId;
                      const usedKg = location.capacityKg - location.availableKg;
                      const usagePercent = location.capacityKg > 0
                        ? Math.min(100, Math.max(0, (usedKg / location.capacityKg) * 100))
                        : 0;
                      return (
                        <button
                          key={location.id}
                          type="button"
                          className={`receiving-area-location-option ${selected ? 'selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => setLocationId(location.id)}
                        >
                          <span className="receiving-area-location-option__icon"><MapPin size={18} /></span>
                          <span className="receiving-area-location-option__body">
                            <strong>{location.locationCode}</strong>
                            <small>Đang chứa {usedKg.toFixed(1)}/{location.capacityKg.toFixed(1)} kg</small>
                            <span className="receiving-area-location-option__bar"><i style={{ width: `${usagePercent}%` }} /></span>
                          </span>
                          <span className="receiving-area-location-option__available">Còn {location.availableKg.toFixed(1)} kg</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="receiving-area-location-placeholder warning">
                    Dãy này không còn vị trí đủ sức chứa cho lô.
                  </div>
                )}
              </fieldset>
            </div>
            <footer>
              <button className="secondary" onClick={closePlacement}>Hủy</button>
              <button
                className="primary"
                disabled={busy || !areaName || !groupId || !locationId}
                onClick={() => void submitPlacement()}
              >
                {busy ? 'Đang lưu...' : 'Xác nhận vị trí'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default ReceivingArea;
