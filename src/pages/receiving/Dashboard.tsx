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
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  getBatches,
  getRequests,
  getShiftActive,
  setShiftActive,
  saveBatches,
} from '@/utils/receivingMockDb';
import type { MockBatch, MockRequest } from '@/utils/receivingMockDb';
import {
  getClassificationBatches,
  saveClassificationBatches,
} from '@/utils/classificationMockDb';
import '@/styles/ops-shared.css';
import './Dashboard.css';

type TabKey = 'receiving' | 'completed' | 'transferring';

const isTab = (v: string | null): v is TabKey =>
  v === 'receiving' || v === 'completed' || v === 'transferring';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState<MockBatch[]>([]);
  const [requests, setRequests] = useState<MockRequest[]>([]);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isTransferringId, setIsTransferringId] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isTab(tabParam) ? tabParam : 'receiving';
  const setActiveTab = (t: TabKey) =>
    setSearchParams(t === 'receiving' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    setBatches(getBatches());
    setRequests(getRequests());
    setIsShiftActive(getShiftActive());
  }, []);

  const handleToggleShift = () => {
    const nextState = !isShiftActive;
    setShiftActive(nextState);
    setIsShiftActive(nextState);

    if (nextState) {
      toast.success('Đã bắt đầu ca làm việc. Các tuyến thu nhận sẵn sàng.');
      window.dispatchEvent(new Event('storage'));
    } else {
      toast.info('Đã kết thúc ca làm việc.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSendToClassification = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTransferringId(batchId);

    setTimeout(() => {
      const currentBatches = getBatches();
      const bIndex = currentBatches.findIndex((b) => b.id === batchId);
      if (bIndex !== -1) {
        currentBatches[bIndex].status = 'Transferring';
        saveBatches(currentBatches);
        setBatches(currentBatches);

        const clsBatches = getClassificationBatches();
        const src = currentBatches[bIndex];
        if (!clsBatches.some((b) => b.id === `cls-from-${src.id}`)) {
          const batchRequests = getRequests().filter(
            (r) => r.batchId === src.id && r.status === 'Received'
          );
          const items =
            batchRequests.length > 0
              ? batchRequests.map((r, i) => ({
                  id: `item-from-${r.id}-${i}`,
                  code: r.code,
                  donorName: r.donorName,
                  estimatedWeightKg: r.actualWeight || 5,
                  estimatedCategory: r.actualCategory || r.category || 'Hỗn hợp',
                  status: 'pending' as const,
                }))
              : [
                  {
                    id: `item-from-${src.id}-0`,
                    code: `${src.code}-01`,
                    donorName: 'Kiện tổng hợp',
                    estimatedWeightKg: 10,
                    estimatedCategory: 'Hỗn hợp',
                    status: 'pending' as const,
                  },
                ];
          clsBatches.unshift({
            id: `cls-from-${src.id}`,
            code: src.code,
            sourceRoute: src.route,
            receivedDate: src.date,
            status: 'PendingClassification',
            totalWeightKg:
              batchRequests.reduce((s, r) => s + (r.actualWeight || 0), 0) || 10,
            itemCount: items.length,
            items,
          });
          saveClassificationBatches(clsBatches);
        }

        toast.success(`Đã bàn giao lô ${currentBatches[bIndex].code} cho tổ Phân loại.`);
        setActiveTab('transferring');
      }
      setIsTransferringId(null);
    }, 1500);
  };

  const totalWeight = requests
    .filter((r) => r.status === 'Received' && r.actualWeight)
    .reduce((sum, r) => sum + (r.actualWeight || 0), 0);

  const processedCount = requests.filter((r) => r.status !== 'Pending').length;
  const totalCount = requests.length;
  const completionPct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const filteredBatches = batches.filter((batch) => {
    if (activeTab === 'receiving') return batch.status === 'Receiving';
    if (activeTab === 'completed') return batch.status === 'Completed';
    return batch.status === 'Transferring';
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
            Thu gom quần áo quyên góp theo tuyến, cập nhật số liệu thực tế và bàn giao
            lô hàng cho tổ phân loại.
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
            <span className="ops-stat-icon"><Scale size={18} strokeWidth={2} /></span>
            {totalWeight.toFixed(1)}
          </div>
          <span className="ops-stat-foot">kg đã thực nhận</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tiến độ đơn</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><ClipboardList size={18} strokeWidth={2} /></span>
            {processedCount}/{totalCount}
          </div>
          <span className="ops-stat-foot">đơn đã xử lý</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Hoàn thành ca</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><CheckCircle size={18} strokeWidth={2} /></span>
            {completionPct}%
          </div>
          <span className="ops-stat-foot">trên tổng số đơn</span>
        </div>
      </div>

      <section>
        <div className="ops-section-head">
          <h2>Tuyến lô tiếp nhận</h2>
          <span>Lọc theo trạng thái thu gom</span>
        </div>

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
              {batches.filter((b) => b.status === 'Receiving').length}
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
              {batches.filter((b) => b.status === 'Transferring').length}
            </span>
          </button>
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
              const isReceiving = batch.status === 'Receiving';
              const disabled = !isShiftActive && isReceiving;

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
                      className={`ops-badge ${
                        isReceiving ? 'pending' : isCompleted ? 'classified' : 'stored'
                      }`}
                    >
                      {isReceiving
                        ? 'Đang đi gom'
                        : isCompleted
                        ? 'Đã gom xong'
                        : 'Bàn giao phân loại'}
                    </span>
                  </div>

                  <h3>{batch.route}</h3>

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
                        onClick={(e) => handleSendToClassification(batch.id, e)}
                        disabled={isTransferringId !== null}
                      >
                        {isTransferringId === batch.id ? (
                          <>
                            <span className="ops-spinner" /> Đang chuyển giao...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> Gửi đi phân loại <ArrowRight size={14} />
                          </>
                        )}
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
    </div>
  );
};

export default Dashboard;
