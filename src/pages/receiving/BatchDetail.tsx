import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingBatch, ReceivingRequest } from '@/services/receivingService';
import './BatchDetail.css';

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [batch, setBatch] = useState<ReceivingBatch | null>(null);
  const [requests, setRequests] = useState<ReceivingRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'rescheduled' | 'canceled'>('all');

  useEffect(() => {
    if (!id) return;
    receivingService.getMyBatch(id).then((currentBatch) => {
      setBatch(currentBatch);
      setRequests(currentBatch.requests);
    }).catch(() => {
      toast.error('Lô hàng không tồn tại.');
      navigate('/receiving');
    });
  }, [id, navigate, toast]);

  if (!batch) return null;

  // Statistics calculation for the batch
  const totalCount = requests.length;
  const processedCount = requests.filter(r => r.status !== 'Pending').length;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  // Filter requests by search term & status
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phoneNumber.includes(searchTerm) ||
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      req.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="batch-detail-page">
      {/* Back button & title header */}
      <div className="page-nav-header">
        <button className="btn-back-nav" onClick={() => navigate('/receiving')}>
          <ChevronLeft size={16} /> Quay lại
        </button>
        <div className="batch-title-info">
          <h1>{batch.code}</h1>
          <span className={`badge-status ${batch.status.toLowerCase()}`}>
            {batch.status === 'Receiving' ? 'Đang đi gom' : batch.status === 'Completed' ? 'Đã gom xong' : 'Bàn giao phân loại'}
          </span>
        </div>
      </div>

      {/* Route Info overview card */}
      <div className="batch-info-card glass">
        <div className="info-main">
          <span className="info-label">Tuyến đường thu nhận</span>
          <h2 className="info-route">{batch.route}</h2>
          <div className="info-meta">
            <span><Calendar size={12} /> Ngày gom: {batch.date}</span>
          </div>
        </div>

        <div className="info-progress">
          <div className="progress-radial-container">
            <svg className="radial-progress-svg" viewBox="0 0 36 36">
              <path
                className="radial-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="radial-bar"
                strokeDasharray={`${progressPercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="radial-progress-text">
              <strong>{progressPercent}%</strong>
              <span>Hoàn thành</span>
            </div>
          </div>
          <div className="progress-details">
            <span>Đã xử lý: <strong>{processedCount}/{totalCount} đơn</strong></span>
          </div>
        </div>
      </div>

      {/* Main List Management */}
      <div className="requests-section">
        <div className="search-filter-wrapper">
          {/* Search Box */}
          <div className="search-box-container">
            <Input
              placeholder="Tìm tên, SĐT, địa chỉ hoặc mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          {/* Status filter list */}
          <div className="filter-pill-row">
            <button 
              className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Tất cả ({requests.length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Chờ xử lý ({requests.filter(r => r.status === 'Pending').length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'received' ? 'active' : ''}`}
              onClick={() => setStatusFilter('received')}
            >
              Đã thu nhận ({requests.filter(r => r.status === 'Received').length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'rescheduled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('rescheduled')}
            >
              Hẹn lại ({requests.filter(r => r.status === 'Rescheduled').length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'canceled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('canceled')}
            >
              Đã hủy ({requests.filter(r => r.status === 'Canceled').length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="empty-state-card glass text-center">
              <AlertCircle size={36} className="empty-icon text-gradient" />
              <h4>Không tìm thấy đơn quyên góp nào</h4>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status === 'Pending';
              const isReceived = req.status === 'Received';
              const isRescheduled = req.status === 'Rescheduled';
              const isCanceled = req.status === 'Canceled';

              return (
                <div 
                  key={req.id} 
                  className={`request-item-card glass ${isPending ? 'pending' : ''}`}
                  onClick={() => {
                    if (isPending && batch.shiftStatus !== 'InProgress') {
                      toast.warning('Bạn phải bắt đầu ca làm trước khi xử lý donation request.');
                      return;
                    }
                    if (isPending) {
                      navigate(`/receiving/request/${req.id}`);
                    }
                  }}
                >
                  <div className="req-card-left">
                    <div className="req-card-header-row">
                      <span className="req-code">{req.code}</span>
                      <span className={`status-badge-inline ${req.status.toLowerCase()}`}>
                        {req.status === 'Pending' ? 'Chờ xử lý' : req.status === 'Received' ? 'Đã thu gom' : req.status === 'Rescheduled' ? 'Đã hẹn lại' : 'Đã hủy'}
                      </span>
                    </div>

                    <div className="donor-profile-details">
                      <div className="detail-line font-bold">
                        <User size={12} /> {req.donorName}
                      </div>
                      <div className="detail-line">
                        <Phone size={12} /> {req.phoneNumber}
                      </div>
                      <div className="detail-line address-line">
                        <MapPin size={12} /> {req.pickupAddress}
                      </div>
                    </div>

                    <div className="req-materials-info">
                      <span className="material-label">Đăng ký ban đầu:</span>
                      <span className="material-tag">{req.category} · {req.weight}</span>
                    </div>

                    {isReceived && req.actualWeight && (
                      <div className="req-actual-record">
                        <span className="record-label">Thực nhận:</span>
                        <span className="record-value">{req.actualCategory} · <strong>{req.actualWeight} kg</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="req-card-right">
                    {isPending && (
                      <button className="btn-process-action">
                        Xử lý <ArrowRight size={14} />
                      </button>
                    )}
                    {isReceived && (
                      <div className="status-badge-large text-success" title="Đã tiếp nhận thành công">
                        <CheckCircle size={24} fill="var(--color-primary-light)" />
                      </div>
                    )}
                    {isRescheduled && (
                      <div className="status-badge-large text-warning" title="Đã dời lịch thu nhận">
                        <Calendar size={24} />
                      </div>
                    )}
                    {isCanceled && (
                      <div className="status-badge-large text-danger" title="Đã hủy đơn">
                        <XCircle size={24} />
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

export default BatchDetail;
