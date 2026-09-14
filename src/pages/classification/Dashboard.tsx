import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Package, Play, Scale, Square } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import {
  classificationService,
  type ClassificationBatchSummary,
  type CurrentClassificationTeam,
} from '@/services/classificationService';
import '@/styles/ops-shared.css';
import './Dashboard.css';
import ResumeBatchDialog from './ResumeBatchDialog';
import { getStatusLabel } from '@/utils/statusLabels';

import {
  PENDING_CLASSIFICATION_STATUSES as PENDING_STATUSES,
  CLASSIFIED_INTAKE_STATUSES as CLASSIFIED_STATUSES,
} from '@/utils/classificationQueues';
const isFullyClassified = (batch: ClassificationBatchSummary) =>
  batch.countedItemCount != null && batch.classifiedItems >= batch.countedItemCount;

const CLASSIFIED_INTAKE = CLASSIFIED_STATUSES;

function BatchCard({
  batch,
  onOpen,
}: {
  batch: ClassificationBatchSummary;
  onOpen: (batch: ClassificationBatchSummary) => void;
}) {
  return (
    <article className="ops-card" role="button" tabIndex={0} onClick={() => onOpen(batch)}>
      {batch.imageUrls && batch.imageUrls.length > 0 && (
        <div className="batch-card-thumb">
          <img src={batch.imageUrls[0]} alt={batch.batchCode} />
          {batch.imageUrls.length > 1 && <span>+{batch.imageUrls.length - 1}</span>}
        </div>
      )}
      <div className="ops-card-top">
        <div>
          <div className="ops-card-code">{batch.batchCode}</div>
          <div className="ops-card-meta">
            <span>{new Date(batch.intakeDate).toLocaleDateString('vi-VN')}</span>
            <span>{batch.totalWeight} kg</span>
          </div>
        </div>
        <span
          className={`ops-badge ${CLASSIFIED_INTAKE.has(batch.status) ? 'done' : isFullyClassified(batch) ? 'pending' : batch.status.toLowerCase()}`}
        >
          {CLASSIFIED_INTAKE.has(batch.status)
            ? 'Đã phân loại xong'
            : isFullyClassified(batch)
              ? 'Chờ xác nhận hoàn tất'
              : getStatusLabel(batch.status)}
        </span>
      </div>
      <h3>{batch.routeName || 'Tuyến tiếp nhận'}</h3>
      {batch.isRecycledReturn && (
        <div className="ops-card-meta recycled-return-meta">
          <span className="ops-badge pending">Tái chế về</span>
          {batch.sourceOperationCode && <span>Mã vận hành: {batch.sourceOperationCode}</span>}
          {batch.sourceOrganizationName && <span>Từ: {batch.sourceOrganizationName}</span>}
        </div>
      )}
      <div className="ops-card-footer">
        <span>
          Đã phân loại: <strong>{batch.classifiedItems}</strong> món · {batch.donationRequests} đơn
        </span>
        <span className="ops-card-action">
          {CLASSIFIED_INTAKE.has(batch.status) ? 'Xem chi tiết' : 'Mở lô'}{' '}
          <ArrowRight size={14} />
        </span>
      </div>
    </article>
  );
}
const hasEndedShift = (batch: ClassificationBatchSummary) => {
  if (!batch.teamShiftDate || !batch.teamShiftEndTime) return batch.teamStatus === 'Completed';
  return (
    Date.now() >=
    new Date(`${batch.teamShiftDate.slice(0, 10)}T${batch.teamShiftEndTime}+07:00`).getTime()
  );
};

