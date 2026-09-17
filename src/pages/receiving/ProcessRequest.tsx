import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/common/Modal';
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
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingRequest } from '@/services/receivingService';
import { uploadImages } from '@/utils/uploadImages';
import '@/styles/ops-shared.css';
import './Dashboard.css';
import './ProcessRequest.css';
import DonationChatDialog from '@/components/chat/DonationChatDialog';

type ReceiptImage = {
  file: File;
  previewUrl: string;
};
type ReceiptConfirmation = { weight: number; category: string; condition: string; notes: string; images: ReceiptImage[] };

  const categoryOptions = [
    { value: 'Áo khoác / Đồ ấm mùa đông', label: 'Áo khoác / Đồ ấm mùa đông' },
    { value: 'Áo thun / Áo sơ mi dệt kim', label: 'Áo thun / Áo sơ mi dệt kim' },
    { value: 'Quần denim / Quần dài / kaki', label: 'Quần denim / Quần dài / kaki' },
    { value: 'Quần áo trẻ em', label: 'Quần áo trẻ em' },
    { value: 'Hỗn hợp / Khác', label: 'Hỗn hợp / Khác' },
  ];

  const conditionOptions = [
    { value: 'good', label: 'Tốt (Dành cho Từ thiện)' },
    { value: 'recycle', label: 'Cũ hỏng (Dành cho Tái chế dệt sợi)' },
  ];

