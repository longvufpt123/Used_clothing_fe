import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  ClipboardList,
  Eye,
  Package,
  Search,
  Weight,
  X,
} from 'lucide-react';
import { warehouseService, type WarehouseTransaction } from '@/services/warehouseService';
import Pagination from '@/components/common/Pagination';
import '@/styles/ops-shared.css';

const transactionIcons: Record<string, typeof ClipboardList> = {
  RECEIPT: ArrowDownToLine,
  PUTAWAY: ArrowDownToLine,
  MOVE: ArrowRightLeft,
  OUT: ArrowUpFromLine,
};

const transactionLabels: Record<string, string> = {
  RECEIPT: 'Tiếp nhận kho',
  PUTAWAY: 'Xếp vào vị trí',
  MOVE: 'Điều chuyển',
  OUT: 'Xuất kho',
};

const PAGE_SIZE = 6;

const transactionLabel = (type: string) => transactionLabels[type.toUpperCase()] || type;

export default function WarehouseTransactions() {
  const [type, setType] = useState('');
  const [list, setList] = useState<WarehouseTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<WarehouseTransaction | null>(null);

  useEffect(() => {
    warehouseService.transactions(type || undefined).then(setList);
  }, [type]);

  useEffect(() => setPage(1), [type, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((tx) =>
      [
        tx.transactionCode,
        tx.transactionType,
        transactionLabel(tx.transactionType),
        tx.performedBy,
        tx.notes,
        ...tx.items.flatMap((item) => [
          item.sku,
          item.sourceLocationCode,
          item.destinationLocationCode,
          ...item.donationRequestCodes,
        ]),
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [list, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Nhật ký vận hành</span>
          <h1>Sổ giao dịch kho</h1>
          <p>
            Theo dõi người thực hiện, thời gian, vị trí nguồn – đích và tồn kho trước – sau của từng
            nghiệp vụ.
          </p>
        </div>
      </header>

      <div className="ops-tabs">
        {['', 'RECEIPT', 'PUTAWAY', 'MOVE', 'OUT'].map((value) => (
          <button
            className={`ops-tab ${type === value ? 'active' : ''}`}
            key={value}
            onClick={() => setType(value)}
          >
            {value ? transactionLabel(value) : 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="ops-list-toolbar">
        <label className="ops-list-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã giao dịch, SKU, nhân viên hoặc vị trí..."
          />
        </label>
        <span className="ops-list-result">
          {filtered.length} giao dịch · {PAGE_SIZE} giao dịch/trang
        </span>
      </div>

      <div className="ops-list ops-transaction-list">
        {shown.map((tx) => {
          const Icon = transactionIcons[tx.transactionType] || ClipboardList;
          const totalQuantity = tx.items.reduce(
            (sum, item) => sum + Math.abs(item.quantity || 0),
            0,
          );
          const totalWeight = tx.items.reduce((sum, item) => sum + Math.abs(item.weightKg || 0), 0);
          return (
            <article
              className="ops-card ops-transaction-card"
              key={tx.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(tx)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelected(tx);
              }}
            >
              <div className="ops-card-top">
                <div className="ops-transaction-heading">
                  <div className="ops-card-code">{tx.transactionCode}</div>
                  <div className="ops-card-meta">
                    <span>{new Date(tx.performedAt).toLocaleString('vi-VN')}</span>
                    <span>{tx.performedBy}</span>
                  </div>
                </div>
                <span className="ops-badge done">
                  <Icon size={14} />
                  {transactionLabel(tx.transactionType)}
                </span>
              </div>

              <div className="ops-transaction-summary">
                <div>
                  <Package size={18} />
                  <span>Dòng hàng</span>
                  <strong>{tx.items.length}</strong>
                </div>
                <div>
                  <ClipboardList size={18} />
                  <span>Số lượng</span>
                  <strong>{totalQuantity}</strong>
                </div>
                <div>
                  <Weight size={18} />
                  <span>Khối lượng</span>
                  <strong>{totalWeight.toLocaleString('vi-VN')} kg</strong>
                </div>
              </div>

              {tx.notes && <p className="ops-transaction-note">{tx.notes}</p>}
              <div className="ops-card-footer">
                <span>Xem biến động tồn kho</span>
                <strong className="ops-card-action">
                  Chi tiết <Eye size={16} />
                </strong>
              </div>
            </article>
          );
        })}

        {!filtered.length && (
          <div className="ops-empty">
            <ClipboardList size={36} />
            <h4>Không có giao dịch phù hợp</h4>
          </div>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="ops-list-pagination">
          <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
        </div>
      )}

      {selected && (
        <div
          className="ops-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="ops-modal ops-transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
          >
            <div className="ops-modal-header">
              <div>
                <span className="ops-pagehead-kicker">Chi tiết giao dịch</span>
                <h2 id="transaction-detail-title">{selected.transactionCode}</h2>
                <div className="ops-card-meta">
                  <span>{new Date(selected.performedAt).toLocaleString('vi-VN')}</span>
                  <span>{selected.performedBy}</span>
                </div>
              </div>
              <button
                className="ops-modal-close"
                type="button"
                aria-label="Đóng"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <span className="ops-badge done ops-transaction-modal-badge">
              {transactionLabel(selected.transactionType)}
            </span>

            <div className="ops-transaction-lines">
              {selected.items.map((item, index) => (
                <article className="ops-transaction-line" key={item.id}>
                  <div className="ops-transaction-line-head">
                    <span>Dòng hàng {index + 1}</span>
                    <strong>{item.sku}</strong>
                  </div>
                  <div className="ops-kv-grid">
                    <div className="ops-kv">
                      <span>Số lượng</span>
                      <strong>
                        {item.quantityBefore} → {item.quantityAfter}
                      </strong>
                    </div>
                    <div className="ops-kv">
                      <span>Khối lượng</span>
                      <strong>
                        {item.weightBefore} → {item.weightAfter} kg
                      </strong>
                    </div>
                    <div className="ops-kv ops-transaction-location">
                      <span>Vị trí nguồn</span>
                      <strong>{item.sourceLocationCode || 'Khu tiếp nhận'}</strong>
                    </div>
                    <div className="ops-kv ops-transaction-location">
                      <span>Vị trí đích</span>
                      <strong>{item.destinationLocationCode || 'Khu xuất kho'}</strong>
                    </div>
                  </div>
                  {item.donationRequestCodes.length > 0 && (
                    <div className="ops-provenance">
                      <strong>Nguồn đơn quyên góp</strong>
                      <div>
                        {item.donationRequestCodes.map((code) => (
                          <span key={code}>{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.notes && <p className="ops-transaction-line-note">{item.notes}</p>}
                </article>
              ))}
            </div>

            {selected.notes && (
              <div className="ops-modal-notes">
                <strong>Ghi chú giao dịch</strong>
                <p>{selected.notes}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
