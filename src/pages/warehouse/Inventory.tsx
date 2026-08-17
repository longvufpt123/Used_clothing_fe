import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Boxes, Search, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import {
  warehouseService,
  type StorageLocation,
  type WarehouseInventory,
} from '@/services/warehouseService';
import Pagination from '@/components/common/Pagination';
import { getStatusLabel } from '@/utils/statusLabels';
import '@/styles/ops-shared.css';

export default function WarehouseInventoryPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<WarehouseInventory[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [selected, setSelected] = useState<WarehouseInventory | null>(null);
  const [mode, setMode] = useState<'issue' | 'move' | null>(null);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [form, setForm] = useState({
    quantity: 1,
    weightKg: 1,
    reason: 'Phân phối từ thiện',
    notes: '',
    destinationLocationId: '',
  });
  const load = () =>
    warehouseService
      .inventory()
      .then(setItems)
      .catch(() => toast.error('Không tải được tồn kho.'));
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return !q
      ? items
      : items.filter((item) =>
          [
            item.sku,
            item.batchCode,
            item.locationCode,
            item.areaName,
            item.clothingType,
            item.fabricType,
            item.conditionGrade,
            item.gender,
            item.targetUser,
            item.size,
            item.processingDirection,
            item.status,
            ...item.donationRequestCodes,
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(q),
          ),
        );
  }, [items, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const open = async (item: WarehouseInventory, next: 'issue' | 'move') => {
    setSelected(item);
    setMode(next);
    setForm((f) => ({
      ...f,
      quantity: Math.min(1, item.availableQuantity),
      weightKg: Math.min(1, item.availableWeightKg),
    }));
    if (next === 'move') {
      const l = await warehouseService.locations(item.classifiedBatchId);
      setLocations(l.filter((x) => x.locationCode !== item.locationCode));
      setForm((f) => ({
        ...f,
        destinationLocationId: l.find((x) => x.locationCode !== item.locationCode)?.id || '',
      }));
    }
  };
  const submit = async () => {
    if (!selected || !mode) return;
    try {
      if (mode === 'issue')
        await warehouseService.issue(selected.id, {
          quantity: form.quantity,
          weightKg: form.weightKg,
          reason: form.reason,
          notes: form.notes,
        });
      else
        await warehouseService.move(selected.id, {
          destinationLocationId: form.destinationLocationId,
          reason: form.reason,
          notes: form.notes,
        });
      toast.success(
        mode === 'issue'
          ? 'Đã xuất kho và ghi transaction OUT.'
          : 'Đã điều chuyển và ghi transaction MOVE.',
      );
      setMode(null);
      setSelected(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thực hiện được nghiệp vụ.');
    }
  };
  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Stock Ledger</span>
          <h1>Tồn kho theo SKU và vị trí</h1>
          <p>Tồn khả dụng đã trừ phần giữ chỗ; mỗi SKU truy ngược được Classified Batch nguồn.</p>
        </div>
      </header>
      <section className="ops-panel glass">
        <div className="ops-list-toolbar">
          <label className="ops-list-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm SKU, batch, loại hàng hoặc mã vị trí..."
            />
          </label>
          <span className="ops-list-result">{filtered.length} kết quả · 6 item/trang</span>
        </div>
      </section>
      <div className="ops-list" style={{ marginTop: 20 }}>
        {paged.map((item) => (
          <article className="ops-card ops-inventory-card" key={item.id}>
            <div className="ops-card-top">
              <div>
                <div className="ops-card-code">{item.sku}</div>
                <div className="ops-card-meta">
                  <span>{item.locationCode}</span>
                  <span>{item.areaName}</span>
                  <span>Nhãn {item.conditionGrade}</span>
                </div>
              </div>
              <span className={`ops-badge ${item.status === 'Available' ? 'done' : 'pending'}`}>
                {item.reservedQuantity >= item.quantity && item.quantity > 0
                  ? 'Đã giữ chỗ'
                  : getStatusLabel(item.status)}
              </span>
            </div>
            <h3>
              {item.clothingType} · {item.fabricType}
            </h3>
            <div className="ops-kv-grid">
              <div className="ops-kv">
                <span>Tổng tồn</span>
                <strong>{item.quantity} item</strong>
              </div>
              <div className="ops-kv">
                <span>Tổng khối lượng</span>
                <strong>{item.totalWeightKg} kg</strong>
              </div>
              <div className="ops-kv">
                <span>Đã giữ chỗ</span>
                <strong>{item.reservedQuantity} item</strong>
              </div>
              <div className="ops-kv">
                <span>Khối lượng giữ chỗ</span>
                <strong>{item.reservedWeightKg} kg</strong>
              </div>
              <div className="ops-kv">
                <span>Khả dụng</span>
                <strong>{item.availableQuantity} item</strong>
              </div>
              <div className="ops-kv">
                <span>Khối lượng khả dụng</span>
                <strong>{item.availableWeightKg} kg</strong>
              </div>
              <div className="ops-kv">
                <span>Batch nguồn</span>
                <strong>{item.batchCode}</strong>
              </div>
              <div className="ops-kv">
                <span>Phân loại</span>
                <strong>
                  {item.gender} · {item.targetUser} · {item.size}
                </strong>
              </div>
            </div>
            <div className="ops-actions">
              <button
                className="ops-btn ops-btn-secondary"
                disabled={item.status !== 'Available'}
                onClick={() => open(item, 'move')}
              >
                <ArrowRightLeft size={15} />
                Điều chuyển
              </button>
              {item.reservedQuantity > 0 && (
                <button
                  className="ops-btn ops-btn-primary"
                  onClick={() => navigate('/warehouse/distributions')}
                >
                  <Send size={15} />
                  Xuất kho
                </button>
              )}
            </div>
          </article>
        ))}
        {!filtered.length && (
          <div className="ops-empty">
            <Boxes size={36} />
            <h4>Không có tồn kho phù hợp</h4>
          </div>
        )}
      </div>
      {filtered.length > pageSize && (
        <div className="ops-list-pagination">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      {selected && mode && (
        <div className="ops-modal-overlay" onMouseDown={() => setMode(null)}>
          <section className="ops-modal glass" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{mode === 'issue' ? 'Phiếu xuất kho' : 'Phiếu điều chuyển nội bộ'}</h2>
            <p>
              {selected.sku} · {selected.locationCode}
            </p>
            {mode === 'issue' ? (
              <>
                <div className="ops-field">
                  <label>Số lượng xuất</label>
                  <input
                    type="number"
                    min={1}
                    max={selected.availableQuantity}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="ops-field">
                  <label>Khối lượng xuất (kg)</label>
                  <input
                    type="number"
                    min=".01"
                    max={selected.availableWeightKg}
                    step=".01"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                  />
                </div>
              </>
            ) : (
              <div className="ops-field">
                <label>Vị trí đích</label>
                <select
                  value={form.destinationLocationId}
                  onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })}
                >
                  {locations.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.locationCode} · còn {l.availableCapacityKg}kg
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="ops-field">
              <label>Lý do nghiệp vụ</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <div className="ops-field">
              <label>Ghi chú</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button className="ops-btn ops-btn-primary ops-btn-block" onClick={submit}>
              Xác nhận và ghi sổ
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
