import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CheckCircle, ImagePlus, Pencil, Save, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  classificationService,
  type ClassificationBatchDetail,
  type ClassificationCatalog,
  type ClassifiedItem,
} from '@/services/classificationService';
import { uploadImages } from '@/utils/uploadImages';
import { getStatusLabel } from '@/utils/statusLabels';
import {
  getProcessingDirectionClass,
  getProcessingDirectionLabel,
} from '@/utils/processingDirection';
import '@/styles/ops-shared.css';

const empty = {
  fabricTypeId: '',
  garmentGroupId: '',
  clothingTypeId: '',
  genderId: '',
  targetUserId: '',
  sizeId: '',
  notes: '',
  answers: {} as Record<string, string>,
};
export default function ClassifyBatch() {
  const { batchId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [batch, setBatch] = useState<ClassificationBatchDetail | null>(null);
  const [catalog, setCatalog] = useState<ClassificationCatalog | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ClassifiedItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const load = async () => {
    if (!batchId) return;
    try {
      const [b, c] = await Promise.all([
        classificationService.getBatch(batchId),
        classificationService.getCatalog(),
      ]);
      setBatch(b);
      setCatalog(c);
    } catch {
      toast.error('Không tải được dữ liệu phân loại.');
    }
  };
  useEffect(() => {
    load();
  }, [batchId]);
  const allAnswered = useMemo(
    () => catalog?.conditionQuestions.every((q) => form.answers[q.id]) ?? false,
    [catalog, form.answers],
  );
  const set = (key: string, value: string) =>
    setForm((p) => ({
      ...p,
      [key]: value,
      ...(key === 'garmentGroupId' ? { clothingTypeId: '' } : {}),
    }));
  const selectImages = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - images.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((p) => [...p, ...selected]);
  };
  const removeImage = (index: number) =>
    setImages((p) => {
      URL.revokeObjectURL(p[index].preview);
      return p.filter((_, i) => i !== index);
    });
  const save = async () => {
    if (
      !batchId ||
      !catalog ||
      !form.fabricTypeId ||
      !form.garmentGroupId ||
      !form.clothingTypeId ||
      !form.genderId ||
      !form.targetUserId ||
      !form.sizeId ||
      !allAnswered
    ) {
      toast.error('Vui lòng trả lời đầy đủ các bước.');
      return;
    }
    if (!images.length && !existingImages.length) {
      toast.error('Vui lòng tải lên ít nhất một hình ảnh của item.');
      return;
    }
    setSaving(true);
    try {
      const uploadedImageUrls = await uploadImages(
        images.map((x) => x.file),
        'classified-items',
      );
      const payload = {
        ...form,
        imageUrls: [...existingImages, ...uploadedImageUrls],
        answers: catalog.conditionQuestions.map((q) => ({
          questionId: q.id,
          answerId: form.answers[q.id],
        })),
      };
      const item = editingItemId
        ? await classificationService.updateItem(batchId, editingItemId, payload)
        : await classificationService.classifyItem(batchId, payload);
      toast.success(
        editingItemId
          ? `Đã cập nhật ${item.itemCode}.`
          : `Đã lưu ${item.itemCode} — Loại ${item.conditionGrade}.`,
      );
      images.forEach((x) => URL.revokeObjectURL(x.preview));
      setImages([]);
      setExistingImages([]);
      setEditingItemId(null);
      setForm(empty);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể lưu kết quả.');
    } finally {
      setSaving(false);
    }
  };
  const editItem = (item: ClassifiedItem) => {
    setEditingItemId(item.id);
    setExistingImages(item.imageUrls ?? []);
    setImages([]);
    setForm({
      fabricTypeId: item.fabricTypeId ?? '',
      garmentGroupId: item.garmentGroupId ?? '',
      clothingTypeId: item.clothingTypeId ?? '',
      genderId: item.genderId ?? '',
      targetUserId: item.targetUserId ?? '',
      sizeId: item.sizeId ?? '',
      notes: item.notes ?? '',
      answers: Object.fromEntries((item.answers ?? []).map((x) => [x.questionId, x.answerId])),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => {
    images.forEach((x) => URL.revokeObjectURL(x.preview));
    setImages([]);
    setExistingImages([]);
    setEditingItemId(null);
    setForm(empty);
  };
  const deleteItem = async () => {
    if (!batchId || !pendingDeleteItem || deleting) return;
    setDeleting(true);
    try {
      await classificationService.deleteItem(batchId, pendingDeleteItem.id);
      if (editingItemId === pendingDeleteItem.id) cancelEdit();
      toast.success(`Đã xóa ${pendingDeleteItem.itemCode}. Bạn có thể phân loại lại item này.`);
      setPendingDeleteItem(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa item đã phân loại.');
    } finally {
      setDeleting(false);
    }
  };
  const complete = async () => {
    if (!batchId) return;
    try {
      await classificationService.completeBatch(batchId);
      toast.success('Đã hoàn tất và đưa batch vào khu vực đồ đã phân loại.');
      nav('/classification');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể hoàn tất batch.');
    }
  };
  if (!batch || !catalog) return <div className="ops-page">Đang tải...</div>;
  const countedItemCount = batch.countedItemCount ?? 0;
  const isClassificationComplete =
    countedItemCount > 0 && batch.items.length >= countedItemCount;
  return (
    <div className="ops-page">
      <div className="ops-nav">
        <button className="ops-back" onClick={() => nav('/classification')}>
          <ChevronLeft size={16} /> Quay lại
        </button>
        <div className="ops-title-row">
          <h1>{batch.batchCode}</h1>
          <span className="ops-badge pending">{getStatusLabel(batch.status)}</span>
        </div>
      </div>
      <div className="ops-panel glass">
        <span className="ops-panel-label">Bước 2 · Tiến hành phân loại</span>
        <h2>{batch.routeName}</h2>
        <div className="ops-kv-grid">
          <div className="ops-kv">
            <span>Kiểm đếm thực tế</span>
            <strong>{batch.countedItemCount ?? 0} món · {batch.countedTotalWeight ?? 0} kg</strong>
          </div>
          <div className="ops-kv">
            <span>Đơn quyên góp</span>
            <strong>{batch.donationRequests}</strong>
          </div>
          <div className="ops-kv">
            <span>Tiến độ phân loại</span>
            <strong>{batch.items.length}/{batch.countedItemCount ?? 0} món</strong>
          </div>
        </div>
      </div>
      {!isClassificationComplete || editingItemId ? (
      <div className="ops-form-grid two-col">
        <section className="ops-panel glass">
          <span className="ops-panel-label">Thuộc tính định danh</span>
          <div className="ops-section-head">
            <h2>{editingItemId ? 'Chỉnh sửa item đã phân loại' : `Item mới #${batch.items.length + 1}`}</h2>
            {editingItemId && (
              <button type="button" className="ops-btn ops-btn-secondary" onClick={cancelEdit}>
                <X size={16} /> Hủy chỉnh sửa
              </button>
            )}
          </div>
          {[
            ['Loại vải', 'fabricTypeId', catalog.fabricTypes],
            ['Nhóm trang phục', 'garmentGroupId', catalog.garmentGroups],
            [
              'Loại áo / quần',
              'clothingTypeId',
              catalog.clothingTypes.filter((x) => x.parentId === form.garmentGroupId),
            ],
            ['Giới tính', 'genderId', catalog.genders],
            ['Đối tượng', 'targetUserId', catalog.targetUsers],
            ['Kích cỡ', 'sizeId', catalog.sizes],
          ].map(([label, key, options]: any) => (
            <div className="ops-field" key={key}>
              <label>{label}</label>
              <select value={(form as any)[key]} onChange={(e) => set(key, e.target.value)}>
                <option value="">-- Chọn --</option>
                {options.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="ops-field">
            <label>Hình ảnh item (bắt buộc, tối đa 5 ảnh)</label>
            <label className="ops-image-picker">
              <ImagePlus size={22} />
              <span>Chụp hoặc chọn hình ảnh</span>
              <small>{images.length}/5 ảnh</small>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={images.length >= 5 || saving}
                onChange={(e) => {
                  selectImages(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            {images.length > 0 && (
              <div className="ops-image-grid">
                {images.map((image, index) => (
                  <div className="ops-image-preview" key={image.preview}>
                    <img src={image.preview} alt={`Item ${index + 1}`} />
                    <button type="button" aria-label="Xóa ảnh" onClick={() => removeImage(index)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {existingImages.length > 0 && (
              <div className="ops-image-grid">
                {existingImages.map((url) => (
                  <div className="ops-image-preview" key={url}>
                    <img src={url} alt="Ảnh item hiện tại" />
                    <button
                      type="button"
                      aria-label="Xóa ảnh"
                      onClick={() => setExistingImages((current) => current.filter((x) => x !== url))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="ops-field">
            <label>Ghi chú</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </section>
        <section className="ops-panel glass">
          <span className="ops-panel-label">Đánh giá tình trạng A / B / C</span>
          <h2>Ma trận chất lượng</h2>
          {catalog.conditionQuestions.map((q) => (
            <div className="ops-field" key={q.id}>
              <label>
                {q.displayOrder}. {q.text}
              </label>
              <div className="ops-item-list">
                {q.options.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    className={`ops-item-row ${form.answers[q.id] === o.id ? 'active' : ''}`}
                    onClick={() =>
                      setForm((p) => ({ ...p, answers: { ...p.answers, [q.id]: o.id } }))
                    }
                  >
                    <div className="ops-item-main">
                      <strong>Nhãn {o.grade}</strong>
                      <span>{o.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="ops-actions">
            <button
              className="ops-btn ops-btn-primary ops-btn-block"
              disabled={saving}
              onClick={save}
            >
              <Save size={16} />{' '}
              {saving ? 'Đang lưu...' : editingItemId ? 'Lưu thay đổi' : 'Lưu item và phân loại tự động'}
            </button>
          </div>
        </section>
      </div>
      ) : (
        <section className="ops-panel glass ops-classification-complete">
          <CheckCircle size={38} />
          <div>
            <span className="ops-panel-label">Bước 2 đã hoàn tất</span>
            <h2>Đã phân loại xong {countedItemCount}/{countedItemCount} món</h2>
            <p>
              Không còn item nào cần phân loại. Hãy kiểm tra danh sách bên dưới và hoàn tất
              batch để đưa hàng vào khu vực đồ đã phân loại.
            </p>
          </div>
          <button className="ops-btn ops-btn-primary" onClick={complete}>
            <CheckCircle size={16} /> Hoàn tất &amp; chuyển sang khu vực đồ đã phân loại
          </button>
        </section>
      )}
      <section className="ops-panel glass">
        <div className="ops-section-head">
          <h2>Đã hoàn thành phân loại</h2>
        </div>
        <div className="ops-item-list">
          {batch.items.map((i) => (
            <div className="ops-item-row" key={i.id}>
              {i.imageUrls?.[0] && (
                <img className="ops-item-thumb" src={i.imageUrls[0]} alt={i.itemCode} />
              )}
              <div className="ops-item-main">
                <strong>
                  {i.itemCode} · Loại {i.conditionGrade}
                </strong>
                <span>
                  {i.fabricType} · {i.clothingType} · {i.gender} · {i.targetUser} · {i.size}
                </span>
              </div>
              <span
                className={`ops-badge processing-${getProcessingDirectionClass(i.processingDirection)}`}
              >
                {getProcessingDirectionLabel(i.processingDirection)}
              </span>
              <div className="ops-item-actions">
                <button type="button" className="ops-icon-btn" onClick={() => editItem(i)} title="Chỉnh sửa">
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="ops-icon-btn danger"
                  onClick={() => setPendingDeleteItem(i)}
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!batch.items.length && <p>Chưa có item nào được phân loại.</p>}
        </div>
      </section>
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteItem)}
        title="Xóa kết quả phân loại"
        message={
          pendingDeleteItem
            ? `Bạn có chắc muốn xóa ${pendingDeleteItem.itemCode}?`
            : ''
        }
        confirmText="Xóa"
        cancelText="Đóng"
        tone="danger"
        isLoading={deleting}
        onConfirm={deleteItem}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </div>
  );
}
