import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  MapPin,
  Package,
  Play,
  Scale,
  Square,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import {
  classificationService,
  type ClassificationBatchSummary,
  type ClassificationAreaLayout,
  type GroupedClassifiedBatch,
} from "@/services/classificationService";
import "@/styles/ops-shared.css";
import "@/pages/warehouse/WarehouseAreas.css";
import { getClassifiedBatchGroupLabel } from '@/utils/classifiedBatch';
import { getStatusLabel } from "@/utils/statusLabels";

const PENDING_STATUSES = new Set([
  "PendingConfirmation",
  "AssignedToClassification",
  "AwaitingClassificationCount",
  "ReadyForClassification",
  "Classifying",
]);
const CLASSIFIED_STATUSES = new Set(["Classified", "InClassifiedArea"]);
const isFullyClassified = (batch: ClassificationBatchSummary) =>
  batch.countedItemCount != null &&
  batch.classifiedItems >= batch.countedItemCount;
const localDateValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function ClassificationDashboard() {
  const [batches, setBatches] = useState<ClassificationBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamBusy, setTeamBusy] = useState(false);
  const [areaLayout, setAreaLayout] = useState<ClassificationAreaLayout | null>(
    null,
  );
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaLoadFailed, setAreaLoadFailed] = useState(false);
  const [placing, setPlacing] = useState<GroupedClassifiedBatch | null>(null);
  const [placeAreaId, setPlaceAreaId] = useState("");
  const [placeGroupId, setPlaceGroupId] = useState("");
  const [placeLocationId, setPlaceLocationId] = useState("");
  const [actualWeightKg, setActualWeightKg] = useState("");
  const [savingPlace, setSavingPlace] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab");
  const toast = useToast();
  const load = () => {
    setLoading(true);
    classificationService
      .getBatches()
      .then(setBatches)
      .catch(() => toast.error("Không tải được danh sách lô hàng."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [toast]);
  useEffect(() => {
    const refreshFromApi = () => {
      classificationService
        .getBatches()
        .then(setBatches)
        .catch(() => undefined);
    };
    window.addEventListener("focus", refreshFromApi);
    return () => window.removeEventListener("focus", refreshFromApi);
  }, []);
  useEffect(() => {
    if (selectedTab !== "classified") {
      setAreaLayout(null);
      setAreaLoading(false);
      setAreaLoadFailed(false);
      return;
    }
    let active = true;
    setAreaLayout(null);
    setAreaLoading(true);
    setAreaLoadFailed(false);
    classificationService
      .getClassifiedAreaLayout()
      .then((data) => {
        if (active) setAreaLayout(data);
      })
      .catch(() => {
        if (active) setAreaLoadFailed(true);
        toast.error("Không tải được sơ đồ khu vực đồ đã phân loại.");
      })
      .finally(() => {
        if (active) setAreaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTab, toast]);
  const today = localDateValue();
  const todayBatches = batches.filter(
    (batch) => batch.teamShiftDate?.slice(0, 10) === today,
  );
  const currentTeam =
    todayBatches.find((batch) => batch.teamStatus === "InProgress") ??
    todayBatches.find((batch) => batch.teamStatus === "Scheduled") ??
    todayBatches[0];
  const changeTeamStatus = async (complete = false) => {
    if (!currentTeam?.classificationTeamId) return;
    setTeamBusy(true);
    try {
      if (complete)
        await classificationService.completeTeam(
          currentTeam.classificationTeamId,
        );
      else
        await classificationService.startTeam(currentTeam.classificationTeamId);
      toast.success(
        complete ? "Đã kết thúc ca phân loại." : "Đã bắt đầu ca phân loại.",
      );
      load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật ca phân loại.",
      );
    } finally {
      setTeamBusy(false);
    }
  };
  const visibleBatches = batches.filter((batch) => {
    if (selectedTab === "classified")
      return CLASSIFIED_STATUSES.has(batch.status);
    if (selectedTab === "pending")
      return PENDING_STATUSES.has(batch.status) && !isFullyClassified(batch);
    return true;
  });
  const classifiedBatchesWaitingForStorage = areaLayout?.unassignedBatches ?? [];
  const displayedBatchCount =
    selectedTab === "classified"
      ? classifiedBatchesWaitingForStorage.length
      : visibleBatches.length;
  const displayedInProgressCount =
    selectedTab === "classified"
      ? classifiedBatchesWaitingForStorage.length
      : visibleBatches.filter((batch) => batch.status === "Classifying" && !isFullyClassified(batch)).length;
  const displayedTotalWeight =
    selectedTab === "classified"
      ? classifiedBatchesWaitingForStorage.reduce((sum, batch) => sum + batch.totalWeight, 0)
      : visibleBatches.reduce((sum, batch) => sum + batch.totalWeight, 0);
  const open = async (b: ClassificationBatchSummary) => {
    try {
      if (CLASSIFIED_STATUSES.has(b.status)) {
        navigate(`/classification/batches/${b.id}`);
        return;
      }
      if (b.teamStatus !== "InProgress") {
        toast.warning(
          "Vui lòng bắt đầu đúng ca phân loại của lô hàng này trước khi xử lý.",
        );
        return;
      }
      if (
        b.status === "AssignedToClassification" ||
        b.status === "PendingConfirmation" ||
        b.status === "AwaitingClassificationCount"
      ) {
        navigate(`/classification/confirm/${b.id}`);
        return;
      }
      if (b.status === "ReadyForClassification")
        await classificationService.startBatch(b.id);
      navigate(`/classification/classify/${b.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể bắt đầu phân loại.");
    }
  };
  const openPlacement = (batch: GroupedClassifiedBatch) => {
    setPlacing(batch);
    setPlaceAreaId("");
    setPlaceGroupId("");
    setPlaceLocationId("");
    setActualWeightKg(batch.totalWeight > 0 ? String(batch.totalWeight) : "");
  };
  const savePlacement = async () => {
    const confirmedWeight = Number(actualWeightKg);
    if (
      !placing ||
      !placeAreaId ||
      !placeGroupId ||
      !placeLocationId ||
      !Number.isFinite(confirmedWeight) ||
      confirmedWeight <= 0
    )
      return;
    setSavingPlace(true);
    try {
      await classificationService.placeGroupedBatch(
        placing.id,
        placeAreaId,
        placeGroupId,
        placeLocationId,
        confirmedWeight,
      );
      toast.success(`Đã nhập ${placing.batchCode} vào kho đồ đã phân loại.`);
      setPlacing(null);
      const data = await classificationService.getClassifiedAreaLayout();
      setAreaLayout(data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể nhập batch vào kho đồ đã phân loại.",
      );
    } finally {
      setSavingPlace(false);
    }
  };
  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Bộ phận Phân loại</span>
          <h1>Phân loại từng vật phẩm</h1>
          <p>
            Chọn lô hàng được chuyển từ bộ phận tiếp nhận và đánh giá từng món
            theo tiêu chí A, B, C.
          </p>
        </div>
      </header>
      {currentTeam && (
        <section className="ops-panel glass" style={{ marginBottom: 20 }}>
          <div className="ops-section-head">
            <div>
              <h2>{currentTeam.classificationTeamName || "Team phân loại"}</h2>
              <span>
                Trạng thái ca:{" "}
                {getStatusLabel(currentTeam.teamStatus || "Scheduled")}
              </span>
            </div>
            {currentTeam.teamStatus === "Scheduled" ? (
              <button
                className="btn btn-primary"
                disabled={teamBusy}
                onClick={() => changeTeamStatus()}
              >
                <Play size={16} /> Bắt đầu ca phân loại
              </button>
            ) : currentTeam.teamStatus === "InProgress" ? (
              <button
                className="btn btn-danger"
                disabled={teamBusy}
                onClick={() => changeTeamStatus(true)}
              >
                <Square size={16} /> Kết thúc ca
              </button>
            ) : null}
          </div>
        </section>
      )}
      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Lô hàng</span>
          <div className="ops-stat-value">
            <Package size={18} />
            {displayedBatchCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">
            {selectedTab === "classified" ? "Chờ nhập kho" : "Đang phân loại"}
          </span>
          <div className="ops-stat-value">
            <ClipboardList size={18} />
            {displayedInProgressCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng khối lượng</span>
          <div className="ops-stat-value">
            <Scale size={18} />
            {displayedTotalWeight.toFixed(1)} kg
          </div>
        </div>
      </div>
      <section>
        <div className="ops-section-head">
          <h2>
            {selectedTab === "classified"
              ? "Danh sách lô hàng đã phân loại"
              : selectedTab === "pending"
                ? "Danh sách lô hàng chờ phân loại"
                : "Danh sách lô hàng"}
          </h2>
          <span>{loading || areaLoading ? "Đang tải..." : "Chọn một lô để bắt đầu"}</span>
        </div>
        {selectedTab === "classified" && (areaLoading || !areaLayout) ? (
          <div className="ops-empty">
            <ClipboardList size={36} />
            <h4>
              {areaLoadFailed
                ? "Không tải được danh sách batch đã phân loại"
                : "Đang tải danh sách batch đã phân loại..."}
            </h4>
          </div>
        ) : selectedTab === "classified" && areaLayout ? (
          <div className="ops-list classification-putaway-list">
            {areaLayout.unassignedBatches.map((batch) => (
              <article
                key={batch.id}
                className="ops-card classification-putaway-card"
              >
                <div className="ops-card-top">
                  <div className="ops-card-code">{batch.batchCode}</div>
                  <span
                    className={`ops-badge ${batch.conditionGrade === "A" ? "done" : batch.conditionGrade === "B" ? "pending" : "classified"}`}
                  >
                    Nhãn {batch.conditionGrade}
                  </span>
                </div>
                <h3>{getClassifiedBatchGroupLabel(batch)}</h3>
                <div className="ops-card-meta">
                  <span>{batch.totalWeight.toFixed(2)} kg</span>
                </div>
                <div className="ops-card-footer classification-putaway-actions">
                  <button
                    className="ops-btn ops-btn-secondary"
                    onClick={() =>
                      navigate(`/classification/classified-groups/${batch.id}`)
                    }
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="ops-btn ops-btn-primary"
                    onClick={() => openPlacement(batch)}
                  >
                    <MapPin size={15} /> Nhập vào kho đồ đã phân loại
                  </button>
                </div>
              </article>
            ))}
            {!areaLayout.unassignedBatches.length && (
              <div className="ops-empty">
                <ClipboardList size={36} />
                <h4>Không có batch chờ nhập kho đồ đã phân loại</h4>
                <p>
                  Các batch đã nhập vị trí sẽ xuất hiện tại “Khu vực đồ đã phân
                  loại”.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="ops-list">
            {visibleBatches.map((b) => (
              <article
                key={b.id}
                className="ops-card"
                role="button"
                tabIndex={0}
                onClick={() => open(b)}
              >
                <div className="ops-card-top">
                  <div>
                    <div className="ops-card-code">{b.batchCode}</div>
                    <div className="ops-card-meta">
                      <span>
                        {new Date(b.intakeDate).toLocaleDateString("vi-VN")}
                      </span>
                      <span>{b.totalWeight} kg</span>
                    </div>
                  </div>
                  <span
                    className={`ops-badge ${isFullyClassified(b) ? "done" : b.status.toLowerCase()}`}
                  >
                    {isFullyClassified(b)
                      ? "Đã phân loại xong"
                      : getStatusLabel(b.status)}
                  </span>
                </div>
                <h3>{b.routeName || "Tuyến tiếp nhận"}</h3>
                <div className="ops-card-footer">
                  <span>
                    Đã phân loại: <strong>{b.classifiedItems}</strong> món ·{" "}
                    {b.donationRequests} đơn
                  </span>
                  <span className="ops-card-action">
                    {CLASSIFIED_STATUSES.has(b.status)
                      ? "Xem chi tiết"
                      : "Mở lô"}{" "}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </article>
            ))}
            {!loading && visibleBatches.length === 0 && (
              <div className="ops-empty">
                <ClipboardList size={36} />
                <h4>
                  {selectedTab === "classified"
                    ? "Chưa có lô hàng đã phân loại"
                    : "Chưa có lô hàng"}
                </h4>
                <p>
                  {selectedTab === "classified"
                    ? "Các lô hoàn tất phân loại sẽ xuất hiện tại đây."
                    : "Batch được gửi sang phân loại sẽ xuất hiện tại đây."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
      {placing && areaLayout && (
        <div
          className="ops-modal-overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            !savingPlace &&
            setPlacing(null)
          }
        >
          <section className="ops-modal" role="dialog" aria-modal="true">
            <div className="ops-modal-header">
              <div>
                <span className="ops-pagehead-kicker">
                  NHẬP KHO ĐỒ ĐÃ PHÂN LOẠI
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
              <div className="classification-placement-summary">
                <div><span>Phân loại</span><strong>Nhãn {placing.conditionGrade} · {getStatusLabel(placing.status)}</strong></div>
                <div><span>Nhóm phân loại</span><strong>{getClassifiedBatchGroupLabel(placing)}</strong></div>
                <div><span>Số lượng</span><strong>{placing.totalItem} item</strong></div>
              </div>
              <div className="ops-field">
                <label>Khối lượng thực tế (kg) <b>*</b></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={actualWeightKg}
                  onChange={(event) => setActualWeightKg(event.target.value)}
                  placeholder="Nhập khối lượng cân thực tế"
                  autoFocus
                />
                <small>Khối lượng này được dùng để cập nhật sức chứa khu vực và vị trí kho.</small>
              </div>
              <div className="ops-field">
                <label>Khu vực</label>
                <select
                  value={placeAreaId}
                  onChange={(event) => {
                    setPlaceAreaId(event.target.value);
                    setPlaceGroupId("");
                    setPlaceLocationId("");
                  }}
                >
                  <option value="">Chọn khu vực</option>
                  {areaLayout.areas.map((area) => (
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
                  onChange={(event) => {
                    setPlaceGroupId(event.target.value);
                    setPlaceLocationId("");
                  }}
                  disabled={!placeAreaId}
                >
                  <option value="">Chọn dãy</option>
                  {areaLayout.areas
                    .find((area) => area.id === placeAreaId)
                    ?.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.groupName} · {group.currentKg.toFixed(1)}/
                        {group.capacityKg.toFixed(1)} kg
                      </option>
                    ))}
                </select>
              </div>
              {placeGroupId && (
                <div className="ops-field">
                  <label>Storage location</label>
                  <div className="warehouse-location-grid classification-location-picker">
                    {areaLayout.areas
                      .flatMap((area) => area.groups)
                      .find((group) => group.id === placeGroupId)
                      ?.locations.map((location) => (
                        <button
                          type="button"
                          key={location.id}
                          className={`warehouse-location ${placeLocationId === location.id ? "selected" : ""}`}
                          onClick={() => setPlaceLocationId(location.id)}
                          disabled={
                            location.status === "Full" ||
                            location.currentWeightKg + (Number(actualWeightKg) || 0) >
                              location.capacityKg
                          }
                        >
                          <div>
                            <b>{location.locationCode}</b>
                            <span>{location.status}</span>
                          </div>
                          <p>
                            Hàng {location.aisleCode} · Kệ {location.rackCode} ·
                            Tầng {location.shelfCode} · Ô {location.binCode}
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
                      ))}
                  </div>
                </div>
              )}
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
                  disabled={
                    savingPlace ||
                    !placeAreaId ||
                    !placeGroupId ||
                    !placeLocationId ||
                    !(Number(actualWeightKg) > 0)
                  }
                >
                  <MapPin size={15} />
                  {savingPlace ? "Đang nhập..." : "Xác nhận nhập kho"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
