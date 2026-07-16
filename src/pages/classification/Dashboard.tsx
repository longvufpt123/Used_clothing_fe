import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  ClipboardList,
  CheckCircle,
  Package,
  Calendar,
  ArrowRight,
  Scale,
} from 'lucide-react';
import {
  getClassificationBatches,
  type ClassificationBatch,
} from '@/utils/classificationMockDb';
import '@/styles/ops-shared.css';

type TabKey = 'pending_confirm' | 'pending' | 'classified' | 'sent';

const statusLabel = (s: ClassificationBatch['status']) => {
  if (s === 'PendingConfirmation') return 'Chờ nhận';
  if (s === 'PendingClassification') return 'Chờ phân loại';
  if (s === 'Classified') return 'Đã phân loại';
  return 'Đã bàn giao kho';
};

const isTab = (v: string | null): v is TabKey =>
  v === 'pending_confirm' || v === 'pending' || v === 'classified' || v === 'sent';

export const ClassificationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [batches, setBatches] = useState<ClassificationBatch[]>([]);

  const tabParam = searchParams.get('tab');
  const tab: TabKey = isTab(tabParam) ? tabParam : 'pending_confirm';
  const setTab = (t: TabKey) =>
    setSearchParams(t === 'pending_confirm' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    setBatches(getClassificationBatches());
  }, []);

  const pendingConfirm = batches.filter((b) => b.status === 'PendingConfirmation');
  const pending = batches.filter((b) => b.status === 'PendingClassification');
  const classified = batches.filter((b) => b.status === 'Classified');
  const sent = batches.filter((b) => b.status === 'SendingToWarehouse');

  const filtered =
    tab === 'pending_confirm'
      ? pendingConfirm
      : tab === 'pending'
      ? pending
      : tab === 'classified'
      ? classified
      : sent;

  const totalWeight = batches.reduce((s, b) => s + b.totalWeightKg, 0);
  const doneItems = batches.reduce(
    (s, b) => s + b.items.filter((i) => i.status === 'done').length,
    0
  );
  const totalItems = batches.reduce((s, b) => s + b.items.length, 0);

  const openBatch = (batch: ClassificationBatch) => {
    if (batch.status === 'PendingConfirmation') {
      navigate(`/classification/confirm/${batch.id}`);
    } else if (batch.status === 'PendingClassification') {
      navigate(`/classification/classify/${batch.id}`);
    } else if (batch.status === 'Classified') {
      navigate(`/classification/handoff/${batch.id}`);
    }
  };

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Bộ phận Phân loại</span>
          <h1>Bàn phân loại vật phẩm</h1>
          <p>
            Mở kiện, đếm chi tiết vật phẩm, tách phần từ thiện và tái chế, rồi bàn giao
            lô hoàn chỉnh sang kho.
          </p>
        </div>
      </header>

      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Chờ phân loại</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Package size={18} strokeWidth={2} /></span>
            {pending.length}
          </div>
          <span className="ops-stat-foot">lô mới từ tiếp nhận</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Đã xong</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><CheckCircle size={18} strokeWidth={2} /></span>
            {classified.length}
          </div>
          <span className="ops-stat-foot">chờ bàn giao kho</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Khối lượng lô</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Scale size={18} strokeWidth={2} /></span>
            {totalWeight.toFixed(1)}
          </div>
          <span className="ops-stat-foot">kg đang xử lý</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tiến độ kiện</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><ClipboardList size={18} strokeWidth={2} /></span>
            {doneItems}/{totalItems}
          </div>
          <span className="ops-stat-foot">kiện đã đếm xong</span>
        </div>
      </div>

      <section>
        <div className="ops-section-head">
          <h2>Danh sách lô hàng</h2>
          <span>Lọc theo trạng thái xử lý</span>
        </div>

        <div className="ops-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending_confirm'}
            className={`ops-tab ${tab === 'pending_confirm' ? 'active' : ''}`}
            onClick={() => setTab('pending_confirm')}
          >
            <Layers size={15} strokeWidth={2} />
            Chờ xác nhận
            <span className="ops-tab-count">{pendingConfirm.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            className={`ops-tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            <ClipboardList size={15} strokeWidth={2} />
            Chờ phân loại
            <span className="ops-tab-count">{pending.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'classified'}
            className={`ops-tab ${tab === 'classified' ? 'active' : ''}`}
            onClick={() => setTab('classified')}
          >
            <CheckCircle size={15} strokeWidth={2} />
            Đã phân loại xong
            <span className="ops-tab-count">{classified.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sent'}
            className={`ops-tab ${tab === 'sent' ? 'active' : ''}`}
            onClick={() => setTab('sent')}
          >
            <Package size={15} strokeWidth={2} />
            Đã bàn giao
            <span className="ops-tab-count">{sent.length}</span>
          </button>
        </div>

        <div className="ops-list">
          {filtered.length === 0 ? (
            <div className="ops-empty">
              <ClipboardList size={36} strokeWidth={1.5} />
              <h4>Không có lô ở mục này</h4>
              <p>Khi có lô mới từ tiếp nhận, chúng sẽ hiện ở mục Chờ phân loại.</p>
            </div>
          ) : (
            filtered.map((batch) => {
              const done = batch.items.filter((i) => i.status === 'done').length;
              const total = batch.items.length;
              return (
                <article
                  key={batch.id}
                  className="ops-card"
                  onClick={() => openBatch(batch)}
                  onKeyDown={(e) => e.key === 'Enter' && openBatch(batch)}
                  role={batch.status === 'SendingToWarehouse' ? 'article' : 'button'}
                  tabIndex={batch.status === 'SendingToWarehouse' ? -1 : 0}
                  style={
                    batch.status === 'SendingToWarehouse'
                      ? { cursor: 'default' }
                      : undefined
                  }
                >
                  <div className="ops-card-top">
                    <div>
                      <div className="ops-card-code">{batch.code}</div>
                      <div className="ops-card-meta">
                        <span>
                          <Calendar size={12} strokeWidth={2} /> {batch.receivedDate}
                        </span>
                        <span>
                          <Scale size={12} strokeWidth={2} /> {batch.totalWeightKg} kg
                        </span>
                      </div>
                    </div>
                    <span className={`ops-badge ${batch.status.toLowerCase()}`}>
                      {statusLabel(batch.status)}
                    </span>
                  </div>
                  <h3>{batch.sourceRoute}</h3>
                  <div className="ops-card-footer">
                    <span>
                      Kiện đã xử lý:{' '}
                      <strong>
                        {done}/{total}
                      </strong>
                    </span>
                    {batch.status !== 'SendingToWarehouse' && (
                      <span className="ops-card-action">
                        {batch.status === 'PendingConfirmation'
                          ? 'Xác nhận nhận'
                          : batch.status === 'PendingClassification'
                          ? 'Phân loại'
                          : 'Bàn giao kho'}
                        <ArrowRight size={14} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassificationDashboard;
