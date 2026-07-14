import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  MapPin, 
  Scale, 
  Camera, 
  Calendar, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingRequest } from '@/services/receivingService';
import './ProcessRequest.css';

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
    // Add mock photos simulating camera captures
    const mockPhotos = [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=80'
    ];
    
    if (mockImages.length >= 3) {
      toast.warning('Tối đa đính kèm 3 hình ảnh minh họa thực nhận.');
      return;
    }

    const nextPhoto = mockPhotos[mockImages.length];
    setMockImages([...mockImages, nextPhoto]);
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
        imageUrls: mockImages.length > 0 ? mockImages : request.imageUrls
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
    <div className="process-request-page">
      {/* Back navigation */}
      {!isSubmitted && (
        <button 
          className="btn-back-nav" 
          onClick={() => navigate(`/receiving/batch/${request.batchId}`)}
        >
          <ChevronLeft size={16} /> Quay lại lô {request.batchId.toUpperCase()}
        </button>
      )}

      {/* Main Container workflow split */}
      {!isSubmitted ? (
        <div className="process-workflow-layout">
          {/* Left panel: Donor specifications */}
          <div className="donor-profile-panel glass">
            <h3>Thông tin người quyên góp</h3>
            <div className="donor-meta-info">
              <div className="meta-card">
                <span className="meta-lbl"><User size={12} /> Người quyên góp</span>
                <strong className="meta-val">{request.donorName}</strong>
              </div>
              <div className="meta-card">
                <span className="meta-lbl"><Phone size={12} /> Số điện thoại</span>
                <strong className="meta-val">{request.phoneNumber}</strong>
              </div>
              <div className="meta-card">
                <span className="meta-lbl"><MapPin size={12} /> Địa chỉ thu nhận</span>
                <span className="meta-val address-val">{request.pickupAddress}</span>
              </div>
            </div>

            <div className="initial-estimation-box">
              <h4>Khai báo đăng ký ban đầu</h4>
              <div className="est-row">
                <div className="est-pill">
                  <span>Phân mục:</span> <strong>{request.category}</strong>
                </div>
                <div className="est-pill">
                  <span>Cân nặng ước tính:</span> <strong>{request.weight}</strong>
                </div>
                <div className="est-pill">
                  <span>Tình trạng:</span> <strong>{request.condition}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Receipt update form */}
          <form className="receipt-form-panel glass" onSubmit={handleConfirmReceived}>
            <h3>Cập nhật số liệu thực tế</h3>

            <div className="form-grid">
              {/* Actual weight */}
              <div className="form-item-input">
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
              </div>

              {/* Actual Category */}
              <div className="form-item-input">
                <Select
                  label="Phân loại chất liệu chính thực tế"
                  required
                  value={actualCategory}
                  onChange={(e) => setActualCategory(e.target.value)}
                  options={categoryOptions}
                />
              </div>

              {/* Actual Condition */}
              <div className="form-item-input">
                <Select
                  label="Chất lượng phân bổ"
                  required
                  value={actualCondition}
                  onChange={(e) => setActualCondition(e.target.value)}
                  options={conditionOptions}
                />
              </div>

              {/* Notes */}
              <div className="form-item-textarea">
                <label className="textarea-label">Ghi chú tiếp nhận</label>
                <textarea
                  className="custom-textarea"
                  placeholder="Nhập ghi chú thêm về kiện hàng (ví dụ: quần áo đã sạch sẽ, đóng bao cẩn thận...)"
                  value={actualNotes}
                  onChange={(e) => setActualNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Photo uploader */}
              <div className="form-item-uploader">
                <label className="uploader-label">Ảnh chụp thực nhận ({mockImages.length}/3)</label>
                <div className="image-upload-flex">
                  {mockImages.map((img, idx) => (
                    <div key={idx} className="uploaded-image-preview">
                      <img src={img} alt="Kiện hàng" />
                      <button 
                        type="button" 
                        className="btn-delete-img"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {mockImages.length < 3 && (
                    <button 
                      type="button" 
                      className="btn-trigger-upload-camera"
                      onClick={handleAddMockImage}
                    >
                      <Camera size={20} />
                      <span>Chụp ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons row */}
            <div className="action-buttons-group">
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting}
                className="btn-action-confirm"
              >
                <CheckCircle size={16} /> Thu nhận thành công
              </Button>
              
              <div className="secondary-actions-row">
                <button 
                  type="button" 
                  className="btn-action-reschedule"
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={isSubmitting}
                >
                  <Calendar size={14} /> Hẹn lịch lại
                </button>
                <button 
                  type="button" 
                  className="btn-action-cancel"
                  onClick={() => setShowCancelModal(true)}
                  disabled={isSubmitting}
                >
                  <XCircle size={14} /> Hủy đơn quyên góp
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* SUCCESS SUMMARY SCREEN */
        <div className="summary-success-view glass">
          <div className="success-icon-wrapper">
            {submittedStatus === 'Received' ? (
              <CheckCircle size={48} className="text-success anim-pop" />
            ) : submittedStatus === 'Rescheduled' ? (
              <Calendar size={48} className="text-warning anim-pop" />
            ) : (
              <XCircle size={48} className="text-danger anim-pop" />
            )}
          </div>

          <h2 className="success-header">
            {submittedStatus === 'Received' ? 'Tiếp nhận thành công!' : submittedStatus === 'Rescheduled' ? 'Đã hẹn lại lịch thu gom' : 'Đã hủy đơn quyên góp'}
          </h2>
          
          <p className="success-message">
            Dữ liệu đơn hàng **{request.code}** đã được cập nhật thành công lên hệ thống GreenThread.
          </p>

          <div className="summary-data-table">
            <div className="summary-row">
              <span>Đơn quyên góp:</span>
              <strong>{request.code}</strong>
            </div>
            <div className="summary-row">
              <span>Người gửi:</span>
              <strong>{request.donorName}</strong>
            </div>

            {submittedStatus === 'Received' && (
              <>
                <div className="summary-row">
                  <span>Cân nặng thực tế:</span>
                  <strong className="text-gradient font-bold">{actualWeight} kg</strong>
                </div>
                <div className="summary-row">
                  <span>Chất liệu chính:</span>
                  <strong>{actualCategory}</strong>
                </div>
                <div className="summary-row">
                  <span>Hướng phân bổ:</span>
                  <strong>{actualCondition === 'good' ? 'Ủng hộ từ thiện' : 'Tái chế dệt sợi'}</strong>
                </div>
              </>
            )}

            {submittedStatus === 'Rescheduled' && (
              <div className="summary-row">
                <span>Hẹn ngày lấy lại:</span>
                <strong>{rescheduleDate} ({rescheduleTime})</strong>
              </div>
            )}

            {submittedStatus === 'Canceled' && (
              <div className="summary-row">
                <span>Lý do hủy đơn:</span>
                <strong className="text-danger">{cancelReason}</strong>
              </div>
            )}
          </div>

          <button 
            className="btn-confirm-return" 
            onClick={() => navigate(`/receiving/batch/${request.batchId}`)}
          >
            Quay lại Lô thu gom <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Reschedule Modal Overlay */}
      {showRescheduleModal && (
        <div className="modal-overlay-custom">
          <div className="modal-content-custom glass anim-slide-up">
            <h3>Chọn lịch hẹn mới</h3>
            <p>Chọn ngày giờ thích hợp hẹn thu nhận lại kiện hàng với người dân.</p>
            
            <div className="modal-inputs-grid">
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

            <div className="modal-actions-row">
              <button className="btn-modal-cancel" onClick={() => setShowRescheduleModal(false)}>
                Hủy bỏ
              </button>
              <button className="btn-modal-confirm success" onClick={handleReschedule}>
                Lưu ngày giờ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal Overlay */}
      {showCancelModal && (
        <div className="modal-overlay-custom">
          <div className="modal-content-custom glass anim-slide-up">
            <h3>Hủy đơn quyên góp này</h3>
            <p>Vui lòng ghi rõ lý do hủy đơn thu gom để báo cáo lại cho tổ điều phối.</p>
            
            <div className="modal-textarea-container">
              <textarea
                className="custom-textarea modal-textarea"
                placeholder="Nhập lý do hủy (ví dụ: địa chỉ không đúng, liên lạc quá 3 lần không được...)"
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <button className="btn-modal-cancel" onClick={() => setShowCancelModal(false)}>
                Quay lại
              </button>
              <button className="btn-modal-confirm danger" onClick={handleCancel}>
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
