import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Package,
  Play,
  Scale,
  Square,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import {
  classificationService,
  type ClassificationBatchSummary,
} from "@/services/classificationService";
import "@/styles/ops-shared.css";
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
      return PENDING_STATUSES.has(batch.status);
    return true;
  });
  const displayedBatchCount = visibleBatches.length;
  const displayedInProgressCount = selectedTab === "classified"
    ? visibleBatches.length
    : visibleBatches.filter((batch) => batch.status === "Classifying" && !isFullyClassified(batch)).length;
  const displayedTotalWeight = visibleBatches.reduce((sum, batch) => sum + batch.totalWeight, 0);
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
            {selectedTab === "classified" ? "Đã hoàn thành" : "Đang phân loại"}
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
          <span>{loading ? "Đang tải..." : "Chọn một lô để xem chi tiết"}</span>
        </div>
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
                    className={`ops-badge ${CLASSIFIED_STATUSES.has(b.status) ? "done" : isFullyClassified(b) ? "pending" : b.status.toLowerCase()}`}
                  >
                    {CLASSIFIED_STATUSES.has(b.status)
                      ? "Đã phân loại xong"
                      : isFullyClassified(b)
                        ? "Chờ xác nhận hoàn tất"
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
      </section>
    </div>
  );
}
