import { useEffect, useState } from 'react';
import { Archive, ArrowRight, Boxes, PackageCheck, Search, Warehouse } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import {
  warehouseService,
  type WarehouseBatch,
  type WarehouseDashboard as DashboardData,
} from '@/services/warehouseService';
import Pagination from '@/components/common/Pagination';
import '@/styles/ops-shared.css';
import { getStatusLabel } from '@/utils/statusLabels';
import { getClassifiedBatchGroupLabel } from '@/utils/classifiedBatch';

type Tab = 'inbound' | 'putaway' | 'stored';
const labels: Record<string, string> = {
  PendingWarehouseReceipt: 'Chờ xác nhận nhận',
  WarehouseReceived: 'Chờ xếp vị trí',
  Stored: 'Đã lưu kho',
};

export default function WarehouseDashboard() {
  const nav = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'inbound';
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [batches, setBatches] = useState<WarehouseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const load = async () => {
    try {
      const [dashboard, list] = await Promise.all([
        warehouseService.dashboard(),
        warehouseService.inboundBatches(),
      ]);
      setStats(dashboard);
      setBatches(list);
    } catch {
      toast.error('Không tải được dữ liệu vận hành kho.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, []);
  const normalized = search.trim().toLowerCase();
  const shown = batches.filter(
    (batch) =>
      (tab === 'inbound'
        ? batch.status === 'PendingWarehouseReceipt'
        : tab === 'putaway'
          ? batch.status === 'WarehouseReceived'
          : batch.status === 'Stored') &&
      (!normalized ||
        [
          batch.batchCode,
          batch.clothingType,
          batch.fabricType,
          batch.conditionGrade,
          batch.processingDirection,
          batch.gender,
          batch.targetUser,
          batch.size,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(normalized),
        )),
  );
  const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
  const paged = shown.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [tab, search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const open = (batch: WarehouseBatch) =>
    nav(
      batch.status === 'PendingWarehouseReceipt'
        ? `/warehouse/receive/${batch.id}`
        : batch.status === 'WarehouseReceived'
          ? `/warehouse/storage/${batch.id}`
          : `/warehouse/inventory?batch=${batch.id}`,
    );
  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Warehouse Control Center</span>
          <h1>Điều hành nhập–xuất–tồn kho</h1>
          <p>
            Đối chiếu bàn giao, xếp vị trí có kiểm soát sức chứa và theo dõi đầy đủ audit trail của
            từng batch.
          </p>
        </div>
      </header>
      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Chờ nhận</span>
          <div className="ops-stat-value">
            <PackageCheck size={18} />
            {stats?.pendingReceipt || 0}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Chờ xếp vị trí</span>
          <div className="ops-stat-value">
            <Archive size={18} />
            {stats?.awaitingPutaway || 0}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tồn khả dụng</span>
          <div className="ops-stat-value">
            <Boxes size={18} />
            {stats?.availableQuantity || 0}
          </div>
          <span className="ops-stat-foot">{stats?.availableWeightKg || 0} kg</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Sử dụng sức chứa</span>
          <div className="ops-stat-value">{stats?.capacityUsedPercent || 0}%</div>
          <span className="ops-stat-foot">
            {(stats?.currentWeightKg || 0).toFixed(1)} / {(stats?.capacityKg || 0).toFixed(1)} kg
          </span>
          <div
            className="ops-capacity-progress"
            role="progressbar"
            aria-label="Mức sử dụng sức chứa kho"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats?.capacityUsedPercent || 0}
          >
            <span style={{ width: `${Math.min(100, stats?.capacityUsedPercent || 0)}%` }} />
          </div>
        </div>
      </div>
      <section>
        <div className="ops-section-head">
          <h2>Luồng Classified Batch</h2>
          <span>{loading ? 'Đang đồng bộ...' : 'Dữ liệu trực tiếp từ hệ thống'}</span>
        </div>
        <div className="ops-tabs">
          {[
            ['inbound', 'Chờ nhập kho', stats?.pendingReceipt],
            ['putaway', 'Chờ xếp vị trí', stats?.awaitingPutaway],
            ['stored', 'Đã lưu kho', stats?.storedBatches],
          ].map(([key, label, count]) => (
            <button
              key={String(key)}
              className={`ops-tab ${tab === key ? 'active' : ''}`}
              onClick={() => setParams({ tab: String(key) })}
            >
              {label}
              <span className="ops-tab-count">{count || 0}</span>
            </button>
          ))}
        </div>
        <div className="ops-list-toolbar">
          <label className="ops-list-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã batch, loại đồ, loại vải, nhãn..."
            />
          </label>
          <span className="ops-list-result">{shown.length} kết quả · 6 item/trang</span>
        </div>
        <div className="ops-list">
          {paged.map((batch) => (
            <article
              className="ops-card"
              key={batch.id}
              role="button"
              tabIndex={0}
              onClick={() => open(batch)}
              onKeyDown={(e) => e.key === 'Enter' && open(batch)}
            >
              <div className="ops-card-top">
                <div>
                  <div className="ops-card-code">{batch.batchCode}</div>
                  <div className="ops-card-meta">
                    <span>{new Date(batch.classificationDate).toLocaleDateString('vi-VN')}</span>
                    <span>Nhãn {batch.conditionGrade}</span>
                    <span>{batch.processingDirection}</span>
                  </div>
                </div>
                <span className={`ops-badge ${batch.status === 'Stored' ? 'done' : 'pending'}`}>
                  {labels[batch.status] || getStatusLabel(batch.status)}
                </span>
              </div>
              <h3>{getClassifiedBatchGroupLabel(batch)}</h3>
              <div className="ops-card-meta">
                <span>{batch.expectedItemCount} item</span>
              </div>
              <div className="ops-card-footer">
                <span>
                  <strong>{batch.receivedItemCount ?? batch.expectedItemCount}</strong> item ·{' '}
                  <strong>{batch.receivedWeightKg ?? batch.expectedWeightKg}</strong> kg
                </span>
                <span className="ops-card-action">
                  Chi tiết <ArrowRight size={14} />
                </span>
              </div>
            </article>
          ))}
          {!loading && !shown.length && (
            <div className="ops-empty">
              <Warehouse size={36} />
              <h4>Không có batch phù hợp</h4>
              <p>Thử thay đổi từ khóa hoặc chọn hàng đợi khác.</p>
            </div>
          )}
        </div>
        {shown.length > pageSize && (
          <div className="ops-list-pagination">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>
    </div>
  );
}
