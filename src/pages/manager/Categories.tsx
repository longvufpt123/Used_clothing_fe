import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Power, Save, Tags, X } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import apiClient from '@/services/api';
import { useToast } from '@/context/ToastContext';
import '@/styles/ops-shared.css';
import './Categories.css';
import './CategoriesStatus.css';

interface Category {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string | null;
  sortOrder: number;
  description: string;
  minimumMatchCount?: number | null;
  isActive?: boolean;
}
const types = [
  ['FabricType', 'Loại vải'],
  ['GarmentGroup', 'Nhóm quần áo'],
  ['ClothingType', 'Loại quần áo'],
  ['Gender', 'Giới tính'],
  ['TargetUser', 'Đối tượng'],
  ['Size', 'Kích cỡ'],
  ['ConditionGrade', 'Nhãn A/B/C'],
] as const;
const blank = {
  id: '',
  code: '',
  name: '',
  type: 'FabricType',
  parentId: '',
  sortOrder: 1,
  description: '',
  minimumMatchCount: null as number | null,
};

export default function Categories() {
  const toast = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [filter, setFilter] = useState('FabricType');
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [conditionQuestionCount, setConditionQuestionCount] = useState(0);
  const [gradeThresholds, setGradeThresholds] = useState<Record<string, number>>({
    GRADE_B: 2,
    GRADE_C: 1,
  });
  const load = () =>
    apiClient
      .get<unknown, Category[]>('/categories')
      .then(setItems)
      .catch(() => toast.error('Không thể tải danh mục phân loại.'));
  useEffect(() => {
    load();
    apiClient
      .get<unknown, { id: string }[]>('/condition-question-configurations')
      .then((data) => setConditionQuestionCount(data.length))
      .catch(() => setConditionQuestionCount(0));
  }, []);
  const visible = useMemo(
    () => items.filter((x) => x.type === filter).sort((a, b) => a.sortOrder - b.sortOrder),
    [items, filter],
  );
  const groups = items.filter((x) => x.type === 'GarmentGroup');
  const originalCategory = form.id ? items.find((x) => x.id === form.id) : undefined;
  const categoryTypeCount = items.filter((x) => x.type === form.type).length;
  const maximumCategoryOrder =
    form.id && originalCategory?.type === form.type ? categoryTypeCount : categoryTypeCount + 1;
  const savedGradeThresholds = useMemo(() => {
    const grades = items.filter((x) => x.type === 'ConditionGrade');
    return {
      GRADE_B: grades.find((x) => x.code === 'GRADE_B')?.minimumMatchCount ?? 2,
      GRADE_C: grades.find((x) => x.code === 'GRADE_C')?.minimumMatchCount ?? 1,
    };
  }, [items]);
  const gradeRulesChanged =
    gradeThresholds.GRADE_B !== savedGradeThresholds.GRADE_B ||
    gradeThresholds.GRADE_C !== savedGradeThresholds.GRADE_C;
  const edit = (item: Category) => {
    setForm({ ...blank, ...item, parentId: item.parentId || '' });
    setOpen(true);
  };
  const create = () => {
    setForm({ ...blank, type: filter, sortOrder: visible.length + 1 });
    setOpen(true);
  };
  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code và tên là bắt buộc.');
      return;
    }
    if (form.type === 'ClothingType' && !form.parentId) {
      toast.error('Loại quần áo phải thuộc một nhóm.');
      return;
    }
    if (
      form.type === 'ConditionGrade' &&
      !['GRADE_A', 'GRADE_B', 'GRADE_C'].includes(form.code.trim().toUpperCase())
    ) {
      toast.error('Flow hiện tại chỉ hỗ trợ GRADE_A, GRADE_B và GRADE_C.');
      return;
    }
    if (form.sortOrder < 1 || form.sortOrder > maximumCategoryOrder) {
      toast.error(`Thứ tự phải từ 1 đến ${maximumCategoryOrder}.`);
      return;
    }
    setSaving(true);
    const { id: _, ...formWithoutId } = form;
    const payload = {
      ...formWithoutId,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      parentId: form.parentId || null,
      isActive: true,
    };
    try {
      if (form.id) await apiClient.put(`/categories/${form.id}`, { ...payload, id: form.id });
      else await apiClient.post('/categories', payload);
      toast.success(form.id ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Code hoặc tên danh mục đã tồn tại.');
    } finally {
      setSaving(false);
    }
  };
  const disable = async (item: Category) => {
    if (!confirm(`Ngừng sử dụng “${item.name}”? Dữ liệu lịch sử vẫn được giữ lại.`)) return;
    try {
      await apiClient.delete(`/categories/${item.id}`);
      toast.success('Đã ngừng sử dụng danh mục.');
      await load();
    } catch {
      toast.error('Không thể ngừng sử dụng danh mục.');
    }
  };
  useEffect(() => {
    const next = { ...gradeThresholds };
    items
      .filter((x) => x.type === 'ConditionGrade')
      .forEach((item) => {
        if (item.code === 'GRADE_B' || item.code === 'GRADE_C')
          next[item.code] = item.minimumMatchCount ?? (item.code === 'GRADE_B' ? 2 : 1);
      });
    setGradeThresholds(next);
  }, [items]);
  const saveGradeRules = async () => {
    const gradeItems = items.filter(
      (x) => x.type === 'ConditionGrade' && (x.code === 'GRADE_B' || x.code === 'GRADE_C'),
    );
    if (gradeItems.length !== 2) return toast.error('Cần cấu hình đầy đủ Nhãn B và Nhãn C.');
    if (gradeItems.some((item) => (gradeThresholds[item.code] || 0) < 1))
      return toast.error('Ngưỡng phải từ 1 trở lên.');
    if (
      conditionQuestionCount > 0 &&
      gradeItems.some((item) => gradeThresholds[item.code] > conditionQuestionCount)
    )
      return toast.error(
        `Ngưỡng không được vượt quá ${conditionQuestionCount} tiêu chí đang hoạt động.`,
      );
    setSavingRules(true);
    try {
      await Promise.all(
        gradeItems.map((item) =>
          apiClient.put(`/categories/${item.id}`, {
            ...item,
            minimumMatchCount: gradeThresholds[item.code],
          }),
        ),
      );
      toast.success('Đã lưu quy tắc tổng hợp nhãn.');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể lưu quy tắc tổng hợp nhãn.');
    } finally {
      setSavingRules(false);
    }
  };
  return (
    <AdminLayout>
      <div className="ops-page">
        <header className="ops-pagehead">
          <div className="ops-pagehead-main">
            <span className="ops-pagehead-kicker">Cấu hình hệ thống</span>
            <h1>Danh mục phân loại quần áo</h1>
          </div>
          {filter !== 'ConditionGrade' && (
            <button className="ops-btn ops-btn-primary" onClick={create}>
              <Plus size={16} /> Thêm danh mục
            </button>
          )}
        </header>
        <div className="ops-tabs">
          {types.map(([value, label]) => (
            <button
              key={value}
              className={`ops-tab ${filter === value ? 'active' : ''}`}
              onClick={() => setFilter(value)}
            >
              <Tags size={14} />
              {label}
              <span className="ops-tab-count">{items.filter((x) => x.type === value).length}</span>
            </button>
          ))}
        </div>
        <section className="ops-panel">
          <div className="ops-section-head">
            <h2>{types.find((x) => x[0] === filter)?.[1]}</h2>
            <span>{visible.length} giá trị đang sử dụng</span>
          </div>
          {filter === 'ConditionGrade' && (
            <div className="grade-rule-config">
              <div className="grade-rule-intro">
                <strong>Quy tắc tổng hợp kết quả</strong>
                <span>Hệ thống xét C trước, sau đó B; nếu không đạt ngưỡng thì kết quả là A.</span>
                <span>Đang có {conditionQuestionCount} tiêu chí đánh giá hoạt động.</span>
                {gradeRulesChanged && <em>Đang có thay đổi chưa lưu</em>}
              </div>
              <div className="grade-rule-fields">
                <label>
                  <span>Nhãn C</span>
                  <small>Số câu trả lời C tối thiểu</small>
                  <input
                    type="number"
                    min="1"
                    max={conditionQuestionCount || undefined}
                    value={gradeThresholds.GRADE_C}
                    onChange={(e) =>
                      setGradeThresholds({ ...gradeThresholds, GRADE_C: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  <span>Nhãn B</span>
                  <small>Số câu trả lời B tối thiểu</small>
                  <input
                    type="number"
                    min="1"
                    max={conditionQuestionCount || undefined}
                    value={gradeThresholds.GRADE_B}
                    onChange={(e) =>
                      setGradeThresholds({ ...gradeThresholds, GRADE_B: Number(e.target.value) })
                    }
                  />
                </label>
                <div className="grade-rule-example">
                  <b>Quy tắc hiện tại</b>
                  <span>Chỉ cần {savedGradeThresholds.GRADE_C} câu C → Nhãn C</span>
                  <span>Không đạt C nhưng có {savedGradeThresholds.GRADE_B} câu B → Nhãn B</span>
                  <span>Còn lại → Nhãn A</span>
                </div>
              </div>
              <button
                className="ops-btn ops-btn-primary"
                disabled={savingRules || !gradeRulesChanged}
                onClick={saveGradeRules}
              >
                <Save size={16} />
                {savingRules ? 'Đang lưu...' : gradeRulesChanged ? 'Lưu quy tắc' : 'Đã cập nhật'}
              </button>
            </div>
          )}
          <div className="ops-item-list">
            {visible.map((item) => (
              <div
                className={`ops-item-row category-item-row${
                  item.type === 'ConditionGrade' ? ' category-item-row--without-disable' : ''
                }`}
                key={item.id}
              >
                <div className="ops-item-main">
                  <strong>{item.name}</strong>
                  <span>
                    {item.code}
                    {item.parentId
                      ? ` · Thuộc ${groups.find((g) => g.id === item.parentId)?.name || 'nhóm không tồn tại'}`
                      : ''}
                    {item.description ? ` · ${item.description}` : ''}
                  </span>
                </div>
                <span className="ops-badge done">Thứ tự {item.sortOrder}</span>
                <button className="ops-btn ops-btn-secondary" onClick={() => edit(item)}>
                  <Edit3 size={14} /> Sửa
                </button>
                {item.type !== 'ConditionGrade' && (
                  <button className="ops-btn ops-btn-danger" onClick={() => disable(item)}>
                    <Power size={14} /> Ngừng dùng
                  </button>
                )}
              </div>
            ))}
            {!visible.length && (
              <div className="ops-empty">
                <Tags size={34} />
                <h4>Chưa có giá trị</h4>
                <p>Thêm danh mục để Classification Staff có thể lựa chọn.</p>
              </div>
            )}
          </div>
        </section>
        {open && (
          <div className="rcv-modal-overlay">
            <section className="ops-panel rcv-modal">
              <div className="ops-section-head">
                <h2>{form.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
                <button className="ops-back" onClick={() => setOpen(false)}>
                  <X size={17} />
                </button>
              </div>
              <div className="ops-field">
                <label>Loại cấu hình</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm((p) => ({
                      ...p,
                      type,
                      parentId: '',
                      sortOrder: items.filter((x) => x.type === type).length + 1,
                    }));
                  }}
                >
                  {types.map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ops-field">
                <label>Code duy nhất</label>
                <input
                  value={form.code}
                  disabled={!!form.id}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="VD: FABRIC_COTTON"
                />
              </div>
              <div className="ops-field">
                <label>Tên hiển thị</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              {form.type === 'ClothingType' && (
                <div className="ops-field">
                  <label>Thuộc nhóm quần áo</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                  >
                    <option value="">-- Chọn nhóm --</option>
                    {groups.map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="ops-field">
                <label>Thứ tự hiển thị *</label>
                <input
                  type="number"
                  min="1"
                  max={maximumCategoryOrder}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                />
                <small>
                  {form.id && originalCategory?.type === form.type
                    ? `Từ 1 đến ${maximumCategoryOrder}. Chọn vị trí đã có để đổi chỗ.`
                    : `Từ 1 đến ${maximumCategoryOrder}. Các giá trị phía sau sẽ tự dịch xuống.`}
                </small>
              </div>
              <div className="ops-field">
                <label>Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <button
                className="ops-btn ops-btn-primary ops-btn-block"
                disabled={saving}
                onClick={save}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu danh mục'}
              </button>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
