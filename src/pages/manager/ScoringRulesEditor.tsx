import { useEffect, useState } from 'react';
import apiClient from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function ScoringRulesEditor() {
  const toast = useToast();
  const [rules, setRules] = useState<{ gradeAMinimum: number; gradeBMinimum: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const load = () => { setError(false); void apiClient.get<unknown, NonNullable<typeof rules>>('/condition-question-configurations/scoring').then(setRules).catch(() => setError(true)); };
  useEffect(load, []);
  const save = async () => {
    if (!rules || !Number.isFinite(rules.gradeAMinimum) || !Number.isFinite(rules.gradeBMinimum)
      || rules.gradeBMinimum < 0 || rules.gradeAMinimum > 100 || rules.gradeBMinimum >= rules.gradeAMinimum)
      return toast.error('Ngưỡng phải thỏa 0 ≤ B < A ≤ 100.');
    setSaving(true);
    try { await apiClient.put('/condition-question-configurations/scoring', rules); toast.success('Đã lưu ngưỡng điểm cho lần đánh giá mới.'); }
    catch { toast.error('Không lưu được ngưỡng điểm.'); }
    finally { setSaving(false); }
  };
  return <section className="ops-panel grade-rule-config">
    <h2>Trung bình có trọng số</h2>
    <p>A = 100 điểm · B = 50 điểm · C = 0 điểm. Điểm tổng = tổng (điểm × trọng số) / tổng trọng số.</p>
    <p>Điểm làm tròn đến 2 chữ số thập phân trước khi xác định nhãn. Không có tiêu chí bắt buộc ra C.</p>
    {error ? <button className="ops-btn" onClick={load}>Tải lại cấu hình</button> : !rules ? <p>Đang tải ngưỡng điểm...</p> : <>
      <div className="grade-rule-fields">
        <label>Nhãn A từ<input type="number" min="0" max="100" step="0.01" value={rules.gradeAMinimum} onChange={(e) => setRules({ ...rules, gradeAMinimum: Number(e.target.value) })} /></label>
        <label>Nhãn B từ<input type="number" min="0" max="100" step="0.01" value={rules.gradeBMinimum} onChange={(e) => setRules({ ...rules, gradeBMinimum: Number(e.target.value) })} /></label>
      </div>
      <p>A ≥ {rules.gradeAMinimum} · B từ {rules.gradeBMinimum} đến dưới {rules.gradeAMinimum} · C &lt; {rules.gradeBMinimum}.</p>
      <button className="ops-btn ops-btn-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Đang lưu...' : 'Lưu ngưỡng điểm'}</button>
    </>}
  </section>;
}
