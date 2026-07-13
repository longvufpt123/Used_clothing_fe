import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Archive,
  Truck,
  MapPin,
  Calendar,
  ArrowRight,
  Scale,
  Boxes,
  ClipboardList,
  Warehouse,
} from 'lucide-react';
import {
  getDistributions,
  getInventory,
  getWarehouseBatches,
  type DistributionRequest,
  type WarehouseBatch,
  type InventoryStock,
} from '@/utils/warehouseMockDb';
import '@/styles/ops-shared.css';

type TabKey = 'inbound' | 'shelving' | 'distribute' | 'tracking';

const batchStatusLabel = (s: WarehouseBatch['status']) => {
  if (s === 'SendingToWarehouse') return 'Chờ nhập kho';
  if (s === 'WarehouseReceived') return 'Chờ xếp kệ';
  return 'Đã lưu trữ';
};

const distStatusLabel = (s: DistributionRequest['status']) => {
  if (s === 'Pending') return 'Chờ gom hàng';
  if (s === 'Prepared') return 'Đã đóng gói';
  return 'Đã gửi GHN';
};

const isTab = (v: string | null): v is TabKey =>
  v === 'inbound' || v === 'shelving' || v === 'distribute' || v === 'tracking';

export const WarehouseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [batches, setBatches] = useState<WarehouseBatch[]>([]);
  const [dists, setDists] = useState<DistributionRequest[]>([]);
  const [inv, setInv] = useState<InventoryStock | null>(null);

  const tabParam = searchParams.get('tab');
  const tab: TabKey = isTab(tabParam) ? tabParam : 'inbound';
  const setTab = (t: TabKey) => setSearchParams(t === 'inbound' ? {} : { tab: t }, { replace: true });

  useEffect(() => {
    setBatches(getWarehouseBatches());
    setDists(getDistributions());
    setInv(getInventory());
  }, []);

  const inbound = batches.filter((b) => b.status === 'SendingToWarehouse');
  const shelving = batches.filter((b) => b.status === 'WarehouseReceived');
  const pendingDist = dists.filter((d) => d.status === 'Pending');

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Bộ phận Kho</span>
          <h1>Trung tâm điều phối kho</h1>
          <p>
            Tiếp nhận lô từ tổ phân loại, xếp kệ tồn kho, gom hàng phân phối và bám sát
            vận đơn GHN — tất cả trong một luồng.
          </p>
        </div>
      </header>

      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Chờ nhập kho</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Package size={18} strokeWidth={2} /></span>
            {inbound.length}
          </div>
          <span className="ops-stat-foot">lô đang chờ đối chiếu</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Chờ xếp kệ</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Archive size={18} strokeWidth={2} /></span>
            {shelving.length}
          </div>
          <span className="ops-stat-foot">đã nhận, chưa lưu trữ</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Yêu cầu phân phối</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Truck size={18} strokeWidth={2} /></span>
            {pendingDist.length}
          </div>
          <span className="ops-stat-foot">chờ gom & đóng gói</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tồn áo thun</span>
          <div className="ops-stat-value">
            <span className="ops-stat-icon"><Boxes size={18} strokeWidth={2} /></span>
            {inv?.tshirts ?? 0}
          </div>
          <span className="ops-stat-foot">món sẵn trong kho</span>
        </div>
      </div>

      {inv && (
        <div className="ops-panel">
          <span className="ops-panel-label">Tồn kho nhanh</span>
          <div className="ops-kv-grid">
            <div className="ops-kv inv-jackets">
              <span>Áo khoác</span>
              <strong>{inv.jackets}</strong>
            </div>
            <div className="ops-kv inv-tshirts">
              <span>Áo thun</span>
              <strong>{inv.tshirts}</strong>
            </div>
            <div className="ops-kv inv-pants">
              <span>Quần dài</span>
              <strong>{inv.pants}</strong>
            </div>
            <div className="ops-kv inv-recycle">
              <span>Tái chế</span>
              <strong>{inv.recycleKg.toFixed(1)} kg</strong>
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="ops-section-head">
          <h2>Hàng đợi xử lý</h2>
          <span>Chọn giai đoạn để mở lô hoặc yêu cầu phân phối</span>
        </div>

        <div className="ops-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'inbound'}
            className={`ops-tab ${tab === 'inbound' ? 'active' : ''}`}
            onClick={() => setTab('inbound')}
          >
            <Package size={15} strokeWidth={2} />
            Chờ nhập kho
            <span className="ops-tab-count">{inbound.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'shelving'}
            className={`ops-tab ${tab === 'shelving' ? 'active' : ''}`}
            onClick={() => setTab('shelving')}
          >
            <Archive size={15} strokeWidth={2} />
            Chờ xếp kệ
            <span className="ops-tab-count">{shelving.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'distribute'}
            className={`ops-tab ${tab === 'distribute' ? 'active' : ''}`}
            onClick={() => setTab('distribute')}
          >
            <Truck size={15} strokeWidth={2} />
            Yêu cầu phân phối
            <span className="ops-tab-count">{pendingDist.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tracking'}
            className={`ops-tab ${tab === 'tracking' ? 'active' : ''}`}
            onClick={() => setTab('tracking')}
          >
            <MapPin size={15} strokeWidth={2} />
            Theo dõi vận đơn
            <span className="ops-tab-count">
              {dists.filter((d) => d.status === 'Shipped' || d.trackingCode).length}
            </span>
          </button>
        </div>

        {tab === 'inbound' && (
          <div className="ops-list">
            {inbound.length === 0 ? (
              <div className="ops-empty">
                <Warehouse size={36} strokeWidth={1.5} />
                <h4>Không có lô chờ nhập</h4>
                <p>Lô từ tổ phân loại sẽ hiện khi họ xác nhận bàn giao.</p>
              </div>
            ) : (
              inbound.map((batch) => (
                <article
                  key={batch.id}
                  className="ops-card"
                  onClick={() => navigate(`/warehouse/receive/${batch.id}`)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && navigate(`/warehouse/receive/${batch.id}`)
                  }
                  role="button"
                  tabIndex={0}
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
                      {batchStatusLabel(batch.status)}
                    </span>
                  </div>
                  <h3>{batch.sourceRoute}</h3>
                  <div className="ops-card-footer">
                    <span>
                      Kiện: <strong>{batch.itemCount}</strong>
                    </span>
                    <span className="ops-card-action">
                      Xác nhận nhận hàng <ArrowRight size={14} strokeWidth={2} />
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {tab === 'shelving' && (
          <div className="ops-list">
            {shelving.length === 0 ? (
              <div className="ops-empty">
                <Archive size={36} strokeWidth={1.5} />
                <h4>Không có lô chờ xếp kệ</h4>
                <p>Sau khi xác nhận nhận hàng vật lý, lô sẽ vào tab này.</p>
              </div>
            ) : (
              shelving.map((batch) => (
                <article
                  key={batch.id}
                  className="ops-card"
                  onClick={() => navigate(`/warehouse/storage/${batch.id}`)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && navigate(`/warehouse/storage/${batch.id}`)
                  }
                  role="button"
                  tabIndex={0}
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
                      {batchStatusLabel(batch.status)}
                    </span>
                  </div>
                  <h3>{batch.sourceRoute}</h3>
                  <div className="ops-card-footer">
                    <span>
                      {batch.charitySummary.jackets} khoác · {batch.charitySummary.tshirts} thun ·{' '}
                      {batch.charitySummary.pants} quần
                    </span>
                    <span className="ops-card-action">
                      Xếp kệ <ArrowRight size={14} strokeWidth={2} />
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {tab === 'distribute' && (
          <div className="ops-list">
            {dists.filter((d) => d.status !== 'Shipped').length === 0 ? (
              <div className="ops-empty">
                <Truck size={36} strokeWidth={1.5} />
                <h4>Không có yêu cầu đang mở</h4>
                <p>Yêu cầu phân phối mới từ chiến dịch sẽ hiện tại đây.</p>
              </div>
            ) : (
              dists
                .filter((d) => d.status !== 'Shipped')
                .map((dist) => (
                  <article
                    key={dist.id}
                    className="ops-card"
                    onClick={() => {
                      if (dist.status === 'Pending') {
                        navigate(`/warehouse/distribute/${dist.id}`);
                      } else if (dist.trackingCode) {
                        navigate(`/warehouse/tracking/${dist.trackingCode}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      if (dist.status === 'Pending') {
                        navigate(`/warehouse/distribute/${dist.id}`);
                      } else if (dist.trackingCode) {
                        navigate(`/warehouse/tracking/${dist.trackingCode}`);
                      }
                    }}
                  >
                    <div className="ops-card-top">
                      <div>
                        <div className="ops-card-code">{dist.code}</div>
                        <div className="ops-card-meta">
                          <span>
                            <Calendar size={12} strokeWidth={2} /> {dist.createdAt}
                          </span>
                          <span>
                            <MapPin size={12} strokeWidth={2} /> {dist.contactName}
                          </span>
                        </div>
                      </div>
                      <span className={`ops-badge ${dist.status.toLowerCase()}`}>
                        {distStatusLabel(dist.status)}
                      </span>
                    </div>
                    <h3>{dist.campaignName}</h3>
                    <div className="ops-card-footer">
                      <span style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dist.destination}
                      </span>
                      <span className="ops-card-action">
                        {dist.status === 'Pending' ? 'Gom & đóng gói' : 'Theo dõi GHN'}
                        <ArrowRight size={14} strokeWidth={2} />
                      </span>
                    </div>
                  </article>
                ))
            )}
          </div>
        )}

        {tab === 'tracking' && (
          <div className="ops-list">
            {dists.filter((d) => d.status === 'Shipped' || d.trackingCode).length === 0 ? (
              <div className="ops-empty">
                <ClipboardList size={36} strokeWidth={1.5} />
                <h4>Không có vận đơn nào</h4>
                <p>Sau khi đóng gói và gửi hàng, vận đơn sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              dists
                .filter((d) => d.status === 'Shipped' || d.trackingCode)
                .map((dist) => (
                  <article
                    key={dist.id}
                    className="ops-card"
                    onClick={() => navigate(`/warehouse/tracking/${dist.trackingCode}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/warehouse/tracking/${dist.trackingCode}`);
                      }
                    }}
                  >
                    <div className="ops-card-top">
                      <div>
                        <div className="ops-card-code">{dist.trackingCode || dist.code}</div>
                        <div className="ops-card-meta">
                          <span>
                            <Calendar size={12} strokeWidth={2} /> {dist.createdAt}
                          </span>
                          <span>
                            <MapPin size={12} strokeWidth={2} /> {dist.contactName}
                          </span>
                        </div>
                      </div>
                      <span className={`ops-badge ${dist.status.toLowerCase()}`}>
                        {dist.ghnStatus || distStatusLabel(dist.status)}
                      </span>
                    </div>
                    <h3>{dist.campaignName}</h3>
                    <div className="ops-card-footer">
                      <span style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dist.destination}
                      </span>
                      <span className="ops-card-action">
                        Theo dõi vận đơn
                        <ArrowRight size={14} strokeWidth={2} />
                      </span>
                    </div>
                  </article>
                ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default WarehouseDashboard;
