import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
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

const localDateValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function GroupedBatches({
  view = "open",
}: {
  view?: "open" | "sent";
}) {
  const [date, setDate] = useState(localDateValue);
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
        classificationService.getGroupedBatches(date),
        view === "open"
          ? classificationService.getClassifiedAreaLayout(date)
          : Promise.resolve(null),
      ]);
      setGroups(batchData);
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
        (x) => x.status === "Open" && x.placedInClassificationAreaAt,
      ),
    [groups],
  );
  const allOpenGroups = useMemo(
    () => groups.filter((x) => x.status === "Open"),
    [groups],
  );
  const sentGroups = useMemo(
    () => groups.filter((x) => x.status !== "Open"),
    [groups],
  );
  const visible = view === "open" ? allOpenGroups : sentGroups;
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
    if (batch.status !== "Open") return;
    setPlacing(batch);
    setPlaceAreaId("");
    setPlaceGroupId("");
  };
  const savePlacement = async () => {
    const locationId = layout?.areas
      .flatMap((area) => area.groups)
      .find((group) => group.id === placeGroupId)
      ?.locations.find((location) => location.status !== "Full")?.id;
    if (!placing || !placeAreaId || !placeGroupId || !locationId) return;
    setSavingPlace(true);
    try {
      await classificationService.placeGroupedBatch(
        placing.id,
        placeAreaId,
        placeGroupId,
        locationId,
        placing.totalWeight,
      );
      toast.success(`Đã xếp ${placing.batchCode} vào khu và dãy đã chọn.`);
      setPlacing(null);
      await loadGroups();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể xếp batch vào dãy.");
    } finally {
      setSavingPlace(false);
    }
  };
  const card = (g: GroupedClassifiedBatch, showHandoff = false) => {
    const sent = g.status !== "Open";
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
            <strong>{g.totalItem}</strong> item · <strong>{g.totalWeight.toFixed(2)}</strong> kg
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
            {view === "open"
              ? "Bước 3 · Khu vực đồ đã phân loại"
              : "Lịch sử bàn giao kho"}
          </span>
          <h1>
            {view === "open"
              ? "Đồ đã phân loại chờ gửi kho"
              : "Classified Batch đã gửi sang kho"}
          </h1>
          <p>
            {view === "open"
              ? "Theo dõi Classified Batch theo từng khu vực và dãy chứa trước khi bàn giao kho."
              : "Theo dõi các batch đã bàn giao sang bộ phận kho."}
          </p>
        </div>
      </header>
      <section className="ops-panel glass">
        <div className="ops-field">
          <label htmlFor="groupDate">Ngày phân loại</label>
          <input
            id="groupDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </section>
      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Số batch nhóm</span>
          <div className="ops-stat-value">
            <Boxes size={18} />
            {visible.length}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng item</span>
          <div className="ops-stat-value">
            <Package size={18} />
            {visible.reduce((n, x) => n + x.totalItem, 0)}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Ngày</span>
          <div className="ops-stat-value">
            <CalendarDays size={18} />
            {new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN")}
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
            {sentGroups.map((batch) => card(batch))}
            {!loading && !sentGroups.length && (
              <div className="ops-empty">
                <Boxes size={36} />
                <h4>Chưa có batch nào đã gửi kho trong ngày này</h4>
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
            <div className="ops-modal-details">
              <div className="ops-field">
                <label>Khu vực</label>
                <select
                  value={placeAreaId}
                  onChange={(e) => {
                    setPlaceAreaId(e.target.value);
                    setPlaceGroupId("");
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
                <label>Dãy</label>
                <select
                  value={placeGroupId}
                  onChange={(e) => setPlaceGroupId(e.target.value)}
                  disabled={!placeAreaId}
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
                  disabled={savingPlace || !placeAreaId || !placeGroupId}
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
