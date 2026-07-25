import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Phone,
  User,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  ClipboardList,
  Users,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingBatch, ReceivingRequest } from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './Dashboard.css';
import RouteMap from './RouteMap';

type StatusFilter = 'all' | 'pending' | 'received' | 'rescheduled' | 'canceled';

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [batch, setBatch] = useState<ReceivingBatch | null>(null);
  const [requests, setRequests] = useState<ReceivingRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (!batch) return null;

  const totalCount = requests.length;
  const processedCount = requests.filter((r) => r.status !== 'Pending').length;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const filteredRequests = requests.filter((req) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      req.donorName.toLowerCase().includes(q) ||
      req.phoneNumber.includes(searchTerm) ||
      req.code.toLowerCase().includes(q) ||
      req.pickupAddress.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || req.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRequests = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  const batchBadge =
    batch.status === 'Receiving' ? 'pending' : batch.status === 'Completed' ? 'stored' : 'classified';
  const batchBadgeText =
    batch.status === 'Receiving'
      ? 'Đang đi gom'
      : batch.status === 'Completed'
      ? 'Đã gom xong'
      : 'Bàn giao phân loại';

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: requests.length },
    { key: 'pending', label: 'Chờ xử lý', count: requests.filter((r) => r.status === 'Pending').length },
    { key: 'received', label: 'Đã thu nhận', count: requests.filter((r) => r.status === 'Received').length },
    {
      key: 'rescheduled',
      label: 'Hẹn lại',
      count: requests.filter((r) => r.status === 'Rescheduled').length,
    },
    { key: 'canceled', label: 'Đã hủy', count: requests.filter((r) => r.status === 'Canceled').length },
  ];

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/receiving')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>{batch.code}</h1>
          <span className={`ops-badge ${batchBadge}`}>{batchBadgeText}</span>
        </div>
      </div>

      <div className="ops-panel glass">
        <span className="ops-panel-label">Tuyến đường thu nhận</span>
        <h2>{batch.route}</h2>
        <div className="ops-card-meta" style={{ marginTop: 6 }}>
          <span>
            <Calendar size={12} strokeWidth={2} /> Ngày gom: {batch.date}
          </span>
        </div>

        <div className="rcv-progress" style={{ margin: '18px 0 0' }}>
          <div className="rcv-progress-labels">
            <span>Tiến độ xử lý đơn</span>
            <strong>
              {processedCount}/{totalCount} đơn · {progressPercent}%
            </strong>
          </div>
          <div className="ops-cap-track">
            <div className="ops-cap-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <section className="ops-panel glass">
        <div className="ops-section-head">
          <div>
            <h2>Bản đồ tuyến thu nhận</h2>
            <span>Xuất phát từ kho và sắp xếp các điểm nhận gần nhất</span>
          </div>
        </div>
        <div className="rcv-team-summary" style={{ marginBottom: 14 }}>
          <Users size={16} />
          <strong>{batch.teamName || 'Receiving team'}</strong>
          <span>{batch.teamMembers.map(member => `${member.fullName} (${member.phoneNumber})`).join(' · ')}</span>
        </div>
        <RouteMap batch={batch} />
      </section>

      <section>
        <div className="ops-section-head">
          <h2>Đơn quyên góp trong lô</h2>
          <span>Tìm kiếm và lọc theo trạng thái xử lý</span>
        </div>

        <div style={{ maxWidth: 420, marginBottom: 'var(--spacing-md)' }}>
          <Input
            placeholder="Tìm tên, SĐT, địa chỉ hoặc mã đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        <div className="ops-tabs" role="tablist">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === f.key}
              className={`ops-tab ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
              <span className="ops-tab-count">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="ops-list">
          {filteredRequests.length === 0 ? (
            <div className="ops-empty">
              <ClipboardList size={36} strokeWidth={1.5} />
              <h4>Không tìm thấy đơn quyên góp nào</h4>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            pagedRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isReceived = req.status === 'Received';
              const isRescheduled = req.status === 'Rescheduled';
              const badge = isPending
                ? 'pending'
                : isReceived
                ? 'stored'
                : isRescheduled
                ? 'classified'
                : 'canceled';
              const badgeText = isPending
                ? 'Chờ xử lý'
                : isReceived
                ? 'Đã thu gom'
                : isRescheduled
                ? 'Đã hẹn lại'
                : 'Đã hủy';

              return (
                <article
                  key={req.id}
                  className={`ops-card ${isPending ? '' : 'rcv-card-disabled'}`}
                  role={isPending ? 'button' : undefined}
                  tabIndex={isPending ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isPending) {
                      if (batch.shiftStatus !== 'InProgress') {
                        toast.warning('Bạn phải bắt đầu ca làm trước khi xử lý yêu cầu quyên góp.');
                        return;
                      }
                      navigate(`/receiving/request/${req.id}`);
                    }
                  }}
                  onClick={() => {
                    if (isPending) {
                      if (batch.shiftStatus !== 'InProgress') {
                        toast.warning('Bạn phải bắt đầu ca làm trước khi xử lý yêu cầu quyên góp.');
                        return;
                      }
                      navigate(`/receiving/request/${req.id}`);
                    }
                  }}
                  style={isPending ? undefined : { cursor: 'default' }}
                >
                  <div className="ops-card-top">
                    <div className="ops-card-code">{req.code}</div>
                    <span className={`ops-badge ${badge}`}>{badgeText}</span>
                  </div>

                  <div className="rcv-donor-lines">
                    <span>
                      <User size={12} strokeWidth={2} /> {req.donorName}
                    </span>
                    <span>
                      <Phone size={12} strokeWidth={2} /> {req.phoneNumber}
                    </span>
                    <span>
                      <MapPin size={12} strokeWidth={2} /> {req.pickupAddress}
                    </span>
                  </div>

                  <div className="rcv-material-row">
                    <span className="rcv-material-label">Đăng ký ban đầu</span>
                    <span className="rcv-material-tag">
                      {req.category} · {req.weight}
                    </span>
                  </div>

                  {isReceived && req.actualWeight && (
                    <div className="rcv-material-row">
                      <span className="rcv-material-label">Thực nhận</span>
                      <span className="rcv-material-tag on">
                        {req.actualCategory} · <strong>{req.actualWeight} kg</strong>
                      </span>
                    </div>
                  )}

                  <div className="ops-card-footer">
                    {isPending ? (
                      <>
                        <span>Nhấn để cập nhật số liệu</span>
                        <span className="ops-card-action">
                          Xử lý <ArrowRight size={14} strokeWidth={2} />
                        </span>
                      </>
                    ) : isReceived ? (
                      <span className="ops-card-action" style={{ color: 'var(--color-primary)' }}>
                        <CheckCircle size={14} strokeWidth={2} /> Đã tiếp nhận
                      </span>
                    ) : isRescheduled ? (
                      <span className="ops-card-action" style={{ color: 'var(--color-warning)' }}>
                        <Calendar size={14} strokeWidth={2} /> Đã dời lịch
                      </span>
                    ) : (
                      <span className="ops-card-action" style={{ color: 'var(--color-danger)' }}>
                        <XCircle size={14} strokeWidth={2} /> Đã hủy đơn
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {filteredRequests.length > pageSize && (
          <nav className="rcv-pagination" aria-label="Phân trang đơn quyên góp">
            <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))}>
              <ChevronLeft size={15} /> Trước
            </button>
            <div className="rcv-page-numbers">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button key={page} type="button" className={page === safePage ? 'active' : ''}
                  aria-current={page === safePage ? 'page' : undefined} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
            </div>
            <span>Trang {safePage}/{totalPages} · {filteredRequests.length} đơn</span>
            <button type="button" disabled={safePage === totalPages}
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}>
              Sau <ChevronRight size={15} />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
};

export default BatchDetail;
