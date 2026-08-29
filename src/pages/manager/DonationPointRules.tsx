import { useEffect, useState } from 'react';
import { Calculator, Coins, Info, Save, Scale } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { donationPointRuleService } from '@/services/donationPointRuleService';
import '@/styles/ops-shared.css';
import './DonationPointRules.css';

export default function DonationPointRules() {
  const toast = useToast();
  const [pointsPerKg, setPointsPerKg] = useState('10');
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const rule = await donationPointRuleService.get();
      setPointsPerKg(String(rule.pointsPerKg));
      setUpdatedAt(rule.updatedAt);
    } catch {
      toast.error('Không tải được quy tắc quy đổi điểm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const value = Number(pointsPerKg);
  const isValid = Number.isInteger(value) && value >= 1 && value <= 10000;

  const save = async () => {
    if (!isValid) {
      toast.warning('Điểm quy đổi phải là số nguyên từ 1 đến 10.000.');
      return;
    }
    setSaving(true);
    try {
      await donationPointRuleService.update(value);
      toast.success('Đã cập nhật quy tắc quy đổi điểm donor.');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật quy tắc điểm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-page point-rule-page">
      <header className="ops-pagehead">
        <div>
          <span className="ops-pagehead-kicker"><Coins /> Rewards Configuration</span>
          <h1>Quản lý quy tắc đổi điểm donor</h1>
          <p>Thiết lập số điểm donor nhận được theo khối lượng quần áo đã tiếp nhận thực tế.</p>
        </div>
        <span className="ops-badge done">Đang áp dụng</span>
      </header>

      <div className="point-rule-layout">
        <section className="ops-panel glass point-rule-editor">
          <div className="point-rule-heading">
            <Scale />
            <div>
              <h2>Tỷ lệ quy đổi</h2>
              <p>{updatedAt ? `Cập nhật gần nhất ${new Date(updatedAt).toLocaleString('vi-VN')}` : 'Quy tắc mặc định của hệ thống'}</p>
            </div>
          </div>

          <div className={`ops-field point-rule-field ${!isValid && !loading ? 'invalid' : ''}`}>
            <label htmlFor="points-per-kg">Số điểm cho mỗi kg quần áo</label>
            <div className="point-rule-input-wrap">
              <input
                id="points-per-kg"
                type="number"
                min="1"
                max="10000"
                step="1"
                inputMode="numeric"
                disabled={loading}
                value={pointsPerKg}
                onChange={(event) => setPointsPerKg(event.target.value)}
              />
              <span>điểm / kg</span>
            </div>
            {!isValid && !loading && <small>Nhập số nguyên từ 1 đến 10.000 điểm/kg.</small>}
          </div>

          <div className="ops-actions">
            <button className="ops-btn ops-btn-primary" disabled={loading || saving || !isValid} onClick={() => void save()}>
              <Save /> {saving ? 'Đang lưu...' : 'Lưu và áp dụng'}
            </button>
          </div>
        </section>

        <aside className="ops-panel glass point-rule-preview">
          <div className="point-rule-heading"><Calculator /><div><h2>Xem trước quy đổi</h2><p>Số điểm dự kiến theo tỷ lệ hiện tại</p></div></div>
          {[1, 5, 10].map((weight) => (
            <div className="point-rule-example" key={weight}>
              <span>{weight} kg</span><b>{isValid ? (weight * value).toLocaleString('vi-VN') : 0} điểm</b>
            </div>
          ))}
          <div className="point-rule-note"><Info /><p>Quy tắc mới chỉ áp dụng cho những lần tiếp nhận hoàn tất sau khi lưu. Điểm đã cộng trước đó không bị thay đổi.</p></div>
        </aside>
      </div>
    </div>
  );
}
