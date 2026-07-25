import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Calendar, Check, ChevronLeft, Package, Scale, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { classificationService, type ClassificationBatchDetail } from '@/services/classificationService';
import '@/styles/ops-shared.css';
import './ConfirmBatch.css';

export const ConfirmBatch: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<ClassificationBatchDetail | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [checks, setChecks] = useState({ seals: false, weight: false, items: false });

  useEffect(() => {
    if (!batchId) return;
    classificationService.getBatch(batchId).then(data => {
      if (data.status !== 'PendingConfirmation') {
        if (data.status === 'PendingClassification' || data.status === 'Classifying') {
          toast.info('Lô hàng này đã được xác nhận trước đó.');
          navigate(`/classification/classify/${data.id}`);
        } else {
          toast.info('Lô hàng này đã được xử lý.');
          navigate('/classification');
        }
        return;
      }
      setBatch(data);
    }).catch(() => {
      toast.error('Không tải được thông tin Intake Batch.');
      navigate('/classification');
    }).finally(() => setLoadingBatch(false));
  }, [batchId, navigate, toast]);

  const toggleCheck = (key: keyof typeof checks) => {
    if (submitting || confirmed) return;
    setChecks(current => ({ ...current, [key]: !current[key] }));
  };

  const isAllChecked = checks.seals && checks.weight && checks.items;

  const handleConfirm = async () => {
    if (!batchId || !batch || !isAllChecked || submitting || confirmed) return;
    setSubmitting(true);
    setProgress(20);
    const progressTimer = window.setInterval(() => setProgress(value => Math.min(value + 15, 85)), 180);
    try {
      await classificationService.confirmReceipt(batchId);
      setProgress(100);
      setConfirmed(true);
      setBatch(current => current ? { ...current, status: 'PendingClassification' } : current);
      toast.success(`Đã xác nhận nhận lô hàng ${batch.batchCode} thành công.`);
    } catch (error: any) {
      setProgress(0);
      toast.error(error?.response?.data?.message || 'Không thể xác nhận nhận lô hàng.');
    } finally {
      window.clearInterval(progressTimer);
      setSubmitting(false);
    }
  };

  if (loadingBatch) return <div className="ops-page">Đang tải Intake Batch...</div>;
  if (!batch) return null;

  return <div className="ops-page confirm-batch-page">
    <div className="ops-nav">
      <button type="button" className="ops-back" onClick={() => navigate('/classification')} style={{ transition: 'all 500ms cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <ChevronLeft size={16} strokeWidth={1.5} /> Quay lại
      </button>
      <div className="ops-title-row">
        <h1>Xác nhận lô tiếp nhận</h1>
        <span className={`ops-badge ${confirmed ? 'done' : 'pending'}`}>
          {confirmed ? 'Đã nhận' : 'Chờ xác nhận từ bộ phận tiếp nhận'}
        </span>
      </div>
    </div>

    {confirmed && <div className="ops-success-banner" style={{ animation: 'confirmFadeIn 600ms cubic-bezier(0.32, 0.72, 0, 1)', borderRadius: 16, border: '1px solid rgba(16,185,129,.2)' }}>
      <ShieldCheck size={22} strokeWidth={1.5} />
      <div><strong>Tiếp nhận lô hàng thành công</strong><p>Lô {batch.batchCode} đã chuyển sang trạng thái chờ phân loại. Bạn có thể bắt đầu phân loại từng item.</p></div>
    </div>}

    <div className="ops-form-grid two-col" style={{ marginTop: 8 }}>
      <div className="bezel-outer"><div className="bezel-inner">
        <span className="ops-panel-label">Thông tin bàn giao</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>{batch.batchCode}</h2>
        <div className="ops-kv-grid" style={{ gridTemplateColumns: '1fr', gap: 14, marginTop: 0 }}>
          <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: 14 }}><span>Tuyến thu gom</span><strong>{batch.routeName || 'Chưa cập nhật'}</strong></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: 14 }}><span>Ngày tiếp nhận</span><strong><Calendar size={14} color="var(--color-primary)" /> {new Date(batch.intakeDate).toLocaleDateString('vi-VN')}</strong></div>
            <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: 14 }}><span>Khối lượng bàn giao</span><strong><Scale size={14} color="var(--color-primary)" /> {batch.totalWeight} kg</strong></div>
          </div>
          <div className="ops-kv" style={{ padding: '12px 16px', borderRadius: 14 }}><span>Donation Request trong lô</span><strong><Package size={14} color="var(--color-primary)" /> {batch.donationRequests} đơn</strong></div>
        </div>
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)', borderRadius: 14, display: 'flex', gap: 10 }}>
          <AlertCircle size={16} color="var(--color-danger)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>Sau khi xác nhận, Classification Staff chịu trách nhiệm mở kiện và phân loại từng vật phẩm trong lô.</p>
        </div>
      </div></div>

      <div className="bezel-outer"><div className="bezel-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <span className="ops-panel-label">Kiểm tra thực tế</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Biên bản bàn giao vật lý</h2>
        <p style={{ fontSize: '.84rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>Kiểm tra trạng thái kiện hàng thực tế trước khi xác nhận vào hệ thống.</p>
        <ul className="interactive-checklist">
          {[
            ['seals', 'Niêm phong của các bao/kiện còn nguyên vẹn, không có dấu hiệu rách hoặc tráo đổi.'],
            ['weight', `Cân nặng thực tế phù hợp với khối lượng bàn giao ${batch.totalWeight} kg.`],
            ['items', `Số lượng và mã Intake Batch trùng khớp với biên bản ${batch.donationRequests} đơn.`],
          ].map(([key, text]) => <li key={key} className={`checklist-item ${checks[key as keyof typeof checks] ? 'checked' : ''}`} onClick={() => toggleCheck(key as keyof typeof checks)}>
            <div className="checkbox-circle">{checks[key as keyof typeof checks] && <Check size={12} strokeWidth={2.5} color="#fff" />}</div>
            <div className="checklist-text">{text}</div>
          </li>)}
        </ul>
        <div style={{ marginTop: 'auto', paddingTop: 28 }}>
          {submitting && <div className="confirm-progress-container"><div className="confirm-progress-bar" style={{ width: `${progress}%` }} /></div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: submitting ? 16 : 0 }}>
            {!confirmed ? <button type="button" className="premium-btn-island" disabled={!isAllChecked || submitting} onClick={handleConfirm}>
              <span>{submitting ? 'Đang ghi nhận dữ liệu...' : 'Xác nhận nhận lô hàng'}</span><div className="btn-icon-island"><Check size={15} strokeWidth={2} /></div>
            </button> : <button type="button" className="premium-btn-island" onClick={() => navigate(`/classification/classify/${batch.id}`)} style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)' }}>
              <span style={{ color: 'var(--color-bg-primary)' }}>Tiến hành phân loại</span><div className="btn-icon-island" style={{ background: 'rgba(255,255,255,.2)', color: 'var(--color-bg-primary)' }}><ArrowRight size={15} /></div>
            </button>}
          </div>
        </div>
      </div></div>
    </div>
  </div>;
};

export default ConfirmBatch;