export const ProcessRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState<ReceivingRequest | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Form input states
  const [actualWeight, setActualWeight] = useState('');
  const [actualCategory, setActualCategory] = useState('');
  const [actualCondition, setActualCondition] = useState('good');
  const [actualNotes, setActualNotes] = useState('');
  const [receiptImages, setReceiptImages] = useState<ReceiptImage[]>([]);
  const [weightTouched, setWeightTouched] = useState(false);
  const [confirmation, setConfirmation] = useState<ReceiptConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState('');
  const submittingReceipt = useRef(false);
  const uploadedReceiptUrls = useRef<string[] | undefined>(undefined);
  const weightError = actualWeight === '' ? (weightTouched ? 'Vui lòng nhập cân nặng thực tế.' : undefined)
    : Number(actualWeight) <= 0 ? 'Khối lượng phải lớn hơn 0 kg.'
    : Number(actualWeight) > 50 ? 'Mỗi đơn tiếp nhận tối đa 50 kg.'
    : !/^\d+(?:\.\d{1,2})?$/.test(actualWeight) ? 'Nhập khối lượng hợp lệ, tối đa 2 chữ số thập phân.' : undefined;

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
    receivingService
      .findMyRequest(id)
      .then((currentRequest) => {
        if (!currentRequest) throw new Error('Không tìm thấy yêu cầu');
        setRequest(currentRequest);
        setActualCategory(categoryOptions.some(option => option.value === currentRequest.category) ? currentRequest.category : 'Hỗn hợp / Khác');
      })
      .catch(() => {
        toast.error('Đơn quyên góp không tồn tại.');
        navigate('/receiving');
      });
  }, [id, navigate]);

  if (!request) return null;

  const handleSelectImages = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = 3 - receiptImages.length;
    if (remainingSlots <= 0) {
      toast.warning('Tối đa đính kèm 3 hình ảnh minh họa thực nhận.');
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    const acceptedFiles = imageFiles.slice(0, remainingSlots);
    if (acceptedFiles.length === 0) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ.');
      return;
    }
    if (imageFiles.length > remainingSlots) {
      toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa.`);
    }

    setReceiptImages((current) => [
      ...current,
      ...acceptedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setReceiptImages((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, idx) => idx !== index);
    });
  };

  const handleConfirmReceived = (e: React.FormEvent) => {
    e.preventDefault();
    setWeightTouched(true);
    if (!actualWeight || weightError || submittingReceipt.current) return;
    uploadedReceiptUrls.current = undefined;
    setConfirmationError('');
    setConfirmation({ weight: Number(actualWeight), category: actualCategory, condition: actualCondition, notes: actualNotes.trim(), images: [...receiptImages] });
  };

  const submitReceipt = async () => {
    if (!confirmation || submittingReceipt.current) return;
    submittingReceipt.current = true;
    setIsSubmitting(true);
    setConfirmationError('');
    try {
      const imageUrls = confirmation.images.length
        ? uploadedReceiptUrls.current ?? await uploadImages(confirmation.images.map(image => image.file), `receiving-confirmations/${request.id}`)
        : request.imageUrls;
      uploadedReceiptUrls.current = imageUrls;
      await receivingService.confirmPickup(request.batchId, request.id, {
        actualWeight: confirmation.weight,
        notes: `[${confirmation.category} - ${confirmation.condition}] ${confirmation.notes}`,
        imageUrls,
      });
      setConfirmation(null);
      receiptImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
      setReceiptImages([]);
      setSubmittedStatus('Received');
      setIsSubmitted(true);
      toast.success('Tiếp nhận đơn quyên góp thành công!');
      // Receipt is already saved: a refresh failure must not invite a duplicate submission.
      const refreshedBatch = await receivingService.getMyBatch(request.batchId).catch(() => null);
      if (refreshedBatch?.status === 'Completed') navigate('/receiving?tab=completed', { replace: true });
    } catch (error: any) {
      setConfirmationError(error?.response?.data?.message || 'Không thể xác nhận thu nhận. Vui lòng thử lại.');
    } finally {
      submittingReceipt.current = false;
      setIsSubmitting(false);
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
      await receivingService.reschedule(
        request.batchId,
        request.id,
        `${rescheduleDate}T${rescheduleTime}:00`,
        formattedNote,
      );
      setSubmittedStatus('Rescheduled');
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.info('Đã cập nhật dời lịch thu nhận đơn!');
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error?.response?.data?.message || 'Không thể hẹn lại lịch thu gom.');
    }
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
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error?.response?.data?.message || 'Không thể từ chối đơn quyên góp.');
    }
  };

  return (
    <div className="ops-page">
      {confirmation && createPortal(<Modal isOpen title="Xác nhận thông tin thu nhận"
        className="receipt-confirmation-modal"
        onClose={() => { if (!submittingReceipt.current) setConfirmation(null); }}
        footer={<>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => setConfirmation(null)}>Quay lại chỉnh sửa</Button>
          <Button type="button" isLoading={isSubmitting} onClick={submitReceipt}>Xác nhận thu nhận</Button>
        </>}>
        <p>Vui lòng kiểm tra thông tin trước khi xác nhận tiếp nhận đơn.</p>
        <dl className="receipt-confirmation-details">
          <dt>Mã đơn</dt><dd>{request.code}</dd>
          <dt>Người quyên góp</dt><dd>{request.donorName}</dd>
          <dt>Số điện thoại</dt><dd>{request.phoneNumber}</dd>
          <dt>Địa chỉ lấy hàng</dt><dd>{request.pickupAddress}</dd>
          <dt>Cân nặng thực tế</dt><dd><strong>{confirmation.weight} kg</strong></dd>
          <dt>Chất liệu chính</dt><dd>{confirmation.category}</dd>
          <dt>Chất lượng phân bổ</dt><dd>{conditionOptions.find(option => option.value === confirmation.condition)?.label}</dd>
          <dt>Ghi chú tiếp nhận</dt><dd>{confirmation.notes || 'Không có'}</dd>
        </dl>
        {confirmation.images.length > 0 && <div className="receipt-confirmation-images">
          {confirmation.images.map((image, index) => <img key={image.previewUrl} src={image.previewUrl} alt={`Ảnh thực nhận ${index + 1}`} />)}
        </div>}
        {confirmationError && <p className="receipt-confirmation-error" role="alert">{confirmationError}</p>}
      </Modal>, document.body)}
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
            <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setShowChat(true)}>
              <MessageCircle size={16} /> Chat với donor
            </button>
          </div>
        </div>
      )}
      {showChat && <DonationChatDialog requestId={request.id} requestCode={request.code}
        participantLabel={request.donorName} onClose={() => setShowChat(false)} />}

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
          <form className="ops-panel glass" onSubmit={handleConfirmReceived} noValidate>
            <span className="ops-panel-label">Cập nhật số liệu thực tế</span>
            <h2 style={{ marginBottom: 16 }}>Biên nhận thực tế</h2>

            <div className="ops-form-grid">
              <Input
                label="Cân nặng thực tế (kg)"
                type="text"
                inputMode="decimal"
                required
                placeholder="Nhập số cân nặng thực đo được..."
                value={actualWeight}
                error={weightError}
                helperText="Tối đa 50 kg mỗi đơn, có thể nhập số lẻ."
                onBlur={() => setWeightTouched(true)}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '.');
                  if (/^\d*(?:\.\d{0,2})?$/.test(value)) setActualWeight(value);
                  else e.currentTarget.value = actualWeight;
                }}
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
                <label>Ảnh chụp thực nhận ({receiptImages.length}/3)</label>
                <div className="rcv-upload-flex">
                  {receiptImages.map((image, idx) => (
                    <div key={image.previewUrl} className="rcv-upload-preview">
                      <img src={image.previewUrl} alt={`Kiện hàng ${idx + 1}`} />
                      <button
                        type="button"
                        className="rcv-upload-del"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {receiptImages.length < 3 && (
                    <label className={`rcv-upload-add ${isSubmitting ? 'disabled' : ''}`}>
                      <Camera size={20} />
                      <span>Chụp ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        disabled={isSubmitting}
                        onChange={(event) => {
                          handleSelectImages(event.target.files);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="ops-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="ops-btn-block"
              >
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
            Dữ liệu đơn hàng {request.code} đã được cập nhật thành công lên hệ thống ReThreads.
          </p>

          <div
            className="ops-kv-grid"
            style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}
          >
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
                  <strong>
                    {actualCondition === 'good' ? 'Ủng hộ từ thiện' : 'Tái chế dệt sợi'}
                  </strong>
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
