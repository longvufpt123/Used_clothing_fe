import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Phone,
  MapPin,
  Scale,
  Camera,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingRequest } from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './Dashboard.css';

export const ProcessRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState<ReceivingRequest | null>(null);

  // Form input states
  const [actualWeight, setActualWeight] = useState('');
  const [actualCategory, setActualCategory] = useState('');
  const [actualCondition, setActualCondition] = useState('good');
  const [actualNotes, setActualNotes] = useState('');
  const [mockImages, setMockImages] = useState<string[]>([]);

  // Reschedule overlay states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');

  // Cancel overlay states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<ReceivingRequest['status'] | null>(null);

  useEffect(() => {
    if (!id) return;
    receivingService.findMyRequest(id).then((currentRequest) => {
      if (!currentRequest) throw new Error('Request not found');
      setRequest(currentRequest);
      setActualCategory(currentRequest.category);
    }).catch(() => {
      toast.error('Đơn quyên góp không tồn tại.');
      navigate('/receiving');
    });
  }, [id, navigate, toast]);

  if (!request) return null;

  const categoryOptions = [
    { value: 'Áo khoác / Đồ ấm mùa đông', label: 'Áo khoác / Đồ ấm mùa đông' },
    { value: 'Áo thun / Áo sơ mi dệt kim', label: 'Áo thun / Áo sơ mi dệt kim' },
    { value: 'Quần jeans / Quần dài / Kaki', label: 'Quần jeans / Quần dài / Kaki' },
    { value: 'Quần áo trẻ em', label: 'Quần áo trẻ em' },
    { value: 'Hỗn hợp / Khác', label: 'Hỗn hợp / Khác' },
  ];

  const conditionOptions = [
    { value: 'good', label: 'Tốt (Dành cho Từ thiện)' },
    { value: 'recycle', label: 'Cũ hỏng (Dành cho Tái chế dệt sợi)' },
  ];

  const handleAddMockImage = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=80',
    ];
    if (mockImages.length >= 3) {
      toast.warning('Tối đa đính kèm 3 hình ảnh minh họa thực nhận.');
      return;
    }
    setMockImages([...mockImages, mockPhotos[mockImages.length]]);
    toast.success('Đã chụp và lưu ảnh kiện hàng.');
  };

  const handleRemoveImage = (index: number) => {
    setMockImages(mockImages.filter((_, idx) => idx !== index));
  };

  // 1. Success Collection Submission
  const handleConfirmReceived = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualWeight || parseFloat(actualWeight) <= 0) {
      toast.error('Vui lòng nhập cân nặng thực tế hợp lệ (lớn hơn 0).');
      return;
    }
    setIsSubmitting(true);
    try {
      await receivingService.confirmPickup(request.batchId, request.id, {
        actualWeight: parseFloat(actualWeight),
        notes: `[${actualCategory} - ${actualCondition}] ${actualNotes}`,
        imageUrls: mockImages.length > 0 ? mockImages : request.imageUrls,
      });
      setSubmittedStatus('Received');
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.success('Tiếp nhận đơn quyên góp thành công!');
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error?.response?.data?.message || 'Không thể xác nhận thu nhận.');
    }
  };

  // 2. Reschedule Action
  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast.error('Vui lòng chọn ngày hẹn lại.');
      return;
    }
    setIsSubmitting(true);
    setShowRescheduleModal(false);
    try {
      const formattedNote = `[Hẹn lại lịch vào ngày ${rescheduleDate} lúc ${rescheduleTime}] ${actualNotes}`;
      await receivingService.reschedule(request.batchId, request.id, `${rescheduleDate}T${rescheduleTime}:00`, formattedNote);
      setSubmittedStatus('Rescheduled');
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.info('Đã cập nhật dời lịch thu nhận đơn!');
    } catch (error: any) { setIsSubmitting(false); toast.error(error?.response?.data?.message || 'Không thể hẹn lại lịch thu gom.'); }
  };

  // 3. Cancel Action
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn quyên góp.');
      return;
    }
    setIsSubmitting(true);
    setShowCancelModal(false);
    try {
      const formattedNote = `[Hủy đơn. Lý do: ${cancelReason}] ${actualNotes}`;
      await receivingService.reject(request.batchId, request.id, formattedNote);
      setSubmittedStatus('Canceled');
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.warning('Đã xác nhận hủy đơn quyên góp.');
    } catch (error: any) { setIsSubmitting(false); toast.error(error?.response?.data?.message || 'Không thể từ chối đơn quyên góp.'); }
  };

  return (
    <div className="ops-page">
      {!isSubmitted && (
        <div className="ops-nav">
          <button
            type="button"
            className="ops-back"
            onClick={() => navigate(`/receiving/batch/${request.batchId}`)}
          >
            <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại lô {request.batchId.toUpperCase()}
          </button>
          <div className="ops-title-row">
            <h1>Xử lý đơn {request.code}</h1>
            <span className="ops-badge pending">Chờ xử lý</span>
          </div>
        </div>
      )}

      {!isSubmitted ? (
        <div className="ops-form-grid two-col">
          {/* Left: donor profile */}
          <div className="ops-panel glass">
            <span className="ops-panel-label">Thông tin người quyên góp</span>
            <h2 style={{ marginBottom: 12 }}>{request.donorName}</h2>

            <div className="rcv-donor-lines">
              <span>
                <Phone size={12} strokeWidth={2} /> {request.phoneNumber}
              </span>
              <span>
                <MapPin size={12} strokeWidth={2} /> {request.pickupAddress}
              </span>
            </div>

            <span className="ops-panel-label" style={{ marginTop: 20 }}>
              Khai báo đăng ký ban đầu
            </span>
            <div className="ops-kv-grid">
              <div className="ops-kv">
                <span>Phân mục</span>
                <strong>{request.category}</strong>
              </div>
              <div className="ops-kv">
                <span>Cân nặng ước tính</span>
                <strong>{request.weight}</strong>
              </div>
              <div className="ops-kv">
                <span>Tình trạng</span>
                <strong>{request.condition}</strong>
              </div>
            </div>
          </div>

          {/* Right: receipt form */}
          <form className="ops-panel glass" onSubmit={handleConfirmReceived}>
            <span className="ops-panel-label">Cập nhật số liệu thực tế</span>
            <h2 style={{ marginBottom: 16 }}>Biên nhận thực tế</h2>

            <div className="ops-form-grid">
              <Input
                label="Cân nặng thực tế (kg)"
                type="number"
                step="0.1"
                required
                placeholder="Nhập số cân nặng thực đo được..."
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                icon={<Scale size={16} />}
              />

              <Select
                label="Phân loại chất liệu chính thực tế"
                required
                value={actualCategory}
                onChange={(e) => setActualCategory(e.target.value)}
                options={categoryOptions}
              />

              <Select
                label="Chất lượng phân bổ"
                required
                value={actualCondition}
                onChange={(e) => setActualCondition(e.target.value)}
                options={conditionOptions}
              />

              <div className="ops-field">
                <label>Ghi chú tiếp nhận</label>
                <textarea
                  placeholder="Nhập ghi chú thêm về kiện hàng (ví dụ: quần áo đã sạch sẽ, đóng bao cẩn thận...)"
                  value={actualNotes}
                  onChange={(e) => setActualNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="ops-field">
                <label>Ảnh chụp thực nhận ({mockImages.length}/3)</label>
                <div className="rcv-upload-flex">
                  {mockImages.map((img, idx) => (
                    <div key={idx} className="rcv-upload-preview">
                      <img src={img} alt="Kiện hàng" />
                      <button type="button" className="rcv-upload-del" onClick={() => handleRemoveImage(idx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {mockImages.length < 3 && (
                    <button type="button" className="rcv-upload-add" onClick={handleAddMockImage}>
                      <Camera size={20} />
                      <span>Chụp ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="ops-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="ops-btn-block">
                <CheckCircle size={16} /> Thu nhận thành công
              </Button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={isSubmitting}
                >
                  <Calendar size={14} /> Hẹn lịch lại
                </button>
                <button
                  type="button"
                  className="ops-btn ops-btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => setShowCancelModal(true)}
                  disabled={isSubmitting}
                >
                  <XCircle size={14} /> Hủy đơn
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* SUCCESS SUMMARY */
        <div className="ops-panel glass rcv-summary">
          <div className={`rcv-summary-icon ${submittedStatus?.toLowerCase()}`}>
            {submittedStatus === 'Received' ? (
              <CheckCircle size={44} />
            ) : submittedStatus === 'Rescheduled' ? (
              <Calendar size={44} />
            ) : (
              <XCircle size={44} />
            )}
          </div>

          <h2>
            {submittedStatus === 'Received'
              ? 'Tiếp nhận thành công!'
              : submittedStatus === 'Rescheduled'
              ? 'Đã hẹn lại lịch thu gom'
              : 'Đã hủy đơn quyên góp'}
          </h2>
          <p className="rcv-summary-msg">
            Dữ liệu đơn hàng {request.code} đã được cập nhật thành công lên hệ thống GreenThread.
          </p>

          <div className="ops-kv-grid" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
            <div className="ops-kv">
              <span>Đơn quyên góp</span>
              <strong>{request.code}</strong>
            </div>
            <div className="ops-kv">
              <span>Người gửi</span>
              <strong>{request.donorName}</strong>
            </div>

            {submittedStatus === 'Received' && (
              <>
                <div className="ops-kv">
                  <span>Cân nặng thực tế</span>
                  <strong>{actualWeight} kg</strong>
                </div>
                <div className="ops-kv">
                  <span>Chất liệu chính</span>
                  <strong>{actualCategory}</strong>
                </div>
                <div className="ops-kv">
                  <span>Hướng phân bổ</span>
                  <strong>{actualCondition === 'good' ? 'Ủng hộ từ thiện' : 'Tái chế dệt sợi'}</strong>
                </div>
              </>
            )}
            {submittedStatus === 'Rescheduled' && (
              <div className="ops-kv">
                <span>Hẹn ngày lấy lại</span>
                <strong>
                  {rescheduleDate} ({rescheduleTime})
                </strong>
              </div>
            )}
            {submittedStatus === 'Canceled' && (
              <div className="ops-kv">
                <span>Lý do hủy đơn</span>
                <strong>{cancelReason}</strong>
              </div>
            )}
          </div>

          <div className="ops-actions" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="ops-btn ops-btn-primary"
              onClick={() => navigate(`/receiving/batch/${request.batchId}`)}
            >
              Quay lại Lô thu gom <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="rcv-modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="ops-panel glass rcv-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Chọn lịch hẹn mới</h2>
            <p className="rcv-summary-msg" style={{ textAlign: 'left', margin: '6px 0 16px' }}>
              Chọn ngày giờ thích hợp hẹn thu nhận lại kiện hàng với người dân.
            </p>
            <div className="ops-form-grid two-col">
              <Input
                label="Ngày hẹn lại"
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                icon={<Calendar size={14} />}
              />
              <Input
                label="Giờ hẹn lại"
                type="time"
                required
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                icon={<Clock size={14} />}
              />
            </div>
            <div className="ops-actions">
              <button
                type="button"
                className="ops-btn ops-btn-secondary"
                onClick={() => setShowRescheduleModal(false)}
              >
                Hủy bỏ
              </button>
              <button type="button" className="ops-btn ops-btn-primary" onClick={handleReschedule}>
                Lưu ngày giờ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="rcv-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="ops-panel glass rcv-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Hủy đơn quyên góp này</h2>
            <p className="rcv-summary-msg" style={{ textAlign: 'left', margin: '6px 0 16px' }}>
              Vui lòng ghi rõ lý do hủy đơn thu gom để báo cáo lại cho tổ điều phối.
            </p>
            <div className="ops-field">
              <textarea
                placeholder="Nhập lý do hủy (ví dụ: địa chỉ không đúng, liên lạc quá 3 lần không được...)"
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="ops-actions">
              <button
                type="button"
                className="ops-btn ops-btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Quay lại
              </button>
              <button type="button" className="ops-btn ops-btn-danger" onClick={handleCancel}>
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRequest;