export default function ClassificationDashboard() {
  const [batches, setBatches] = useState<ClassificationBatchSummary[]>([]);
  const [teams, setTeams] = useState<CurrentClassificationTeam[]>([]);
  const [resuming, setResuming] = useState<ClassificationBatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamBusy, setTeamBusy] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab');
  const toast = useToast();
  const load = async () => {
    setLoading(true);
    try {
      const [data, currentTeams] = await Promise.all([
        classificationService.getBatches(),
        classificationService.getCurrentTeams(),
      ]);
      setBatches(data);
      setTeams(currentTeams);
      window.dispatchEvent(new Event('classification-data-changed'));
    } catch {
      toast.error('Không tải được danh sách lô và ca phân loại.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [toast]);
  useEffect(() => {
    const refreshFromApi = () => {
      Promise.all([classificationService.getBatches(), classificationService.getCurrentTeams()])
        .then(([data, currentTeams]) => {
          setBatches(data);
          setTeams(currentTeams);
          window.dispatchEvent(new Event('classification-data-changed'));
        })
        .catch(() => undefined);
    };
    window.addEventListener('focus', refreshFromApi);
    return () => window.removeEventListener('focus', refreshFromApi);
  }, []);
  const changeTeamStatus = async (teamId: string, complete = false) => {
    setTeamBusy(true);
    try {
      if (complete) await classificationService.completeTeam(teamId);
      else await classificationService.startTeam(teamId);
      toast.success(complete ? 'Đã kết thúc ca phân loại.' : 'Đã bắt đầu ca phân loại.');
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật ca phân loại.');
    } finally {
      setTeamBusy(false);
    }
  };
  const visibleBatches = batches.filter((batch) => {
    if (selectedTab === 'classified') return CLASSIFIED_STATUSES.has(batch.status);
    if (selectedTab === 'pending') return PENDING_STATUSES.has(batch.status);
    return true;
  });
  // Recycled-return batches (RC-) are displayed in a separate section (feedback 11/09).
  const recycledBatches = visibleBatches.filter((batch) => batch.isRecycledReturn);
  const normalBatches = visibleBatches.filter((batch) => !batch.isRecycledReturn);
  const displayedBatchCount = visibleBatches.length;
  const displayedInProgressCount =
    selectedTab === 'classified'
      ? visibleBatches.length
      : visibleBatches.filter(
          (batch) => batch.status === 'Classifying' && !isFullyClassified(batch),
        ).length;
  const displayedTotalWeight = visibleBatches.reduce((sum, batch) => sum + batch.totalWeight, 0);
  const open = async (b: ClassificationBatchSummary) => {
    try {
      if (CLASSIFIED_STATUSES.has(b.status)) {
        navigate(`/classification/batches/${b.id}`);
        return;
      }
      if (hasEndedShift(b)) {
        setResuming(b);
        return;
      }
      if (b.teamStatus !== 'InProgress') {
        toast.warning('Vui lòng bắt đầu đúng ca phân loại của lô hàng này trước khi xử lý.');
        return;
      }
      if (
        b.status === 'AssignedToClassification' ||
        b.status === 'PendingConfirmation' ||
        b.status === 'AwaitingClassificationCount'
      ) {
        navigate(`/classification/confirm/${b.id}`);
        return;
      }
      if (b.status === 'ReadyForClassification') await classificationService.startBatch(b.id);
      navigate(`/classification/classify/${b.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể bắt đầu phân loại.');
    }
  };
  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Bộ phận Phân loại</span>
          <h1>Phân loại từng vật phẩm</h1>
          <p>
            Chọn lô hàng được chuyển từ bộ phận tiếp nhận và đánh giá từng món theo tiêu chí A, B,
            C.
          </p>
        </div>
      </header>
      {resuming && (
        <ResumeBatchDialog
          batch={resuming}
          teams={teams}
          onClose={() => setResuming(null)}
          onSaved={load}
        />
      )}
      {teams.map((currentTeam) => (
        <section key={currentTeam.id} className="ops-panel glass" style={{ marginBottom: 20 }}>
          <div className="ops-section-head">
            <div>
              <h2>{currentTeam.teamName || 'Team phân loại'}</h2>
              <span>Trạng thái ca: {getStatusLabel(currentTeam.status || 'Scheduled')}</span>
            </div>
            {currentTeam.status === 'Scheduled' ? (
              <button
                className="btn btn-primary"
                disabled={teamBusy}
                onClick={() => changeTeamStatus(currentTeam.id)}
              >
                <Play size={16} /> Bắt đầu ca phân loại
              </button>
            ) : currentTeam.status === 'InProgress' ? (
              <button
                className="btn btn-danger"
                disabled={teamBusy}
                onClick={() => changeTeamStatus(currentTeam.id, true)}
              >
                <Square size={16} /> Kết thúc ca
              </button>
            ) : null}
          </div>
        </section>
      ))}
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
            {selectedTab === 'classified' ? 'Đã hoàn thành' : 'Đang phân loại'}
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
      {recycledBatches.length > 0 && (
        <section className="recycled-return-section">
          <div className="ops-section-head">
            <h2>Đồ tái chế về</h2>
            <span>Lô hàng trả về từ tổ chức tái chế</span>
          </div>
          <div className="ops-list classification-batch-list">
            {recycledBatches.map((b) => (
              <BatchCard key={b.id} batch={b} onOpen={open} />
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="ops-section-head">
          <h2>
            {selectedTab === 'classified'
              ? 'Danh sách lô hàng đã phân loại'
              : selectedTab === 'pending'
                ? 'Danh sách lô hàng chờ phân loại'
                : 'Danh sách lô hàng'}
          </h2>
          <span>{loading ? 'Đang tải...' : 'Chọn một lô để xem chi tiết'}</span>
        </div>
        <div className="ops-list classification-batch-list">
          {normalBatches.map((b) => (
            <BatchCard key={b.id} batch={b} onOpen={open} />
          ))}
          {!loading && visibleBatches.length === 0 && (
            <div className="ops-empty">
              <ClipboardList size={36} />
              <h4>
                {selectedTab === 'classified' ? 'Chưa có lô hàng đã phân loại' : 'Chưa có lô hàng'}
              </h4>
              <p>
                {selectedTab === 'classified'
                  ? 'Các lô hoàn tất phân loại sẽ xuất hiện tại đây.'
                  : 'Batch được gửi sang phân loại sẽ xuất hiện tại đây.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
