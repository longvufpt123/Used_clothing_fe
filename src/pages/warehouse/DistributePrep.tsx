import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, PackageCheck, Truck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  confirmDistributionPrep,
  getDistribution,
  markDistributionShipped,
  type DistributionRequest,
} from '@/utils/warehouseMockDb';
import '@/styles/ops-shared.css';

export const DistributePrep: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [req, setReq] = useState<DistributionRequest | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    const d = getDistribution(requestId);
    if (!d) {
      toast.error('Yêu cầu phân phối không tồn tại.');
      navigate('/warehouse');
      return;
    }
    setReq(d);
    if (d.trackingCode) setTrackingCode(d.trackingCode);
    const init: Record<string, number> = {};
    d.itemsNeeded.forEach((i) => {
      init[i.label] = i.qty;
    });
    setQtys(init);
  }, [requestId, navigate, toast]);

  if (!req) return null;

  const isPending = req.status === 'Pending';

  const handlePrep = () => {
    const packed = req.itemsNeeded.map((i) => ({
      label: i.label,
      qty: qtys[i.label] ?? i.qty,
    }));
    if (packed.some((p) => p.qty <= 0)) {
      toast.error('Số lượng đóng gói phải lớn hơn 0.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const result = confirmDistributionPrep(req.id, packed);
      setSaving(false);
      if (!result.ok || !result.trackingCode) {
        toast.error('Không tạo được vận đơn.');
        return;
      }
      // Simulate GHN API call success then mark shipped
      markDistributionShipped(req.id);
      setTrackingCode(result.trackingCode);
      setReq({
        ...req,
        status: 'Shipped',
        packedItems: packed,
        trackingCode: result.trackingCode,
        ghnStatus: 'Đang lấy hàng',
      });
      toast.success(`Đóng gói xong. Vận đơn GHN: ${result.trackingCode}`);
    }, 1000);
  };

  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button type="button" className="ops-back" onClick={() => navigate('/warehouse')}>
          <ChevronLeft size={16} strokeWidth={1.75} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>Gom hàng & đóng gói</h1>
          <span className={`ops-badge ${req.status.toLowerCase()}`}>
            {req.status === 'Pending' ? 'Chờ gom' : req.status === 'Prepared' ? 'Đã đóng gói' : 'Đã gửi'}
          </span>
        </div>
      </div>

      {trackingCode && (
        <div className="ops-success-banner">
          <PackageCheck size={22} strokeWidth={1.75} />
          <div>
            <strong>Vận đơn GHN đã tạo</strong>
            <p>
              Mã theo dõi: <strong style={{ color: 'var(--color-text-primary)' }}>{trackingCode}</strong>.
              Trạng thái đơn: Prepared / Shipped.
            </p>
          </div>
        </div>
      )}

      <div className="ops-panel glass">
        <span className="ops-panel-label">{req.code}</span>
        <h2>{req.campaignName}</h2>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Điểm nhận</span>
            <strong style={{ fontSize: '0.85rem', fontWeight: 550 }}>{req.destination}</strong>
          </div>
          <div className="ops-kv">
            <span>Liên hệ</span>
            <strong>
              {req.contactName} · {req.contactPhone}
            </strong>
          </div>
        </div>
      </div>

      <div className="ops-panel glass">
        <span className="ops-panel-label">Danh mục cần gom</span>
        <h2 style={{ marginBottom: 12 }}>Số lượng đóng gói thực tế</h2>
        <div className="ops-form-grid">
          {req.itemsNeeded.map((item) => (
            <div key={item.label} className="ops-field">
              <label htmlFor={`qty-${item.label}`}>
                {item.label} (yêu cầu {item.qty})
              </label>
              <input
                id={`qty-${item.label}`}
                type="number"
                min={1}
                value={qtys[item.label] ?? item.qty}
                disabled={!isPending}
                onChange={(e) =>
                  setQtys((prev) => ({
                    ...prev,
                    [item.label]: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="ops-actions">
          {isPending ? (
            <button
              type="button"
              className="ops-btn ops-btn-primary ops-btn-block"
              onClick={handlePrep}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="ops-spinner" /> Đang tạo vận đơn GHN...
                </>
              ) : (
                <>
                  <Truck size={16} strokeWidth={1.75} /> Đóng gói & xác nhận gửi hàng
                </>
              )}
            </button>
          ) : trackingCode ? (
            <button
              type="button"
              className="ops-btn ops-btn-primary ops-btn-block"
              onClick={() => navigate(`/warehouse/tracking/${trackingCode}`)}
            >
              Xem theo dõi vận đơn
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DistributePrep;
