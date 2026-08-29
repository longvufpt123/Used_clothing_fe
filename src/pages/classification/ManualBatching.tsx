import { useEffect, useMemo, useState } from 'react';
import { Boxes, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  classificationService,
  type ClassificationCatalog,
  type GroupedClassifiedBatch,
  type GroupedClassifiedBatchDetail,
  type UnassignedClassifiedItem,
} from '@/services/classificationService';
import '@/styles/ops-shared.css';
import './ManualBatching.css';

const emptyForm = {
  garmentGroupId: '', genderId: '', targetUserId: '', conditionGradeId: '',
};

export default function ManualBatching() {
  const toast = useToast();
  const [catalog, setCatalog] = useState<ClassificationCatalog | null>(null);
  const [items, setItems] = useState<UnassignedClassifiedItem[]>([]);
  const [batches, setBatches] = useState<GroupedClassifiedBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<GroupedClassifiedBatchDetail | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (keepBatchId?: string) => {
    setLoading(true);
    try {
      const [catalogData, itemData, batchData] = await Promise.all([
        classificationService.getCatalog(),
        classificationService.getUnassignedItems(),
        classificationService.getGroupedBatches(),
      ]);
      setCatalog(catalogData);
      setItems(itemData);
      const manual = batchData.filter((batch) => batch.status === 'Draft' || batch.status === 'ReadyForPlacement');
      setBatches(manual);
      const id = keepBatchId || selectedBatch?.id;
      if (id && manual.some((batch) => batch.id === id)) {
        setSelectedBatch(await classificationService.getGroupedBatch(id));
      } else {
        setSelectedBatch(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không tải được dữ liệu gom Classified Batch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const compatibleItems = useMemo(() => {
    if (!selectedBatch || selectedBatch.status !== 'Draft') return [];
    return items.filter((item) =>
      item.garmentGroup === selectedBatch.garmentGroup
      && item.gender === selectedBatch.gender
      && item.targetUser === selectedBatch.targetUser
      && item.conditionGrade === selectedBatch.conditionGrade);
  }, [items, selectedBatch]);

  const createBatch = async () => {
    if (Object.values(form).some((value) => !value)) {
      toast.error('Vui lòng chọn đầy đủ thuộc tính của Classified Batch.');
      return;
    }
    setCreating(true);
    try {
      const created = await classificationService.createManualBatch(form);
      setForm(emptyForm);
      toast.success(`Đã tạo batch rỗng ${created.batchCode}.`);
      await load(created.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo Classified Batch.');
    } finally { setCreating(false); }
  };

  const assignItems = async () => {
    if (!selectedBatch || !selectedItems.length) return;
    setSaving(true);
    try {
      await classificationService.assignItemsToBatch(selectedBatch.id, selectedItems);
      setSelectedItems([]);
      toast.success('Đã đưa item vào Classified Batch.');
      await load(selectedBatch.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể thêm item vào batch.');
    } finally { setSaving(false); }
  };

  const removeItem = async (itemId: string) => {
    if (!selectedBatch) return;
    setSaving(true);
    try {
      await classificationService.removeItemFromBatch(selectedBatch.id, itemId);
      await load(selectedBatch.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể bỏ item khỏi batch.');
    } finally { setSaving(false); }
  };

  const finalize = async () => {
    if (!selectedBatch) return;
    setSaving(true);
    try {
      await classificationService.finalizeManualBatch(selectedBatch.id);
      toast.success('Batch đã sẵn sàng để xếp vào khu vực đồ đã phân loại.');
      await load(selectedBatch.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể hoàn tất gom batch.');
    } finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, options: { id: string; name: string }[]) => (
    <div className="ops-field">
      <label>{label}</label>
      <select value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}>
        <option value="">Chọn {label.toLowerCase()}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">BƯỚC 2 · GOM CLASSIFIED BATCH</span>
          <h1>Gom item vào Classified Batch</h1>
          <p>Tạo batch rỗng theo thuộc tính, sau đó chọn các item tương ứng để đưa vào batch.</p>
        </div>
      </header>

      <section className="ops-panel glass">
        <div className="ops-section-head"><div><h2>Tạo Classified Batch rỗng</h2><span>Kho được xác định tự động theo tài khoản staff</span></div></div>
        <div className="ops-form-grid">
          {field('Loại', 'garmentGroupId', catalog?.garmentGroups || [])}
          {field('Giới tính', 'genderId', catalog?.genders || [])}
          {field('Đối tượng', 'targetUserId', catalog?.targetUsers || [])}
          {field('Hướng xử lý A/B/C', 'conditionGradeId', catalog?.conditionGrades || [])}
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn-primary" disabled={creating} onClick={() => void createBatch()}>
            <Plus size={16} /> {creating ? 'Đang tạo...' : 'Tạo lô hàng phân loại'}
          </button>
        </div>
      </section>

      <div className="classification-manual-grid">
        <section className="ops-panel glass">
          <div className="ops-section-head"><div><h2>Classified Batch</h2><span>{batches.length} batch đang xử lý</span></div></div>
          <div className="ops-list">
            {batches.map((batch) => (
              <button key={batch.id} type="button" className={`ops-card classification-manual-batch ${selectedBatch?.id === batch.id ? 'selected' : ''}`}
                onClick={async () => { setSelectedItems([]); setSelectedBatch(await classificationService.getGroupedBatch(batch.id)); }}>
                <div className="ops-card-top"><strong>{batch.batchCode}</strong><span className="ops-badge pending">{batch.status === 'Draft' ? 'Đang tạo' : 'Chờ xếp khu'}</span></div>
                <h3>{batch.garmentGroup} · {batch.targetUser} · {batch.gender}</h3>
                <p>Nhãn {batch.conditionGrade}</p>
              </button>
            ))}
            {!loading && !batches.length && <div className="ops-empty"><Boxes size={32} /><p>Chưa có Classified Batch thủ công.</p></div>}
          </div>
        </section>

        <section className="ops-panel glass">
          <div className="ops-section-head"><div><h2>Item phù hợp</h2><span>{compatibleItems.length} item có thể thêm</span></div></div>
          {!selectedBatch ? <div className="ops-empty"><p>Chọn hoặc tạo một Classified Batch để bắt đầu.</p></div> : (
            <>
              {selectedBatch.status === 'Draft' && compatibleItems.map((item) => (
                <label key={item.id} className="classification-manual-item">
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={(event) => setSelectedItems((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
                  <span><strong>{item.itemCode}</strong><small>{item.intakeBatchCode} · {item.garmentGroup} · {item.targetUser} · {item.gender} · {item.size} · Nhãn {item.conditionGrade}</small></span>
                </label>
              ))}
              {selectedBatch.status === 'Draft' && !compatibleItems.length && <div className="ops-empty"><p>Không có item chờ gom phù hợp với bộ thuộc tính này.</p></div>}
              <div className="ops-actions">
                {selectedBatch.status === 'Draft' && <button className="ops-btn ops-btn-secondary" disabled={saving || !selectedItems.length} onClick={() => void assignItems()}><Plus size={15} /> Thêm đồ</button>}
                {selectedBatch.status === 'Draft' && <button className="ops-btn ops-btn-primary" disabled={saving || !selectedBatch.items.length} onClick={() => void finalize()}><CheckCircle2 size={15} /> Hoàn tất gom nhóm</button>}
              </div>
              <div className="ops-list">
                {selectedBatch.items.map((item) => <div key={item.id} className="classification-manual-item assigned"><span><strong>{item.itemCode}</strong><small>{item.garmentGroup} · {item.targetUser} · {item.gender} · {item.size}</small></span>{selectedBatch.status === 'Draft' && <button className="ops-btn ops-btn-danger" disabled={saving} onClick={() => void removeItem(item.id)}><Trash2 size={14} /></button>}</div>)}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
