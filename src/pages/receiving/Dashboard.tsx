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
import { receivingService } from '@/services/receivingService';
import type { ReceivingBatch, ReceivingRequest } from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './Dashboard.css';

type TabKey = 'receiving' | 'completed' | 'transferring';

const setShiftActive = (active: boolean) =>
  localStorage.setItem('receiving_shift_active', String(active));

const isTab = (v: string | null): v is TabKey =>
  v === 'receiving' || v === 'completed' || v === 'transferring';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState<ReceivingBatch[]>([]);
  const [requests, setRequests] = useState<ReceivingRequest[]>([]);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isTransferringId, setIsTransferringId] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isTab(tabParam) ? tabParam : 'receiving';
  const setActiveTab = (t: TabKey) =>
    setSearchParams(t === 'receiving' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    receivingService.getMyBatches().then((data) => {
      setBatches(data);
      setRequests(data.flatMap((batch) => batch.requests));
      const active = data.some((batch) => batch.shiftStatus === 'InProgress');
      setIsShiftActive(active);
      setShiftActive(active);
      window.dispatchEvent(new Event('storage'));
    }).catch(() => toast.error('Không thể tải tuyến thu gom được phân công.'));
  }, []);

  const handleToggleShift = async () => {
    const nextState = !isShiftActive;
    setShiftActive(nextState);
    setIsShiftActive(nextState);

    if (nextState) {
      await Promise.all(
        batches.filter((batch) => batch.shiftStatus === 'Scheduled' && (batch.status === 'Planned' || batch.status === 'Receiving'))
          .map((batch) => receivingService.startBatch(batch.id))
      );
      setBatches((current) => current.map((batch) =>
        batch.status === 'Planned' ? { ...batch, status: 'Receiving', shiftStatus: 'InProgress' } : batch
      ));
      toast.success('Bắt đầu ca làm việc thành công! Trạng thái đơn đã sẵn sàng.');
      // Update UI to reload indicators
      window.dispatchEvent(new Event('storage')); // trigger header update
    } else {
      const shiftIds = [...new Set(
        batches.filter((batch) => batch.shiftStatus === 'InProgress').map((batch) => batch.shiftId)
      )];
      await Promise.all(shiftIds.map((shiftId) => receivingService.completeShift(shiftId)));
      setBatches((current) => current.map((batch) =>
        shiftIds.includes(batch.shiftId) ? { ...batch, status: 'Completed', shiftStatus: 'Completed' } : batch
      ));
      toast.info('Đã kết thúc ca làm việc.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSendToClassification = async (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTransferringId(batchId);
    try {
      await receivingService.sendToClassification(batchId);
      const data = await receivingService.getMyBatches();
      setBatches(data);
      setRequests(data.flatMap((batch) => batch.requests));
      toast.success('Đã gửi Intake Batch sang bộ phận Phân loại.');
      setActiveTab('transferring');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi Intake Batch.');
    } finally {
      setIsTransferringId(null);
    }
  };

  const totalWeight = requests
    .filter((r) => r.status === 'Received' && r.actualWeight)
    .reduce((sum, r) => sum + (r.actualWeight || 0), 0);

  const processedCount = requests.filter((r) => r.status !== 'Pending').length;
  const totalCount = requests.length;
  const completionPct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const filteredBatches = batches.filter((batch) => {
    if (activeTab === 'receiving') return batch.status === 'Receiving' || batch.status === 'Planned';
    if (activeTab === 'completed') return batch.status === 'Completed';
    return batch.status === 'SentToClassification';
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
              {batches.filter((b) => b.status === 'SentToClassification').length}
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
              const isReceiving = batch.status === 'Receiving' || batch.status === 'Planned';
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
