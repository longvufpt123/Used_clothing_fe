import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, CheckCircle2, Plus, Trash2, Pencil, Lightbulb, ImageOff } from 'lucide-react';
import ManualBatchDialog from './ManualBatchDialog';
import BatchPlacementDialog from './BatchPlacementDialog';
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

function ItemThumbnail({ src, label }: { src?: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="classification-manual-thumbnail">
    {src && !failed
      ? <img src={src} alt={label} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <div role="img" aria-label={src ? 'Không tải được hình ảnh' : 'Chưa có hình ảnh'}
          title={src ? 'Không tải được hình ảnh' : 'Chưa có hình ảnh'}>
          <ImageOff size={24} aria-hidden="true" />
        </div>}
  </div>;
}
const attributeKeys = Object.keys(emptyForm) as (keyof typeof emptyForm)[];
const matchesAttributes = (left: Partial<Record<keyof typeof emptyForm, string | null>>,
  right: Partial<Record<keyof typeof emptyForm, string | null>>) =>
  attributeKeys.every((key) => !!left[key] && left[key] === right[key]);

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
  const [loadError, setLoadError] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [selectingSuggestion, setSelectingSuggestion] = useState(false);
  const createLock = useRef(false);
  const formSection = useRef<HTMLElement>(null);
  const itemsSection = useRef<HTMLElement>(null);
  const [placing, setPlacing] = useState<GroupedClassifiedBatch | null>(null);
  const [batchAction, setBatchAction] = useState<{ batch: GroupedClassifiedBatch; mode: 'edit' | 'delete' } | null>(null);

  const load = async (keepBatchId?: string) => {
    setLoading(true);
    setLoadError(false);
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
      window.dispatchEvent(new Event('classification-data-changed'));
      const id = keepBatchId || selectedBatch?.id;
      if (id && manual.some((batch) => batch.id === id)) {
        setSelectedBatch(await classificationService.getGroupedBatch(id));
      } else {
        setSelectedBatch(null);
      }
    } catch (error: any) {
      setLoadError(true);
      toast.error(error?.response?.data?.message || 'Không tải được dữ liệu gom Classified Batch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const compatibleItems = useMemo(() => {
    if (!selectedBatch || selectedBatch.status !== 'Draft') return [];
    return items.filter((item) => matchesAttributes(item, selectedBatch));
  }, [items, selectedBatch]);

  const suggestions = useMemo(() => {
    if (!catalog) return [];
    const groups = new Map<string, { key: string; attributes: typeof emptyForm; label: string; gender: string;
      target: string; grade: string; count: number; draft?: GroupedClassifiedBatch }>();
    for (const item of items) {
      const group = catalog.garmentGroups.find((option) => option.id === item.garmentGroupId);
      const gender = catalog.genders.find((option) => option.id === item.genderId);
      const target = catalog.targetUsers.find((option) => option.id === item.targetUserId);
      const grade = catalog.conditionGrades.find((option) => option.id === item.conditionGradeId);
      if (!group || !gender || !target || !grade) continue;
      const attributes = { garmentGroupId: group.id, genderId: gender.id, targetUserId: target.id, conditionGradeId: grade.id };
      const key = JSON.stringify(attributeKeys.map((field) => attributes[field]));
      const existing = groups.get(key);
      if (existing) { existing.count++; continue; }
      groups.set(key, { key, attributes, label: group.name, gender: gender.name, target: target.name,
        grade: item.conditionGrade, count: 1,
        draft: batches.find((batch) => batch.status === 'Draft' && matchesAttributes(batch, attributes)) });
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'vi') || a.key.localeCompare(b.key));
  }, [items, batches, catalog]);

  const useSuggestion = async (suggestion: typeof suggestions[number]) => {
    if (suggestion.draft) {
      setSelectingSuggestion(true);
      try {
        const detail = await classificationService.getGroupedBatch(suggestion.draft.id);
        if (detail.status !== 'Draft') {
          toast.info('Batch này đã thay đổi trạng thái. Đang cập nhật lại gợi ý.');
          await load();
          return;
        }
        setSelectedItems([]);
        setSelectedBatch(detail);
        itemsSection.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch { toast.error('Không tải được batch phù hợp. Vui lòng thử lại.'); }
      finally { setSelectingSuggestion(false); }
    } else {
      setForm(suggestion.attributes);
      formSection.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      formSection.current?.querySelector('select')?.focus({ preventScroll: true });
    }
  };

  const createBatch = async () => {
    if (createLock.current) return;
    if (Object.values(form).some((value) => !value)) {
      toast.error('Vui lòng chọn đầy đủ thuộc tính của Classified Batch.');
      return;
    }
    createLock.current = true;
    setCreating(true);
    try {
      const created = await classificationService.createManualBatch(form);
      setSelectedItems([]);
      setForm(emptyForm);
      toast.success(`Đã tạo batch rỗng ${created.batchCode}.`);
      await load(created.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo Classified Batch.');
    } finally { createLock.current = false; setCreating(false); }
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
          {!loading && <p><strong>{items.length}</strong> món đã phân loại đang chờ gom nhóm.</p>}
        </div>
      </header>

      <section className="ops-panel glass batch-suggestions">
        <div className="ops-section-head">
          <div><h2><Lightbulb size={20} aria-hidden="true" /> Gợi ý batch từ item hiện có</h2>
            <span>Cùng loại, giới tính, đối tượng và nhãn A/B/C · Chỉ item chưa gom trong kho của bạn</span></div>
          <button type="button" className="ops-btn ops-btn-secondary" disabled={loading || creating || saving || selectingSuggestion} onClick={() => void load()}>Làm mới</button>
        </div>
        {loading ? <p role="status">Đang cập nhật gợi ý...</p> : loadError ? <p role="alert">Không tải được gợi ý. Vui lòng bấm Làm mới để thử lại.</p> : <>
          {suggestions.length > 0 ? <div className="batch-suggestions-grid">
            {(showAllSuggestions ? suggestions : suggestions.slice(0, 6)).map((suggestion) => <article className="batch-suggestion-card" key={suggestion.key}>
              <div className="ops-card-top"><h3>{suggestion.label}</h3><span className="ops-badge done">{suggestion.count} item</span></div>
              <p>{suggestion.gender} · {suggestion.target}</p>
              <strong>Nhãn {suggestion.grade} · {suggestion.grade === 'A' ? 'Từ thiện' : suggestion.grade === 'B' ? 'Tái chế' : 'Tiêu hủy'}</strong>
              <small>{suggestion.draft ? `Batch nháp phù hợp: ${suggestion.draft.batchCode}` : 'Điền sẵn thuộc tính để tạo batch, sau đó chọn item cần thêm.'}</small>
              <button type="button" className="ops-btn ops-btn-secondary" disabled={creating || saving || selectingSuggestion} onClick={() => void useSuggestion(suggestion)}>
                {suggestion.draft ? 'Chọn batch phù hợp' : 'Dùng gợi ý'}
              </button>
            </article>)}
          </div> : <p>Chưa có nhóm item đủ thuộc tính để gợi ý tạo batch.</p>}
          {items.length > suggestions.reduce((sum, group) => sum + group.count, 0) && <p className="batch-suggestions-note">Một số item cần cập nhật thuộc tính phân loại trước khi có thể gợi ý gom nhóm.</p>}
          {suggestions.length > 6 && <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setShowAllSuggestions((value) => !value)}>{showAllSuggestions ? 'Thu gọn' : `Xem tất cả ${suggestions.length} gợi ý`}</button>}
        </>}
      </section>

      <section className="ops-panel glass" ref={formSection}>
        <div className="ops-section-head"><div><h2>Tạo Classified Batch rỗng</h2><span>Kho được xác định tự động theo tài khoản staff</span></div></div>
        <div className="ops-form-grid">
          {field('Loại', 'garmentGroupId', catalog?.garmentGroups || [])}
          {field('Giới tính', 'genderId', catalog?.genders || [])}
          {field('Đối tượng', 'targetUserId', catalog?.targetUsers || [])}
          {field('Hướng xử lý A/B/C', 'conditionGradeId', catalog?.conditionGrades || [])}
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn-primary" disabled={creating || loading || loadError || saving || selectingSuggestion} onClick={() => void createBatch()}>
            <Plus size={16} /> {creating ? 'Đang tạo...' : 'Tạo lô hàng phân loại'}
          </button>
        </div>
      </section>

      <div className="classification-manual-grid">
        {placing && <BatchPlacementDialog batch={placing} onClose={() => setPlacing(null)} onSaved={async () => {
          setSelectedItems([]);
          await load();
          toast.success('Đã xếp batch vào khu đồ đã phân loại.');
        }} />}
        {batchAction && <ManualBatchDialog batch={batchAction.batch} mode={batchAction.mode} catalog={catalog} onClose={() => setBatchAction(null)} onSaved={async () => {
          setSelectedItems([]);
          await load();
          toast.success(batchAction.mode === 'edit' ? 'Đã cập nhật batch.' : 'Đã xóa batch, các món đã trở về danh sách chờ gom nhóm.');
        }} />}
        <section className="ops-panel glass">
          <div className="ops-section-head"><div><h2>Classified Batch</h2><span>{batches.length} batch đang xử lý</span></div></div>
          <div className="ops-list">
            {batches.map((batch) => (
              <article key={batch.id} className={`ops-card classification-manual-batch ${selectedBatch?.id === batch.id ? 'selected' : ''}`}>
                <button type="button" className="classification-manual-summary" disabled={saving} onClick={async () => {
                  try { setSelectedItems([]); setSelectedBatch(await classificationService.getGroupedBatch(batch.id)); }
                  catch { toast.error('Không tải được chi tiết batch.'); }
                }}>
                <div className="ops-card-top"><strong>{batch.batchCode}</strong><span className="ops-badge pending">{batch.status === 'Draft' ? 'Đang tạo' : 'Chờ xếp khu'}</span></div>
                <h3>{batch.garmentGroup} · {batch.targetUser} · {batch.gender}</h3>
                <p>Nhãn {batch.conditionGrade}</p>
                </button>
                <div className="ops-actions">
                  {batch.status === 'ReadyForPlacement' && <button type="button" className="ops-btn ops-btn-primary" disabled={saving} onClick={() => setPlacing(batch)}><Boxes size={15} /> Xếp vào khu đồ đã phân loại</button>}
                  <button type="button" className="ops-btn ops-btn-secondary" disabled={saving} onClick={() => setBatchAction({ batch, mode: 'edit' })}><Pencil size={15} /> Sửa</button>
                  <button type="button" className="ops-btn ops-btn-danger" disabled={saving} onClick={() => setBatchAction({ batch, mode: 'delete' })}><Trash2 size={15} /> Xóa</button>
                </div>
              </article>
            ))}
            {!loading && !batches.length && <div className="ops-empty"><Boxes size={32} /><p>Chưa có Classified Batch thủ công.</p></div>}
          </div>
        </section>

        <section className="ops-panel glass" ref={itemsSection}>
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
                {selectedBatch.items.map((item) => <div key={item.id} className="classification-manual-item assigned">
                  <ItemThumbnail key={item.imageUrls?.[0] || 'no-image'} src={item.imageUrls?.[0]}
                    label={`${item.clothingType || item.garmentGroup} · ${item.itemCode}`} />
                  <span><strong>{item.itemCode}</strong><small>{item.garmentGroup} · {item.targetUser} · {item.gender} · {item.size}</small></span>
                  {selectedBatch.status === 'Draft' && <button className="ops-btn ops-btn-danger" disabled={saving}
                    aria-label={`Bỏ item ${item.itemCode} khỏi batch`} onClick={() => void removeItem(item.id)}><Trash2 size={14} /></button>}
                </div>)}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
