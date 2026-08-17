import { useEffect, useState } from 'react';
import { ArrowRight, Boxes, ChevronDown, ChevronRight, ClipboardList, Layers3, Package, Play, Scale, Square } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import {
  classificationService,
  type ClassificationBatchSummary,
  type ClassificationAreaLayout,
} from '@/services/classificationService';
import '@/styles/ops-shared.css';
import '@/pages/warehouse/WarehouseAreas.css';
import { getStatusLabel } from '@/utils/statusLabels';

const PENDING_STATUSES = new Set([
  'PendingConfirmation',
  'AssignedToClassification',
  'AwaitingClassificationCount',
  'ReadyForClassification',
  'Classifying',
]);
const CLASSIFIED_STATUSES = new Set(['Classified', 'InClassifiedArea']);

export default function ClassificationDashboard() {
  const [batches, setBatches] = useState<ClassificationBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamBusy, setTeamBusy] = useState(false);
  const [areaLayout, setAreaLayout] = useState<ClassificationAreaLayout | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab');
  const toast = useToast();
  const load = () => {
    setLoading(true);
    classificationService
      .getBatches()
      .then(setBatches)
      .catch(() => toast.error('Không tải được danh sách lô hàng.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [toast]);
  useEffect(() => {
    if (selectedTab !== 'classified') return;
    classificationService.getClassifiedAreaLayout().then((data) => {
      setAreaLayout(data);
      setExpandedAreas(Object.fromEntries(data.areas.map((area, index) => [area.id, index === 0])));
    }).catch(() => toast.error('Không tải được sơ đồ khu vực đồ đã phân loại.'));
  }, [selectedTab, toast]);
  const currentTeam = batches.find((batch) => batch.teamStatus === 'InProgress') ?? batches[0];
  const changeTeamStatus = async (complete = false) => {
    if (!currentTeam?.classificationTeamId) return;
    setTeamBusy(true);
    try {
      if (complete) await classificationService.completeTeam(currentTeam.classificationTeamId);
      else await classificationService.startTeam(currentTeam.classificationTeamId);
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
  const open = async (b: ClassificationBatchSummary) => {
    try {
      if (CLASSIFIED_STATUSES.has(b.status)) {
        navigate(`/classification/batches/${b.id}`);
        return;
      }
      if (b.status === 'AssignedToClassification' || b.status === 'PendingConfirmation' || b.status === 'AwaitingClassificationCount') {
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
            Chọn lô hàng được chuyển từ bộ phận tiếp nhận và đánh giá từng món theo tiêu chí A,
            B, C.
          </p>
        </div>
      </header>
      {currentTeam && (
        <section className="ops-panel glass" style={{ marginBottom: 20 }}>
          <div className="ops-section-head">
            <div>
              <h2>{currentTeam.classificationTeamName || 'Team phân loại'}</h2>
              <span>Trạng thái ca: {getStatusLabel(currentTeam.teamStatus || 'Scheduled')}</span>
            </div>
            {currentTeam.teamStatus === 'Scheduled' ? (
              <button className="btn btn-primary" disabled={teamBusy} onClick={() => changeTeamStatus()}>
                <Play size={16} /> Bắt đầu ca phân loại
              </button>
            ) : currentTeam.teamStatus === 'InProgress' ? (
              <button className="btn btn-danger" disabled={teamBusy} onClick={() => changeTeamStatus(true)}>
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
            {visibleBatches.length}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Đang phân loại</span>
          <div className="ops-stat-value">
            <ClipboardList size={18} />
            {visibleBatches.filter((x) => x.status === 'Classifying').length}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng khối lượng</span>
          <div className="ops-stat-value">
            <Scale size={18} />
            {visibleBatches.reduce((s, x) => s + x.totalWeight, 0).toFixed(1)} kg
          </div>
        </div>
      </div>
      <section>
        <div className="ops-section-head">
          <h2>
            {selectedTab === 'classified'
              ? 'Danh sách lô hàng đã phân loại'
              : selectedTab === 'pending'
                ? 'Danh sách lô hàng chờ phân loại'
                : 'Danh sách lô hàng'}
          </h2>
          <span>{loading ? 'Đang tải...' : 'Chọn một lô để bắt đầu'}</span>
        </div>
        {selectedTab === 'classified' && areaLayout ? (
          <div className="warehouse-area-list classification-area-layout">
            {areaLayout.areas.map((area) => {
              const expanded = expandedAreas[area.id];
              const totalBatches = area.groups.reduce((sum, group) => sum + group.batches.length, 0);
              return <article className="warehouse-area" key={area.id}>
                <button type="button" className="warehouse-area-head" onClick={() => setExpandedAreas((x) => ({ ...x, [area.id]: !expanded }))}>
                  <span className="warehouse-area-icon"><Layers3 /></span>
                  <span className="warehouse-area-title"><b>{area.areaName}</b><small>{area.description || 'Khu vực đồ đã phân loại'}</small></span>
                  <span className="warehouse-area-cap"><b>{totalBatches} batch</b><small>{area.currentKg.toFixed(1)} / {area.capacityKg.toFixed(1)} kg</small></span>
                  {expanded ? <ChevronDown /> : <ChevronRight />}
                </button>
                <div className="warehouse-cap-track"><span style={{ width: `${area.capacityKg ? Math.min(100, area.currentKg / area.capacityKg * 100) : 0}%` }} /></div>
                {expanded && <div className="warehouse-area-body classification-area-body">
                  {area.groups.map((group) => <section className="classification-aisle" key={group.id}>
                    <div className="classification-aisle-head"><div><strong>{group.groupName}</strong><small>{group.description || 'Dãy chứa đồ đã phân loại'}</small></div><span>{group.batches.length} batch · {group.currentKg.toFixed(1)}/{group.capacityKg.toFixed(1)} kg · {group.locations.length} vị trí</span></div>
                    <div className="warehouse-location-grid">{group.locations.map((location) => <div className={`warehouse-location ${location.status.toLowerCase()}`} key={location.id}>
                      <div><b>{location.locationCode}</b><span>{location.status}</span></div>
                      <p>Hàng {location.aisleCode} · Kệ {location.rackCode} · Tầng {location.shelfCode} · Ô {location.binCode}</p>
                      <div className="warehouse-location-meter"><span style={{ width: `${location.capacityKg ? Math.min(100, location.currentWeightKg / location.capacityKg * 100) : 0}%` }} /></div>
                      <small>{location.currentWeightKg.toFixed(1)}/{location.capacityKg.toFixed(1)} kg</small>
                    </div>)}</div>
                    <div className="ops-list">{group.batches.map((batch) => <article key={batch.id} className="ops-card" role="button" tabIndex={0} onClick={() => navigate(`/classification/groups/${batch.id}`)}>
                      <div className="ops-card-top"><div className="ops-card-code">{batch.batchCode}</div><span className={`ops-badge ${batch.conditionGrade === 'A' ? 'done' : batch.conditionGrade === 'B' ? 'pending' : 'classified'}`}>Nhãn {batch.conditionGrade}</span></div>
                      <h3>{batch.clothingType} · {batch.fabricType}</h3><div className="ops-card-meta"><span>{batch.gender}</span><span>{batch.targetUser}</span><span>Size {batch.size}</span></div>
                      <div className="ops-card-footer"><span><strong>{batch.totalItem}</strong> item</span><span className="ops-card-action">Xem chi tiết <ArrowRight size={14} /></span></div>
                    </article>)}{!group.batches.length && <div className="classification-aisle-empty">Dãy hiện đang trống</div>}</div>
                  </section>)}
                </div>}
              </article>;
            })}
            {!!areaLayout.unassignedBatches.length && <article className="classification-unassigned"><h3>Chưa xác định dãy</h3><p>{areaLayout.unassignedBatches.length} batch cũ chưa có vị trí.</p></article>}
            {!areaLayout.areas.length && <div className="ops-empty"><Boxes size={36} /><h4>Chưa cấu hình khu vực và dãy phân loại</h4></div>}
          </div>
        ) : <div className="ops-list">
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
                    <span>{new Date(b.intakeDate).toLocaleDateString('vi-VN')}</span>
                    <span>{b.totalWeight} kg</span>
                  </div>
                </div>
                <span className={`ops-badge ${b.status.toLowerCase()}`}>
                  {getStatusLabel(b.status)}
                </span>
              </div>
              <h3>{b.routeName || 'Tuyến tiếp nhận'}</h3>
              <div className="ops-card-footer">
                <span>
                  Đã phân loại: <strong>{b.classifiedItems}</strong> món · {b.donationRequests} đơn
                </span>
                <span className="ops-card-action">
                  {CLASSIFIED_STATUSES.has(b.status) ? 'Xem chi tiết' : 'Mở lô'}{' '}
                  <ArrowRight size={14} />
                </span>
              </div>
            </article>
          ))}
          {!loading && visibleBatches.length === 0 && (
            <div className="ops-empty">
              <ClipboardList size={36} />
              <h4>
                {selectedTab === 'classified'
                  ? 'Chưa có lô hàng đã phân loại'
                  : 'Chưa có lô hàng'}
              </h4>
              <p>
                {selectedTab === 'classified'
                  ? 'Các lô hoàn tất phân loại sẽ xuất hiện tại đây.'
                  : 'Batch được gửi sang phân loại sẽ xuất hiện tại đây.'}
              </p>
            </div>
          )}
        </div>}
      </section>
    </div>
  );
}
