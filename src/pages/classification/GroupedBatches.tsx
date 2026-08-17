import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Boxes, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Layers3, Package, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { classificationService, type ClassificationAreaLayout, type GroupedClassifiedBatch } from '@/services/classificationService';
import { getProcessingDirectionLabel } from '@/utils/processingDirection';
import '@/styles/ops-shared.css';
import '@/pages/warehouse/WarehouseAreas.css';

const localDateValue = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function GroupedBatches({ view = 'open' }: { view?: 'open' | 'sent' }) {
  const [date, setDate] = useState(localDateValue);
  const [groups, setGroups] = useState<GroupedClassifiedBatch[]>([]);
  const [layout, setLayout] = useState<ClassificationAreaLayout | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate(); const toast = useToast();
  const loadGroups = async () => { setLoading(true); try {
    const [batchData, layoutData] = await Promise.all([classificationService.getGroupedBatches(date), view === 'open' ? classificationService.getClassifiedAreaLayout(date) : Promise.resolve(null)]);
    setGroups(batchData); setLayout(layoutData);
    if (layoutData) setExpanded((x) => Object.keys(x).length ? x : Object.fromEntries(layoutData.areas.map((a, i) => [a.id, i === 0])));
  } catch { toast.error('Không tải được dữ liệu khu vực phân loại.'); } finally { setLoading(false); } };
  useEffect(() => { void loadGroups(); }, [date, view]);
  const openGroups = useMemo(() => groups.filter((x) => x.status === 'Open' && x.placedInClassificationAreaAt), [groups]);
  const sentGroups = useMemo(() => groups.filter((x) => x.status !== 'Open'), [groups]);
  const visible = view === 'open' ? openGroups : sentGroups;
  const sendAll = async () => { if (!openGroups.length) return; setSending(true); try { const r = await classificationService.sendGroupedBatchesToWarehouse(openGroups.map((x) => x.id)); toast.success(`Đã gửi ${r.sent} Classified Batch sang kho.`); setConfirming(false); await loadGroups(); } catch (e: any) { toast.error(e?.response?.data?.message || 'Không thể gửi batch sang kho.'); } finally { setSending(false); } };
  const card = (g: GroupedClassifiedBatch) => { const sent = g.status !== 'Open'; return <article key={g.id} className="ops-card" role="button" tabIndex={0} onClick={() => navigate(`/classification/groups/${g.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/classification/groups/${g.id}`)}>
    <div className="ops-card-top"><div className="ops-card-code">{g.batchCode}</div><span className={`ops-badge ${sent ? 'stored' : g.conditionGrade === 'A' ? 'done' : g.conditionGrade === 'B' ? 'pending' : 'classified'}`}>{sent ? <><CheckCircle2 size={13} /> Đã gửi kho</> : `Nhãn ${g.conditionGrade}`}</span></div>
    <h3>{g.clothingType} · {g.fabricType}</h3><div className="ops-card-meta"><span>{g.gender}</span><span>{g.targetUser}</span><span>Size {g.size}</span><span>{getProcessingDirectionLabel(g.processingDirection)}</span></div>
    <div className="ops-card-footer"><span><strong>{g.totalItem}</strong> item</span><span className="ops-card-action">Xem chi tiết <ArrowRight size={14} /></span></div></article>; };
  return <div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">{view === 'open' ? 'Bước 3 · Khu vực đồ đã phân loại' : 'Lịch sử bàn giao kho'}</span><h1>{view === 'open' ? 'Đồ đã phân loại chờ gửi kho' : 'Classified Batch đã gửi sang kho'}</h1><p>{view === 'open' ? 'Theo dõi Classified Batch theo từng khu vực và dãy chứa trước khi bàn giao kho.' : 'Theo dõi các batch đã bàn giao sang bộ phận kho.'}</p></div></header>
    <section className="ops-panel glass"><div className="ops-field"><label htmlFor="groupDate">Ngày phân loại</label><input id="groupDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div></section>
    <div className="ops-stats"><div className="ops-stat-card"><span className="ops-stat-label">Số batch nhóm</span><div className="ops-stat-value"><Boxes size={18} />{visible.length}</div></div><div className="ops-stat-card"><span className="ops-stat-label">Tổng item</span><div className="ops-stat-value"><Package size={18} />{visible.reduce((n, x) => n + x.totalItem, 0)}</div></div><div className="ops-stat-card"><span className="ops-stat-label">Ngày</span><div className="ops-stat-value"><CalendarDays size={18} />{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')}</div></div></div>
    <section><div className="ops-section-head"><div><h2>{view === 'open' ? `Sơ đồ khu vực · ${layout?.warehouseName || ''}` : 'Danh sách đã gửi kho'}</h2><span>{loading ? 'Đang tải...' : `${visible.length} batch`}</span></div>{view === 'open' && <button type="button" className="ops-btn ops-btn-primary" disabled={loading || sending || !openGroups.length} onClick={() => setConfirming(true)}><Send size={16} />Gửi tất cả sang kho ({openGroups.length})</button>}</div>
      {view === 'open' && layout ? <div className="warehouse-area-list classification-area-layout">{layout.areas.map((area) => { const open = expanded[area.id], count = area.groups.reduce((n, g) => n + g.batches.length, 0); return <article className="warehouse-area" key={area.id}>
        <button type="button" className="warehouse-area-head" onClick={() => setExpanded((x) => ({ ...x, [area.id]: !open }))}><span className="warehouse-area-icon"><Layers3 /></span><span className="warehouse-area-title"><b>{area.areaName}</b><small>{area.description || 'Khu vực đồ đã phân loại'}</small></span><span className="warehouse-area-cap"><b>{count} batch</b><small>{area.currentKg.toFixed(1)} / {area.capacityKg.toFixed(1)} kg</small></span>{open ? <ChevronDown /> : <ChevronRight />}</button>
        <div className="warehouse-cap-track"><span style={{ width: `${area.capacityKg ? Math.min(100, area.currentKg / area.capacityKg * 100) : 0}%` }} /></div>{open && <div className="warehouse-area-body classification-area-body">{area.groups.map((aisle) => <section className="classification-aisle" key={aisle.id}><div className="classification-aisle-head"><div><strong>{aisle.groupName}</strong><small>{aisle.description || 'Dãy chứa Classified Batch'}</small></div><span>{aisle.batches.length} batch · {aisle.currentKg.toFixed(1)}/{aisle.capacityKg.toFixed(1)} kg · {aisle.locations.length} vị trí</span></div><div className="warehouse-location-grid">{aisle.locations.map((location) => <div className={`warehouse-location ${location.status.toLowerCase()}`} key={location.id}><div><b>{location.locationCode}</b><span>{location.status}</span></div><p>Hàng {location.aisleCode} · Kệ {location.rackCode} · Tầng {location.shelfCode} · Ô {location.binCode}</p><div className="warehouse-location-meter"><span style={{ width: `${location.capacityKg ? Math.min(100, location.currentWeightKg / location.capacityKg * 100) : 0}%` }} /></div><small>{location.currentWeightKg.toFixed(1)}/{location.capacityKg.toFixed(1)} kg</small></div>)}</div><div className="ops-list">{aisle.batches.map(card)}{!aisle.batches.length && <div className="classification-aisle-empty">Dãy hiện đang trống</div>}</div></section>)}{!area.groups.length && <div className="ops-empty"><Boxes size={30} /><p>Manager chưa cấu hình dãy cho khu vực này.</p></div>}</div>}
      </article>; })}{!!layout.unassignedBatches.length && <article className="classification-unassigned"><h3>Chưa xác định dãy</h3><p>Các batch cũ chưa có thông tin vị trí.</p><div className="ops-list">{layout.unassignedBatches.map(card)}</div></article>}{!layout.areas.length && <div className="ops-empty"><Layers3 size={36} /><h4>Chưa có khu đồ đã phân loại</h4><p>Manager cần cấu hình khu vực Classified và các dãy chứa.</p></div>}</div> : <div className="ops-list">{sentGroups.map(card)}{!loading && !sentGroups.length && <div className="ops-empty"><Boxes size={36} /><h4>Chưa có batch nào đã gửi kho trong ngày này</h4></div>}</div>}
    </section><ConfirmDialog isOpen={confirming} title="Gửi tất cả Classified Batch sang kho?" message={`Hệ thống sẽ gửi ${openGroups.length} batch sang bộ phận kho.`} confirmText={`Gửi ${openGroups.length} batch`} cancelText="Hủy" tone="info" isLoading={sending} onConfirm={sendAll} onCancel={() => setConfirming(false)} />
  </div>;
}
