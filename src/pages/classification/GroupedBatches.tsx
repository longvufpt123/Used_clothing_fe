import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers3,
  MapPin,
  Package,
  Send,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import {
  classificationService,
  type ClassificationAreaLayout,
  type GroupedClassifiedBatch,
} from "@/services/classificationService";
import { getProcessingDirectionLabel } from "@/utils/processingDirection";
import { getClassifiedBatchGroupLabel } from "@/utils/classifiedBatch";
import "@/styles/ops-shared.css";
import "@/pages/warehouse/WarehouseAreas.css";

import { classificationDate, isOpenClassifiedGroup, isPendingWarehouseGroup, isSentWarehouseGroup } from '@/utils/classificationQueues';

export default function GroupedBatches({
  view = "open",
}: {
  view?: "open" | "pending" | "sent";
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') ?? classificationDate();
  const setDate = (value: string) => setSearchParams(current => {
    const next = new URLSearchParams(current);
    next.set('date', value);
    return next;
  }, { replace: true });
  const [groups, setGroups] = useState<GroupedClassifiedBatch[]>([]);
  const [layout, setLayout] = useState<ClassificationAreaLayout | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingBatchId, setSendingBatchId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<GroupedClassifiedBatch | null>(null);
  const [placeAreaId, setPlaceAreaId] = useState("");
  const [placeGroupId, setPlaceGroupId] = useState("");
  const [placeLocationId, setPlaceLocationId] = useState("");
  const placementLock = useRef(false);
  const [savingPlace, setSavingPlace] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();
  const toast = useToast();
  const loadGroups = async () => {
    setLoading(true);
    try {
      const [batchData, layoutData] = await Promise.all([
        classificationService.getGroupedBatches(view === "open" ? undefined : date),
        view === "open"
          ? classificationService.getClassifiedAreaLayout()
          : Promise.resolve(null),
      ]);
      setGroups(batchData);
      window.dispatchEvent(new Event('classification-data-changed'));
      setLayout(layoutData);
      if (layoutData)
        setExpanded((x) =>
          Object.keys(x).length
            ? x
            : Object.fromEntries(
                layoutData.areas.map((a, i) => [a.id, i === 0]),
              ),
        );
    } catch {
      toast.error("Không tải được dữ liệu khu vực phân loại.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadGroups();
  }, [date, view]);
  const openGroups = useMemo(
    () =>
      groups.filter(
        (x) => (x.status === "PlacedInClassifiedArea" || x.status === "Open") && x.placedInClassificationAreaAt,
      ),
    [groups],
  );
  const allOpenGroups = useMemo(
    () => groups.filter(isOpenClassifiedGroup),
    [groups],
  );
  const sentGroups = useMemo(
    () => groups.filter(isSentWarehouseGroup),
    [groups],
  );
  const pendingGroups = useMemo(
    () => groups.filter(isPendingWarehouseGroup),
    [groups],
  );
  const visible = view === "open" ? allOpenGroups : view === "pending" ? pendingGroups : sentGroups;
  const selectedLocation = layout?.areas
    .flatMap((area) => area.groups.flatMap((group) => group.locations))
    .find((location) => location.id === selectedLocationId);
  const selectedLocationBatches =
    layout?.areas
      .flatMap((area) => area.groups.flatMap((group) => group.batches))
      .filter((batch) => batch.storageLocationId === selectedLocationId) || [];
  const sendAll = async () => {
    if (!openGroups.length) return;
    setSending(true);
    try {
      const r = await classificationService.sendGroupedBatchesToWarehouse(
        openGroups.map((x) => x.id),
      );
      toast.success(`Đã gửi ${r.sent} Classified Batch sang kho.`);
      setConfirming(false);
      await loadGroups();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Không thể gửi batch sang kho.",
      );
    } finally {
      setSending(false);
    }
  };
  const sendOne = async (batch: GroupedClassifiedBatch) => {
    setSendingBatchId(batch.id);
    try {
      await classificationService.sendGroupedBatchToWarehouse(batch.id);
      toast.success(`Đã bàn giao ${batch.batchCode} sang kho.`);
      await loadGroups();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Không thể bàn giao batch sang kho.",
      );
    } finally {
      setSendingBatchId(null);
    }
  };
  const openPlacement = (batch: GroupedClassifiedBatch) => {
    if (batch.status !== "ReadyForPlacement" && batch.status !== "Open") return;
    setPlacing(batch);
    setPlaceAreaId("");
    setPlaceGroupId("");
    setPlaceLocationId("");
  };
  const placementArea = layout?.areas.find((area) => area.id === placeAreaId);
  const placementGroup = placementArea?.groups.find((group) => group.id === placeGroupId);
  const placementLocation = placementGroup?.locations.find((location) => location.id === placeLocationId);
  const placementAvailable = placementArea && placementGroup && placementLocation
    ? Math.max(0, Math.min(placementArea.capacityKg - placementArea.currentKg,
        placementGroup.capacityKg - placementGroup.currentKg,
        placementLocation.capacityKg - placementLocation.currentWeightKg)) : 0;
  const canPlace = !!placing && !!placementLocation && placementLocation.status === 'Available'
    && Number.isFinite(placing.totalWeight) && placing.totalWeight > 0 && placing.totalWeight <= placementAvailable;
  const savePlacement = async () => {
    const weight = placing?.totalWeight ?? 0;
    if (!placing || !canPlace || placementLock.current) return;
    placementLock.current = true;
    setSavingPlace(true);
    try {
      await classificationService.placeGroupedBatch(
        placing.id,
        placeAreaId,
        placeGroupId,
        placeLocationId,
        weight,
      );
      toast.success(`Đã xếp ${placing.batchCode} vào vị trí ${placementLocation!.locationCode}.`);
      setPlacing(null);
      await loadGroups();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể xếp batch vào dãy.");
    } finally {
      placementLock.current = false;
      setSavingPlace(false);
    }
  };
  const card = (g: GroupedClassifiedBatch, showHandoff = false) => {
    const sent = g.status === "PendingWarehouseReceipt" || g.status === "WarehouseReceived" || g.status === "Stored";
    const unassigned = !g.placedInClassificationAreaAt;
    return (
      <article
        key={g.id}
        className="ops-card"
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/classification/groups/${g.id}`)}
        onKeyDown={(e) =>
          e.key === "Enter" && navigate(`/classification/groups/${g.id}`)
        }
      >
        <div className="ops-card-top">
          <div className="ops-card-code">{g.batchCode}</div>
          <span
            className={`ops-badge ${sent ? "stored" : g.conditionGrade === "A" ? "done" : g.conditionGrade === "B" ? "pending" : "classified"}`}
          >
            {sent ? (
              <>
                <CheckCircle2 size={13} /> Đã gửi kho
              </>
            ) : (
              `Nhãn ${g.conditionGrade}`
            )}
          </span>
        </div>
        <h3>{getClassifiedBatchGroupLabel(g)}</h3>
        <div className="ops-card-meta">
          <span>{getProcessingDirectionLabel(g.processingDirection)}</span>
        </div>
        <div className="ops-card-footer">
          <span className="classification-batch-measure">
            <strong>{g.totalWeight > 0 ? `${g.totalWeight.toFixed(2)} kg` : 'Chưa cân'}</strong>
          </span>
          {!sent && unassigned ? (
            <button
              type="button"
              className="ops-btn ops-btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                openPlacement(g);
              }}
            >
              <MapPin size={14} /> Xếp khu/dãy
            </button>
          ) : showHandoff && !sent ? (
            <div className="classification-popup-actions">
              <span className="ops-card-action">
                Xem chi tiết <ArrowRight size={14} />
              </span>
              <button
                type="button"
                className="ops-btn ops-btn-primary"
                disabled={sendingBatchId === g.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void sendOne(g);
                }}
              >
                <Send size={14} />{" "}
                {sendingBatchId === g.id ? "Đang gửi..." : "Bàn giao sang kho"}
              </button>
            </div>
          ) : (
            <span className="ops-card-action">
              Xem chi tiết <ArrowRight size={14} />
            </span>
          )}
        </div>
      </article>
    );
  };
  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">
            {view === "open" ? "Bước 3 · Khu vực đồ đã phân loại"
              : view === "pending" ? "Bước 4 · Chờ kho tiếp nhận" : "Lịch sử bàn giao kho"}
          </span>
          <h1>
            {view === "open" ? "Đồ đã phân loại chờ gửi kho"
              : view === "pending" ? "Classified Batch chờ kho tiếp nhận" : "Classified Batch đã gửi sang kho"}
          </h1>
          <p>
            {view === "open" ? "Hiển thị tất cả batch đang chờ xếp khu hoặc đang nằm trong khu, bao gồm các ngày trước."
              : view === "pending" ? "Các batch đã bàn giao và đang chờ warehouse staff xác nhận."
              : "Lịch sử các batch đã được kho xác nhận nhập."}
          </p>
        </div>
      </header>
      {view !== "open" && <section className="ops-panel glass">
        <div className="ops-field">
          <label htmlFor="groupDate">Ngày phân loại</label>
          <input
            id="groupDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </section>}
      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Số batch nhóm</span>
          <div className="ops-stat-value">
            <Boxes size={18} />
            {visible.length}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng khối lượng</span>
          <div className="ops-stat-value">
            <Package size={18} />
            {visible.reduce((n, x) => n + x.totalWeight, 0).toFixed(2)} kg
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">{view === "open" ? "Phạm vi" : "Ngày"}</span>
          <div className="ops-stat-value">
            <CalendarDays size={18} />
            {view === "open" ? "Tất cả ngày" : new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN")}
          </div>
        </div>
      </div>
      <section>
        <div className="ops-section-head">
          <div>
            <h2>
              {view === "open"
                ? `Sơ đồ khu vực · ${layout?.warehouseName || ""}`
                : "Danh sách đã gửi kho"}
            </h2>
            <span>{loading ? "Đang tải..." : `${visible.length} batch`}</span>
          </div>
          {view === "open" && (
            <button
              type="button"
              className="ops-btn ops-btn-primary"
              disabled={loading || sending || !openGroups.length}
              onClick={() => setConfirming(true)}
            >
              <Send size={16} />
              Gửi tất cả sang kho ({openGroups.length})
            </button>
          )}
        </div>
        {view === "open" && layout ? (
          <div className="warehouse-area-list classification-area-layout">
            {!!layout.unassignedBatches.length && (
              <section className="ops-panel glass">
                <div className="ops-section-head">
                  <div><h2>Batch chờ xếp khu</h2><span>{layout.unassignedBatches.length} batch đã chốt</span></div>
                </div>
                <div className="ops-list">{layout.unassignedBatches.map((batch) => card(batch))}</div>
              </section>
            )}
            {layout.areas.map((area) => {
              const open = expanded[area.id],
                count = area.groups.reduce((n, g) => n + g.batches.length, 0);
              return (
                <article className="warehouse-area" key={area.id}>
                  <button
                    type="button"
                    className="warehouse-area-head"
                    onClick={() =>
                      setExpanded((x) => ({ ...x, [area.id]: !open }))
                    }
                  >
                    <span className="warehouse-area-icon">
                      <Layers3 />
                    </span>
                    <span className="warehouse-area-title">
                      <b>{area.areaName}</b>
                      <small>
                        {area.description || "Khu vực đồ đã phân loại"}
                      </small>
                    </span>
                    <span className="warehouse-area-cap">
                      <b>{count} batch</b>
                      <small>
                        {area.currentKg.toFixed(1)} /{" "}
                        {area.capacityKg.toFixed(1)} kg
                      </small>
                    </span>
                    {open ? <ChevronDown /> : <ChevronRight />}
                  </button>
                  <div className="warehouse-cap-track">
                    <span
                      style={{
                        width: `${area.capacityKg ? Math.min(100, (area.currentKg / area.capacityKg) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  {open && (
                    <div className="warehouse-area-body classification-area-body">
                      {area.groups.map((aisle) => (
                        <section
                          className="classification-aisle"
                          key={aisle.id}
                        >
                          <div className="classification-aisle-head">
                            <div>
                              <strong>{aisle.groupName}</strong>
                              <small>
                                {aisle.description ||
                                  "Dãy chứa Classified Batch"}
                              </small>
                            </div>
                            <span>
                              {aisle.batches.length} batch ·{" "}
                              {aisle.currentKg.toFixed(1)}/
                              {aisle.capacityKg.toFixed(1)} kg ·{" "}
                              {aisle.locations.length} vị trí
                            </span>
                          </div>
                          <div className="warehouse-location-grid classification-stored-location-grid">
                            {aisle.locations.map((location) => {
                              const storedBatches = aisle.batches.filter(
                                (batch) =>
                                  batch.storageLocationId === location.id,
                              );
                              return (
                                <button
                                  type="button"
                                  className={`warehouse-location ${location.status.toLowerCase()} ${storedBatches.length ? "occupied" : ""}`}
                                  key={location.id}
                                  onClick={() =>
                                    setSelectedLocationId(location.id)
                                  }
                                >
                                  <div>
                                    <b>{location.locationCode}</b>
                                    <span>{storedBatches.length} batch</span>
                                  </div>
                                  <p>
                                    Hàng {location.aisleCode} · Kệ{" "}
                                    {location.rackCode} · Tầng{" "}
                                    {location.shelfCode} · Ô {location.binCode}
                                  </p>
                                  <div className="warehouse-location-meter">
                                    <span
                                      style={{
                                        width: `${location.capacityKg ? Math.min(100, (location.currentWeightKg / location.capacityKg) * 100) : 0}%`,
                                      }}
                                    />
                                  </div>
                                  <small>
                                    {location.currentWeightKg.toFixed(1)}/
                                    {location.capacityKg.toFixed(1)} kg
                                  </small>
                                </button>
                              );
                            })}
                          </div>
                          {!aisle.batches.length && (
                            <div className="classification-aisle-empty">
                              Dãy hiện đang trống
                            </div>
                          )}
                        </section>
                      ))}
                      {!area.groups.length && (
                        <div className="ops-empty">
                          <Boxes size={30} />
                          <p>Manager chưa cấu hình dãy cho khu vực này.</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {!layout.areas.length && (
              <div className="ops-empty">
                <Layers3 size={36} />
                <h4>Chưa có khu đồ đã phân loại</h4>
                <p>Manager cần cấu hình khu vực Classified và các dãy chứa.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="ops-list">
            {visible.map((batch) => card(batch))}
            {!loading && !visible.length && (
              <div className="ops-empty">
                <Boxes size={36} />
                <h4>{view === "pending" ? "Không có batch chờ kho tiếp nhận" : "Chưa có batch nào đã nhập kho trong ngày này"}</h4>
              </div>
            )}
          </div>
        )}
        {selectedLocationId && selectedLocation && (
          <div
            className="ops-modal-overlay"
            onMouseDown={(event) =>
              event.target === event.currentTarget &&
              setSelectedLocationId(null)
            }
          >
            <section
              className="ops-modal classification-location-detail-modal"
              role="dialog"
              aria-modal="true"
            >
              <div className="ops-modal-header">
                <div>
                  <span className="ops-pagehead-kicker">
                    CLASSIFIED BATCH TẠI VỊ TRÍ
                  </span>
                  <h2>{selectedLocation.locationCode}</h2>
                  <p>
                    {selectedLocationBatches.length} batch ·{" "}
                    {selectedLocation.currentWeightKg.toFixed(1)}/
                    {selectedLocation.capacityKg.toFixed(1)} kg
                  </p>
                </div>
                <button
                  className="ops-modal-close"
                  onClick={() => setSelectedLocationId(null)}
                >
                  <X />
                </button>
              </div>
              <div className="ops-list classification-location-modal-batches">
                {selectedLocationBatches.map((batch) => card(batch, true))}
                {!selectedLocationBatches.length && (
                  <div className="ops-empty">
                    <Package size={30} />
                    <h4>Vị trí đang trống</h4>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
      {placing && layout && (
        <div
          className="ops-modal-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !savingPlace && setPlacing(null)
          }
        >
          <section className="ops-modal" role="dialog" aria-modal="true">
            <div className="ops-modal-header">
              <div>
                <span className="ops-pagehead-kicker">
                  XẾP BATCH ĐÃ PHÂN LOẠI
                </span>
                <h2>{placing.batchCode}</h2>
              </div>
              <button
                className="ops-modal-close"
                onClick={() => setPlacing(null)}
                disabled={savingPlace}
              >
                <X />
              </button>
            </div>
            <div className="ops-modal-details" style={{ display: 'grid', gap: 16 }}>
              <div className="ops-field">
                <label htmlFor="group-placement-area">Khu vực</label>
                <select
                  id="group-placement-area"
                  disabled={savingPlace}
                  value={placeAreaId}
                  onChange={(e) => {
                    setPlaceAreaId(e.target.value);
                    setPlaceGroupId("");
                    setPlaceLocationId("");
                  }}
                >
                  <option value="">Chọn khu vực</option>
                  {layout.areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.areaName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ops-field">
                <label htmlFor="group-placement-aisle">Dãy</label>
                <select
                  id="group-placement-aisle"
                  value={placeGroupId}
                  onChange={(e) => { setPlaceGroupId(e.target.value); setPlaceLocationId(''); }}
                  disabled={!placeAreaId || savingPlace}
                >
                  <option value="">Chọn dãy</option>
                  {layout.areas
                    .find((area) => area.id === placeAreaId)
                    ?.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.groupName} · {group.currentKg.toFixed(1)}/
                        {group.capacityKg.toFixed(1)} kg
                      </option>
                    ))}
                </select>
              </div>
              <div className="ops-field">
                <label htmlFor="group-placement-location">Vị trí trong dãy</label>
                <select id="group-placement-location" value={placeLocationId} disabled={!placementGroup || savingPlace}
                  onChange={(e) => setPlaceLocationId(e.target.value)}>
                  <option value="">Chọn vị trí</option>
                  {placementGroup?.locations.map((location) => {
                    const remaining = Math.max(0, location.capacityKg - location.currentWeightKg);
                    const unavailable = location.status !== 'Available';
                    return <option key={location.id} value={location.id} disabled={unavailable || remaining < placing.totalWeight}>
                      {location.locationCode} · còn {remaining} kg{unavailable ? ' · Không khả dụng' : remaining < placing.totalWeight ? ' · Không đủ sức chứa' : ''}
                    </option>;
                  })}
                </select>
                {placementGroup && !placementGroup.locations.length && <small>Dãy này chưa có vị trí lưu trữ.</small>}
                {placementLocation && <small>Sức chứa còn lại của vị trí/dãy/khu: {placementAvailable} kg.</small>}
                {placementLocation && placing.totalWeight > placementAvailable && <small role="alert" style={{ color: 'var(--color-danger)' }}>Không đủ sức chứa cho batch. Vui lòng chọn vị trí hoặc dãy khác.</small>}
              </div>
              <div className="ops-field">
                <div className="ops-kv"><span>Khối lượng đã xác nhận</span><strong>{Number.isFinite(placing.totalWeight) && placing.totalWeight > 0 ? `${placing.totalWeight} kg` : 'Chưa có khối lượng'}</strong></div>
                {!(Number.isFinite(placing.totalWeight) && placing.totalWeight > 0) && <small role="alert">Batch chưa có khối lượng đã xác nhận. Vui lòng kiểm tra lại bước hoàn tất gom nhóm.</small>}
              </div>
              <div className="ops-actions">
                <button
                  className="ops-btn ops-btn-secondary"
                  onClick={() => setPlacing(null)}
                  disabled={savingPlace}
                >
                  Hủy
                </button>
                <button
                  className="ops-btn ops-btn-primary"
                  onClick={() => void savePlacement()}
                  disabled={savingPlace || !canPlace}
                >
                  <MapPin size={15} />
                  {savingPlace ? "Đang xếp..." : "Xác nhận vị trí"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirming}
        title="Gửi tất cả Classified Batch sang kho?"
        message={`Hệ thống sẽ gửi ${openGroups.length} batch sang bộ phận kho.`}
        confirmText={`Gửi ${openGroups.length} batch`}
        cancelText="Hủy"
        tone="info"
        isLoading={sending}
        onConfirm={sendAll}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
