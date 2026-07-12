import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { 
  getBatches, 
  getRequests, 
  getShiftActive, 
  setShiftActive, 
  saveBatches
} from '@/utils/receivingMockDb';
import type { MockBatch, MockRequest } from '@/utils/receivingMockDb';
import {
  getClassificationBatches,
  saveClassificationBatches,
} from '@/utils/classificationMockDb';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [batches, setBatches] = useState<MockBatch[]>([]);
  const [requests, setRequests] = useState<MockRequest[]>([]);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'receiving' | 'completed' | 'transferring'>('receiving');
  const [isTransferringId, setIsTransferringId] = useState<string | null>(null);

  useEffect(() => {
    // Load states from database
    setBatches(getBatches());
    setRequests(getRequests());
    setIsShiftActive(getShiftActive());
  }, []);

  const handleToggleShift = () => {
    const nextState = !isShiftActive;
    setShiftActive(nextState);
    setIsShiftActive(nextState);

    if (nextState) {
      toast.success('Bắt đầu ca làm việc thành công! Trạng thái đơn đã sẵn sàng.');
      // Update UI to reload indicators
      window.dispatchEvent(new Event('storage')); // trigger header update
    } else {
      toast.info('Đã kết thúc ca làm việc.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSendToClassification = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    setIsTransferringId(batchId);

    // Simulate validation & sending to classification
    setTimeout(() => {
      const currentBatches = getBatches();
      const bIndex = currentBatches.findIndex(b => b.id === batchId);
      if (bIndex !== -1) {
        currentBatches[bIndex].status = 'Transferring';
        saveBatches(currentBatches);
        setBatches(currentBatches);

        // Seed classification queue so staff can pick it up
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

        toast.success(`Đã bàn giao lô hàng ${currentBatches[bIndex].code} cho tổ Phân loại thành công!`);
        setActiveTab('transferring');
      }
      setIsTransferringId(null);
    }, 1500);
  };

  // Stats calculation
  const totalWeight = requests
    .filter(r => r.status === 'Received' && r.actualWeight)
    .reduce((sum, r) => sum + (r.actualWeight || 0), 0);

  const processedCount = requests.filter(r => r.status !== 'Pending').length;
  const totalCount = requests.length;

  // Filtered batches based on tab status
  const filteredBatches = batches.filter(batch => {
    if (activeTab === 'receiving') return batch.status === 'Receiving';
    if (activeTab === 'completed') return batch.status === 'Completed';
    return batch.status === 'Transferring';
  });

  // Calculate processed ratio for a batch
  const getBatchProgress = (batchId: string) => {
    const batchRequests = requests.filter(r => r.batchId === batchId);
    if (batchRequests.length === 0) return { processed: 0, total: 0, percentage: 0 };
    const processed = batchRequests.filter(r => r.status !== 'Pending').length;
    const total = batchRequests.length;
    return {
      processed,
      total,
      percentage: Math.round((processed / total) * 100)
    };
  };

  return (
    <div className="receiving-dashboard-page">
      {/* Hero Welcome banner */}
      <div className="dashboard-hero-banner glass">
        <div className="banner-text">
          <span className="banner-subtitle">Chào ngày làm việc mới</span>
          <h1 className="banner-title text-gradient">Bộ phận Tiếp nhận</h1>
          <p className="banner-desc">Thu gom quần áo quyên góp, cập nhật thông tin thực tế và bàn giao lô hàng phân loại.</p>
        </div>
      </div>

      {/* Shift controller & statistics */}
      <div className="dashboard-grid">
        {/* Controller card */}
        <div className="shift-control-card glass">
          <div className="card-header-v2">
            <h3>Trạng thái ca làm</h3>
            <span className={`status-indicator ${isShiftActive ? 'active' : 'inactive'}`}>
              {isShiftActive ? 'Trong ca làm' : 'Đang nghỉ ca'}
            </span>
          </div>

          <p className="control-help-text">
            Bắt đầu ca để kích hoạt các tuyến đường thu nhận và bắt đầu ghi nhận đơn quyên góp thực tế.
          </p>

          <button 
            className={`btn-shift-toggle ${isShiftActive ? 'active' : ''}`}
            onClick={handleToggleShift}
          >
            {isShiftActive ? (
              <>
                <Square size={16} fill="currentColor" /> Kết thúc Ca làm
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" /> Bắt đầu Ca làm
              </>
            )}
          </button>
        </div>

        {/* Statistics board */}
        <div className="stats-board-card glass">
          <h3>Hiệu suất hôm nay</h3>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Tổng khối lượng</span>
              <div className="stat-value-container">
                <Scale size={18} className="stat-icon text-gradient" />
                <span className="stat-value">{totalWeight.toFixed(1)} kg</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Tiến độ đơn</span>
              <div className="stat-value-container">
                <ClipboardList size={18} className="stat-icon text-gradient" />
                <span className="stat-value">{processedCount}/{totalCount} đơn</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Hoàn thành ca</span>
              <div className="stat-value-container">
                <CheckCircle size={18} className="stat-icon text-gradient" />
                <span className="stat-value">
                  {totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batches view */}
      <div className="batches-section">
        <div className="section-header-row">
          <h2>Tuyến Lô Tiếp Nhận</h2>
          <span className="subhead-label">Danh sách theo trạng thái ca làm</span>
        </div>

        {/* Tab filters */}
        <div className="batches-tabs">
          <button 
            className={`tab-btn ${activeTab === 'receiving' ? 'active' : ''}`}
            onClick={() => setActiveTab('receiving')}
          >
            <Truck size={14} />
            Đang thu nhận
            <span className="badge-count">
              {batches.filter(b => b.status === 'Receiving').length}
            </span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={14} />
            Đã gom xong
            <span className="badge-count">
              {batches.filter(b => b.status === 'Completed').length}
            </span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'transferring' ? 'active' : ''}`}
            onClick={() => setActiveTab('transferring')}
          >
            <Layers size={14} />
            Đang chuyển đi
            <span className="badge-count">
              {batches.filter(b => b.status === 'Transferring').length}
            </span>
          </button>
        </div>

        {/* Batches List view */}
        <div className="batches-list">
          {filteredBatches.length === 0 ? (
            <div className="empty-state-card glass text-center">
              <ClipboardList size={36} className="empty-icon text-gradient" />
              <h4>Không có lô tiếp nhận nào</h4>
              <p>Không tìm thấy lô hàng nào ở phân mục này.</p>
            </div>
          ) : (
            filteredBatches.map(batch => {
              const progress = getBatchProgress(batch.id);
              const isCompleted = batch.status === 'Completed';
              const isReceiving = batch.status === 'Receiving';

              return (
                <div 
                  key={batch.id} 
                  className={`batch-card glass card-hover ${!isShiftActive && isReceiving ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!isShiftActive && isReceiving) {
                      toast.warning('Vui lòng Bắt đầu ca làm trước khi xem chi tiết.');
                      return;
                    }
                    navigate(`/receiving/batch/${batch.id}`);
                  }}
                >
                  <div className="batch-card-header">
                    <div className="batch-meta">
                      <span className="batch-code">{batch.code}</span>
                      <span className="batch-date">
                        <Calendar size={12} /> {batch.date}
                      </span>
                    </div>
                    <span className={`badge-status ${batch.status.toLowerCase()}`}>
                      {batch.status === 'Receiving' ? 'Đang đi gom' : batch.status === 'Completed' ? 'Đã gom xong' : 'Bàn giao phân loại'}
                    </span>
                  </div>

                  <h3 className="batch-route">{batch.route}</h3>

                  <div className="batch-progress-container">
                    <div className="progress-labels">
                      <span>Tiến độ thu gom</span>
                      <strong>{progress.processed}/{progress.total} đơn</strong>
                    </div>
                    <div className="progress-bar-track">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="batch-card-footer">
                    {isCompleted ? (
                      <button 
                        className={`btn-send-classification ${isTransferringId === batch.id ? 'loading' : ''}`}
                        onClick={(e) => handleSendToClassification(batch.id, e)}
                        disabled={isTransferringId !== null}
                      >
                        {isTransferringId === batch.id ? (
                          <>
                            <span className="spinner-small"></span> Đang chuyển giao...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> Gửi đi phân loại <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="footer-action-prompt">
                        <span>Chi tiết lô hàng</span>
                        <ArrowRight size={14} className="arrow-slide" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
