import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Boxes,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { apiClient } from '@/services/api';
import { receivingService, type ManagerWarehouseOption } from '@/services/receivingService';
import '@/shared/pages/Dashboard.css';
import './Dashboard.css';

interface Metric {
  key: string;
  label: string;
  count: number;
}

interface DailyMetric {
  date: string;
  donationRequests: number;
  inboundBatches: number;
  outboundBatches: number;
}

interface DashboardData {
  totalDonationRequests: number;
  totalIntakeBatches: number;
  totalClassifiedBatches: number;
  warehouseFlow: {
    inboundTransactions: number;
    outboundTransactions: number;
    inboundWeightKg: number;
    outboundWeightKg: number;
  };
  donationRequestPipeline: Metric[];
  intakeBatchPipeline: Metric[];
  classificationPipeline: Metric[];
  warehouseBatchPipeline: Metric[];
  trendGranularity: 'day' | 'month';
  lastSevenDays: DailyMetric[];
}

const COLORS = ['#10c995', '#4598f7', '#ffb44a', '#8b7cf6', '#ef6b73'];
const tooltipStyle = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  color: 'var(--color-text-primary)',
};

const EmptyChart = () => <div className="manager-chart-empty">Chưa có dữ liệu phát sinh</div>;

export default function ManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState<ManagerWarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [date, setDate] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      if (date) params.set('date', date);
      const suffix = params.size ? `?${params.toString()}` : '';
      setData(
        (await apiClient.get<DashboardData>(
          `/manager-dashboard${suffix}`,
        )) as unknown as DashboardData,
      );
    } catch {
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, year, month, date]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    receivingService
      .getManagerWarehouses()
      .then(setWarehouses)
      .catch(() => setWarehouses([]));
  }, []);

  const daily = useMemo(
    () =>
      (data?.lastSevenDays ?? []).map((item) => ({
        ...item,
        day:
          data?.trendGranularity === 'month'
            ? `Tháng ${new Date(item.date).getMonth() + 1}`
            : new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      })),
    [data],
  );
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear + 1 - index);

  const hasDailyData = daily.some(
    (x) => x.donationRequests || x.inboundBatches || x.outboundBatches,
  );

  return (
    <AdminLayout role="manager">
      <div className="admin-dashboard manager-dashboard">
        <header className="manager-dashboard-header">
          <div>
            <span className="manager-eyebrow">TỔNG QUAN VẬN HÀNH</span>
            <h1>Bảng tổng quan hoạt động</h1>
            <p>Theo dõi xuyên suốt quy trình tiếp nhận, thu gom, phân loại và lưu kho.</p>
          </div>
          <button
            type="button"
            className="manager-refresh-btn"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
        </header>

        {error && <div className="manager-dashboard-error">{error}</div>}

        <section className="manager-dashboard-filters">
          <div className="dashboard-filter-field warehouse-filter">
            <label>Kho</label>
            <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
              <option value="">Tất cả các kho</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="dashboard-filter-field">
            <label>Năm</label>
            <select
              value={year}
              onChange={(event) => {
                const value = event.target.value;
                setYear(value);
                if (!value) setMonth('');
                setDate('');
              }}
            >
              <option value="">Tất cả năm</option>
              {yearOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="dashboard-filter-field">
            <label>Tháng</label>
            <select
              value={month}
              disabled={!year}
              onChange={(event) => {
                setMonth(event.target.value);
                setDate('');
              }}
            >
              <option value="">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Tháng {value}
                </option>
              ))}
            </select>
          </div>
          <div className="dashboard-filter-field date-filter">
            <label>Ngày</label>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                const value = event.target.value;
                setDate(value);
                if (value) {
                  setYear(value.slice(0, 4));
                  setMonth(String(Number(value.slice(5, 7))));
                }
              }}
            />
          </div>
          {(warehouseId || year || month || date) && (
            <button
              type="button"
              className="dashboard-clear-filters"
              onClick={() => {
                setWarehouseId('');
                setYear('');
                setMonth('');
                setDate('');
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </section>

        <section className="manager-summary-grid" aria-busy={loading}>
          <article className="manager-summary-card">
            <div className="summary-icon green">
              <ClipboardList size={21} />
            </div>
            <div>
              <span>Donation Request</span>
              <strong>{data?.totalDonationRequests ?? '—'}</strong>
              <small>Tổng đơn quyên góp</small>
            </div>
          </article>
          <article className="manager-summary-card">
            <div className="summary-icon blue">
              <Boxes size={21} />
            </div>
            <div>
              <span>Intake Batch</span>
              <strong>{data?.totalIntakeBatches ?? '—'}</strong>
              <small>Tổng lô tiếp nhận</small>
            </div>
          </article>
          <article className="manager-summary-card">
            <div className="summary-icon purple">
              <PackageCheck size={21} />
            </div>
            <div>
              <span>Classified Batch</span>
              <strong>{data?.totalClassifiedBatches ?? '—'}</strong>
              <small>Tổng lô đã gom nhóm</small>
            </div>
          </article>
          <article className="manager-summary-card warehouse-summary">
            <div className="summary-icon orange">
              <Warehouse size={21} />
            </div>
            <div>
              <span>Luân chuyển kho</span>
              <strong>
                {(data?.warehouseFlow.inboundTransactions ?? 0) +
                  (data?.warehouseFlow.outboundTransactions ?? 0)}
              </strong>
              <small>Giao dịch nhập và xuất</small>
            </div>
          </article>
        </section>

        <section className="manager-chart-grid">
          <ChartCard
            title="Trạng thái Donation Request"
            subtitle="Số lượng đơn theo tiến độ tiếp nhận"
            data={data?.donationRequestPipeline}
          />
          <ChartCard
            title="Tiến độ Intake Batch"
            subtitle="Các lô đang thu gom và đã hoàn tất"
            data={data?.intakeBatchPipeline}
          />
          <ChartCard
            title="Tiến độ phân loại"
            subtitle="Intake Batch trong quy trình phân loại"
            data={data?.classificationPipeline}
          />
          <ChartCard
            title="Luồng batch trong kho"
            subtitle="Gom nhóm, chờ nhập, đã nhập và đã xuất"
            data={data?.warehouseBatchPipeline}
          />
        </section>

        <section className="manager-flow-row">
          <article className="manager-wide-chart">
            <div className="manager-chart-heading">
              <div>
                <h2>Hoạt động 7 ngày gần nhất</h2>
                <p>Đơn quyên góp và số batch nhập/xuất theo ngày</p>
              </div>
              <Activity size={20} />
            </div>
            <div className="manager-wide-chart-body">
              {!hasDailyData ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={265}>
                  <AreaChart data={daily} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10c995" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10c995" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-text-secondary)"
                      fontSize={12}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      stroke="var(--color-text-secondary)"
                      fontSize={12}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      name="Donation Request"
                      dataKey="donationRequests"
                      stroke="#10c995"
                      strokeWidth={2}
                      fill="url(#requestGradient)"
                    />
                    <Area
                      type="monotone"
                      name="Batch nhập kho"
                      dataKey="inboundBatches"
                      stroke="#4598f7"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      name="Batch xuất kho"
                      dataKey="outboundBatches"
                      stroke="#ffb44a"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="manager-warehouse-flow">
            <div className="manager-chart-heading">
              <div>
                <h2>Xuất / nhập kho</h2>
                <p>Số giao dịch và khối lượng thực tế</p>
              </div>
              <Warehouse size={20} />
            </div>
            <div className="warehouse-flow-stat inbound">
              <TrendingUp size={22} />
              <div>
                <span>Nhập kho</span>
                <strong>{data?.warehouseFlow.inboundTransactions ?? 0} batch</strong>
              </div>
              <b>{data?.warehouseFlow.inboundWeightKg ?? 0} kg</b>
            </div>
            <div className="warehouse-flow-stat outbound">
              <TrendingDown size={22} />
              <div>
                <span>Xuất kho</span>
                <strong>{data?.warehouseFlow.outboundTransactions ?? 0} batch</strong>
              </div>
              <b>{data?.warehouseFlow.outboundWeightKg ?? 0} kg</b>
            </div>
          </article>
        </section>
      </div>
    </AdminLayout>
  );
}

function ChartCard({
  title,
  subtitle,
  data = [],
}: {
  title: string;
  subtitle: string;
  data?: Metric[];
}) {
  const hasData = data.some((x) => x.count > 0);
  return (
    <article className="manager-chart-card">
      <div className="manager-chart-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="manager-chart-card-body">
        {!hasData ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={205}>
            <BarChart data={data} margin={{ top: 12, right: 6, left: -24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
                fontSize={11}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                stroke="var(--color-text-secondary)"
                fontSize={11}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}`, 'Số lượng']}
              />
              <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={52}>
                {data.map((item, index) => (
                  <Cell key={item.key} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
