import { useEffect, useState } from 'react';
import { CalendarClock, ChevronLeft, ImageOff, Package, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import {
  classificationService,
  type ClassifiedItem,
  type GroupedClassifiedBatchDetail,
} from '@/services/classificationService';
import '@/styles/ops-shared.css';

const directionLabel: Record<string, string> = {
  Charity: 'Từ thiện',
  Recycling: 'Tái chế',
  Disposal: 'Tiêu hủy',
};

export default function GroupedBatchDetail() {
  const { groupId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [group, setGroup] = useState<GroupedClassifiedBatchDetail | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClassifiedItem | null>(null);

  useEffect(() => {
    if (!groupId) return;
    classificationService.getGroupedBatch(groupId).then(setGroup).catch(() => {
      toast.error('Không tải được batch nhóm.');
      nav('/classification/groups');
    });
  }, [groupId, nav, toast]);

  useEffect(() => {
    if (!selectedItem) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedItem(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedItem]);

  if (!group) return <div className="ops-page">Đang tải...</div>;

  return <div className="ops-page">
    <div className="ops-nav">
      <button className="ops-back" onClick={() => nav('/classification/groups')}><ChevronLeft size={16} /> Quay lại</button>
      <div className="ops-title-row"><h1>{group.batchCode}</h1><span className="ops-badge classified">Nhãn {group.conditionGrade}</span></div>
    </div>

    <section className="ops-panel glass">
      <span className="ops-panel-label">Khóa phân nhóm</span>
      <div className="ops-kv-grid">
        {[
          ['Ngày', new Date(group.classificationDate).toLocaleDateString('vi-VN')], ['Loại', group.clothingType],
          ['Nhóm', group.garmentGroup], ['Vải', group.fabricType], ['Giới tính', group.gender],
          ['Đối tượng', group.targetUser], ['Size', group.size],
          ['Hướng xử lý', directionLabel[group.processingDirection] || group.processingDirection], ['Tổng item', String(group.totalItem)],
        ].map(([key, value]) => <div className="ops-kv" key={key}><span>{key}</span><strong>{value}</strong></div>)}
      </div>
    </section>

    <section style={{ marginTop: 20 }}>
      <div className="ops-section-head"><h2>Item trong batch</h2><span>{group.items.length} item</span></div>
      <div className="ops-list">
        {group.items.map(item => <article
          className="ops-card ops-clickable-card"
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedItem(item)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelectedItem(item); }}
        >
          <div className="ops-card-top"><div className="ops-card-code">{item.itemCode}</div><Package size={18} /></div>
          <h3>{item.clothingType}</h3>
          <div className="ops-card-meta"><span>{item.fabricType}</span><span>{item.gender}</span><span>{item.targetUser}</span><span>Size {item.size}</span></div>
          {item.imageUrls?.[0] && <img className="ops-card-image" src={item.imageUrls[0]} alt={item.itemCode} />}
        </article>)}
      </div>
    </section>

    {selectedItem && <div className="ops-modal-overlay" onMouseDown={() => setSelectedItem(null)}>
      <section className="ops-modal glass" role="dialog" aria-modal="true" aria-labelledby="item-detail-title" onMouseDown={event => event.stopPropagation()}>
        <header className="ops-modal-header">
          <div><span className="ops-panel-label">Chi tiết item</span><h2 id="item-detail-title">{selectedItem.itemCode}</h2></div>
          <button className="ops-modal-close" type="button" aria-label="Đóng" onClick={() => setSelectedItem(null)}><X size={20} /></button>
        </header>

        {selectedItem.imageUrls?.length ? <div className="ops-modal-gallery">
          {selectedItem.imageUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>
            <img src={url} alt={`${selectedItem.itemCode} - ảnh ${index + 1}`} />
          </a>)}
        </div> : <div className="ops-no-image"><ImageOff size={28} /><span>Item chưa có hình ảnh</span></div>}

        <div className="ops-kv-grid ops-modal-details">
          {[
            ['Loại trang phục', selectedItem.clothingType], ['Nhóm', selectedItem.garmentGroup],
            ['Loại vải', selectedItem.fabricType], ['Giới tính', selectedItem.gender],
            ['Đối tượng', selectedItem.targetUser], ['Kích cỡ', selectedItem.size],
            ['Nhãn chất lượng', selectedItem.conditionGrade],
            ['Hướng xử lý', directionLabel[selectedItem.processingDirection] || selectedItem.processingDirection],
          ].map(([key, value]) => <div className="ops-kv" key={key}><span>{key}</span><strong>{value}</strong></div>)}
        </div>
        <p className="ops-modal-time"><CalendarClock size={16} /> Phân loại lúc {new Date(selectedItem.classifiedAt).toLocaleString('vi-VN')}</p>
        {selectedItem.notes && <div className="ops-modal-notes"><strong>Ghi chú</strong><p>{selectedItem.notes}</p></div>}
      </section>
    </div>}
  </div>;
}
