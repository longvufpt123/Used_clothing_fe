import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

type TabKey = 'pending' | 'classified' | 'sent';

const statusLabel = (s: ClassificationBatch['status']) => {
  if (s === 'PendingClassification') return 'Chờ phân loại';
  if (s === 'Classified') return 'Đã phân loại';
  return 'Đã bàn giao kho';
};

export const ClassificationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ClassificationBatch[]>([]);
  const [tab, setTab] = useState<TabKey>('pending');

  useEffect(() => {
    setBatches(getClassificationBatches());
  }, []);

  const pending = batches.filter((b) => b.status === 'PendingClassification');
  const classified = batches.filter((b) => b.status === 'Classified');
  const sent = batches.filter((b) => b.status === 'SendingToWarehouse');

  const filtered =
    tab === 'pending' ? pending : tab === 'classified' ? classified : sent;

  const totalWeight = batches.reduce((s, b) => s + b.totalWeightKg, 0);
  const doneItems = batches.reduce(
    (s, b) => s + b.items.filter((i) => i.status === 'done').length,
    0
  );
  const totalItems = batches.reduce((s, b) => s + b.items.length, 0);

  const openBatch = (batch: ClassificationBatch) => {
    if (batch.status === 'PendingClassification') {
      navigate(`/classification/classify/${batch.id}`);
    } else if (batch.status === 'Classified') {
      navigate(`/classification/handoff/${batch.id}`);
    }
  };

  return (
    <div className="ops-page">
      <section className="ops-hero glass">
        <span className="ops-hero-kicker">Bộ phận Phân loại</span>
        <h1 className="text-gradient">Dashboard Phân loại</h1>
        <p>
          Mở kiện, đếm chi tiết vật phẩm, tách từ thiện / tái chế, rồi bàn giao
          lô sang kho.
        </p>
      </section>

      <div className="ops-stats">
        <div className="ops-stat-card glass">
          <span className="ops-stat-label">Chờ phân loại</span>
          <div className="ops-stat-value">
            <Package size={18} strokeWidth={1.75} />
            {pending.length}
          </div>
        </div>
        <div className="ops-stat-card glass">
          <span className="ops-stat-label">Đã xong</span>
          <div className="ops-stat-value">
            <CheckCircle size={18} strokeWidth={1.75} />
            {classified.length}
          </div>
        </div>
        <div className="ops-stat-card glass">
          <span className="ops-stat-label">Khối lượng lô</span>
          <div className="ops-stat-value">
            <Scale size={18} strokeWidth={1.75} />
            {totalWeight.toFixed(1)} kg
          </div>
        </div>
        <div className="ops-stat-card glass">
          <span className="ops-stat-label">Tiến độ kiện</span>
          <div className="ops-stat-value">
            <ClipboardList size={18} strokeWidth={1.75} />
            {doneItems}/{totalItems}
          </div>
        </div>
      </div>

      <section>
        <div className="ops-section-head">
          <h2>Danh sách lô hàng</h2>
          <span>Chọn tab theo trạng thái xử lý</span>
        </div>

        <div className="ops-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            className={`ops-tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            <Layers size={14} strokeWidth={1.75} />
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
            <CheckCircle size={14} strokeWidth={1.75} />
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
            <Package size={14} strokeWidth={1.75} />
            Đã bàn giao
            <span className="ops-tab-count">{sent.length}</span>
          </button>
        </div>

        <div className="ops-list">
          {filtered.length === 0 ? (
            <div className="ops-empty glass">
              <ClipboardList size={36} />
              <h4>Không có lô ở tab này</h4>
              <p>Khi có lô mới từ tiếp nhận, chúng sẽ hiện ở tab Chờ phân loại.</p>
            </div>
          ) : (
            filtered.map((batch) => {
              const done = batch.items.filter((i) => i.status === 'done').length;
              const total = batch.items.length;
              return (
                <article
                  key={batch.id}
                  className="ops-card glass"
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
                          <Calendar size={12} strokeWidth={1.75} /> {batch.receivedDate}
                        </span>
                        <span>
                          <Scale size={12} strokeWidth={1.75} /> {batch.totalWeightKg} kg
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
                        {batch.status === 'PendingClassification'
                          ? 'Phân loại'
                          : 'Bàn giao kho'}
                        <ArrowRight size={14} strokeWidth={1.75} />
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
