import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Boxes,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  MapPin,
  PackageCheck,
  RefreshCw,
  Pencil,
  Plus,
  Search,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import AddressSearchMap from '@/components/common/AddressSearchMap';
import { useToast } from '@/context/ToastContext';
import { getStatusLabel } from '@/utils/statusLabels';
import { receivingService } from '@/services/receivingService';
import {
  warehouseService,
  type StorageLocation,
  type WarehouseBatch,
  type WarehouseDashboard,
  type WarehouseIntakeTrace,
  type WarehouseInventory,
  type WarehouseLayout,
  type WarehouseDetails,
  type WarehouseTransaction,
} from '@/services/warehouseService';
import '@/styles/ops-shared.css';
import './WarehouseControl.css';
import './WarehouseCreate.css';

type Tab = 'layout' | 'intake' | 'inbound' | 'inventory' | 'transactions';
type LayoutEditor = {
  kind: 'area' | 'group';
  id?: string;
  areaId?: string;
  name: string;
  description: string;
  capacityKg: number;
  currentKg: number;
  allocatedKg: number;
};
type LocationEditor = {
  id?: string;
  areaGroupId: string;
  locationCode: string;
  aisleCode: string;
  rackCode: string;
  shelfCode: string;
  binCode: string;
  preferredGarmentGroup: string;
  preferredProcessingDirection: string;
  capacityKg: number;
  currentWeightKg: number;
  allocatedKg: number;
  groupCapacityKg: number;
  status: string;
};
type WarehouseForm = {
  warehouseName: string;
  address: string;
  phoneNumber: string;
  email: string;
  description: string;
  totalCapacityKg: number;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
};
const tabLabels: Record<Tab, string> = {
  layout: 'Gian & vị trí',
  intake: 'Intake Batch',
  inbound: 'Batch nhập kho',
  inventory: 'Tồn kho SKU',
  transactions: 'Sổ nhập / xuất',
};
const statusLabel: Record<string, string> = {
  PendingWarehouseReceipt: 'Chờ nhận kho',
  WarehouseReceived: 'Chờ xếp vị trí',
  Stored: 'Đã lưu kho',
  SentToWarehouse: 'Đã gửi kho',
  Available: 'Khả dụng',
  AwaitingPutaway: 'Chờ xếp kho',
  Depleted: 'Đã hết',
};
const txIcon: Record<string, typeof Archive> = {
  RECEIPT: ArrowDownToLine,
  PUTAWAY: Archive,
  MOVE: ArrowRightLeft,
  OUT: ArrowUpFromLine,
};
const areaCodeLabel: Record<string, string> = {
  CHARITY: 'Khu hàng từ thiện',
  RECYCLE: 'Khu hàng tái chế',
  DISPOSAL: 'Khu cách ly / tiêu hủy',
};
const decodeLocationCode = (code: string) => {
  const [area, aisle, rack, shelf, bin] = code.split('-');
  return {
    area: areaCodeLabel[area] || `Khu ${area || '—'}`,
    aisle: aisle || '—',
    rack: rack || '—',
    shelf: shelf || '—',
    bin: bin || '—',
  };
};

export default function ManagerWarehouseControl() {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; address: string }[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [tab, setTab] = useState<Tab>('layout');
  const [stats, setStats] = useState<WarehouseDashboard | null>(null);
  const [layout, setLayout] = useState<WarehouseLayout | null>(null);
  const [intakes, setIntakes] = useState<WarehouseIntakeTrace[]>([]);
  const [batches, setBatches] = useState<WarehouseBatch[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [detail, setDetail] = useState<{
    kind: 'intake' | 'batch' | 'inventory' | 'transaction' | 'location';
    data: any;
  } | null>(null);
  const [action, setAction] = useState<'issue' | 'move' | 'receipt' | 'putaway' | null>(null);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [form, setForm] = useState({
    quantity: 1,
    weightKg: 1,
    reason: 'Xuất kho theo điều phối của Manager',
    notes: '',
    destinationLocationId: '',
    actualItemCount: 1,
    actualWeightKg: 1,
    sealIntact: true,
  });
  const [layoutEditor, setLayoutEditor] = useState<LayoutEditor | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const [deleteLayoutConfirm, setDeleteLayoutConfirm] = useState(false);
  const [locationEditor, setLocationEditor] = useState<LocationEditor | null>(null);
  const [deleteLocationConfirm, setDeleteLocationConfirm] = useState(false);
  const [warehouseEditorOpen, setWarehouseEditorOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [warehouseDetails, setWarehouseDetails] = useState<WarehouseDetails | null>(null);
  const [deleteWarehouseConfirm, setDeleteWarehouseConfirm] = useState(false);
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseForm>({
    warehouseName: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
    totalCapacityKg: 15000,
    latitude: null,
    longitude: null,
    serviceRadiusKm: 24,
  });

  const loadWarehouses = async (preferredId?: string) => {
    const data = await receivingService.getManagerWarehouses();
    setWarehouses(data);
    setWarehouseId((current) => {
      const candidate = preferredId || current;
      return data.some((item) => item.id === candidate) ? candidate : data[0]?.id || '';
    });
  };
  useEffect(() => {
    loadWarehouses().catch(() => toast.error('Không tải được danh sách kho.'));
  }, []);

  const load = async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const [dashboardData, layoutData, intakeData, batchData, inventoryData, transactionData] =
        await Promise.all([
          warehouseService.dashboard(warehouseId),
          warehouseService.layout(warehouseId),
          warehouseService.intakeTraces(warehouseId),
          warehouseService.inboundBatches(warehouseId),
          warehouseService.inventory(undefined, warehouseId),
          warehouseService.transactions(undefined, warehouseId),
        ]);
      setStats(dashboardData);
      setLayout(layoutData);
      setIntakes(intakeData);
      setBatches(batchData);
      setInventory(inventoryData);
      setTransactions(transactionData);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không tải được dữ liệu quản lý kho.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [warehouseId]);
  useEffect(() => setPage(1), [tab, search, status, warehouseId]);

  const normalized = search.trim().toLocaleLowerCase('vi');
  const source = useMemo(
    () =>
      (tab === 'intake'
        ? intakes
        : tab === 'inbound'
          ? batches
          : tab === 'inventory'
            ? inventory
            : tab === 'transactions'
              ? transactions
              : []
      ).filter((item: any) => {
        const text = JSON.stringify(item).toLocaleLowerCase('vi');
        const itemStatus = tab === 'transactions' ? item.transactionType : item.status;
        return (!normalized || text.includes(normalized)) && (!status || itemStatus === status);
      }),
    [tab, intakes, batches, inventory, transactions, normalized, status],
  );
  const pages = Math.max(1, Math.ceil(source.length / pageSize));
  const paged = source.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const openBatchAction = async (item: WarehouseBatch, mode: 'receipt' | 'putaway') => {
    setDetail({ kind: 'batch', data: item });
    setAction(mode);
    setForm({
      quantity: 1,
      weightKg: 1,
      reason: '',
      notes: '',
      destinationLocationId: '',
      actualItemCount: item.expectedItemCount,
      actualWeightKg: item.expectedWeightKg,
      sealIntact: true,
    });
    if (mode === 'putaway') {
      const list = await warehouseService.locations(item.id);
      setLocations(list);
      setForm((current) => ({ ...current, destinationLocationId: list[0]?.id || '' }));
    }
  };
  const submitAction = async () => {
    if (!detail || !action) return;
    try {
      if (detail.kind === 'inventory') {
        const item = detail.data as WarehouseInventory;
        if (action === 'issue')
          await warehouseService.issue(item.id, {
            weightKg: form.weightKg,
            reason: form.reason,
            notes: form.notes,
          });
        else
          await warehouseService.move(item.id, {
            destinationLocationId: form.destinationLocationId,
            reason: form.reason,
            notes: form.notes,
          });
        toast.success(
          action === 'issue'
            ? 'Đã xuất kho và ghi transaction OUT.'
            : 'Đã điều chuyển và ghi transaction MOVE.',
        );
      } else {
        const batch = detail.data as WarehouseBatch;
        if (action === 'receipt')
          await warehouseService.confirmReceipt(batch.id, {
            actualItemCount: form.actualItemCount,
            actualWeightKg: form.actualWeightKg,
            sealIntact: form.sealIntact,
            discrepancyNotes: form.notes,
          });
        else
          await warehouseService.putaway(batch.id, {
            locationId: form.destinationLocationId,
            notes: form.notes,
          });
        toast.success(
          action === 'receipt'
            ? 'Đã xác nhận nhập kho và ghi transaction RECEIPT.'
            : 'Đã xếp vị trí và ghi transaction PUTAWAY.',
        );
      }
      setDetail(null);
      setAction(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thực hiện được nghiệp vụ kho.');
    }
  };
  const saveLayoutEntity = async () => {
    if (!layoutEditor || !layout) return;
    if (!layoutEditor.name.trim() || layoutEditor.capacityKg <= 0)
      return toast.warning('Tên và sức chứa phải hợp lệ.');
    setSavingLayout(true);
    try {
      if (layoutEditor.kind === 'area') {
        const data = {
          warehouseId: layout.warehouseId,
          areaName: layoutEditor.name.trim(),
          description: layoutEditor.description,
          capacityKg: layoutEditor.capacityKg,
        };
        if (layoutEditor.id) await warehouseService.updateArea(layoutEditor.id, data);
        else await warehouseService.createArea(data);
      } else {
        const data = {
          areaId: layoutEditor.areaId!,
          groupName: layoutEditor.name.trim(),
          description: layoutEditor.description,
          capacityKg: layoutEditor.capacityKg,
        };
        if (layoutEditor.id) await warehouseService.updateGroup(layoutEditor.id, data);
        else await warehouseService.createGroup(data);
      }
      toast.success(layoutEditor.id ? 'Đã cập nhật cấu hình kho.' : 'Đã thêm cấu hình kho.');
      setLayoutEditor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể lưu cấu hình kho.');
    } finally {
      setSavingLayout(false);
    }
  };
  const deleteLayoutEntity = async () => {
    if (!layoutEditor?.id) return;
    setSavingLayout(true);
    try {
      if (layoutEditor.kind === 'area') await warehouseService.deleteArea(layoutEditor.id);
      else await warehouseService.deleteGroup(layoutEditor.id);
      toast.success('Đã xóa cấu hình kho.');
      setLayoutEditor(null);
      setDeleteLayoutConfirm(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa vì khu vực/dãy vẫn còn tồn kho.');
    } finally {
      setSavingLayout(false);
    }
  };
  const saveLocation = async () => {
    if (!locationEditor) return;
    setSavingLayout(true);
    const data = {
      areaGroupId: locationEditor.areaGroupId,
      locationCode: locationEditor.locationCode,
      aisleCode: locationEditor.aisleCode,
      rackCode: locationEditor.rackCode,
      shelfCode: locationEditor.shelfCode,
      binCode: locationEditor.binCode,
      preferredGarmentGroup: locationEditor.preferredGarmentGroup || undefined,
      preferredProcessingDirection: locationEditor.preferredProcessingDirection || undefined,
      capacityKg: locationEditor.capacityKg,
      status: locationEditor.status,
    };
    try {
      if (locationEditor.id) await warehouseService.updateLocation(locationEditor.id, data);
      else await warehouseService.createLocation(data);
      toast.success(locationEditor.id ? 'Đã cập nhật location.' : 'Đã thêm location vào dãy.');
      setLocationEditor(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể lưu location.');
    } finally {
      setSavingLayout(false);
    }
  };
  const deleteLocation = async () => {
    if (!locationEditor?.id) return;
    setSavingLayout(true);
    try {
      await warehouseService.deleteLocation(locationEditor.id);
      toast.success('Đã xóa location.');
      setLocationEditor(null);
      setDeleteLocationConfirm(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa location còn tồn kho.');
    } finally {
      setSavingLayout(false);
    }
  };

  const createWarehouse = async () => {
    const warehouseName = warehouseForm.warehouseName.trim();
    const address = warehouseForm.address.trim();
    if (warehouseName.length < 3 || warehouseName.length > 150) {
      toast.warning('Tên kho phải có từ 3 đến 150 ký tự.');
      return;
    }
    if (address.length < 10 || address.length > 500) {
      toast.warning('Địa chỉ kho phải là địa chỉ đầy đủ, có từ 10 đến 500 ký tự.');
      return;
    }
    if (warehouseForm.latitude == null || warehouseForm.longitude == null) {
      toast.warning('Vui lòng chọn địa chỉ kho từ gợi ý hoặc ghim vị trí trên bản đồ.');
      return;
    }
    if (warehouseForm.totalCapacityKg <= 0 || warehouseForm.totalCapacityKg > 10000000) {
      toast.warning('Tổng sức chứa phải lớn hơn 0 và không vượt quá 10.000.000 kg.');
      return;
    }
    if (warehouseForm.serviceRadiusKm < 1 || warehouseForm.serviceRadiusKm > 200) {
      toast.warning('Bán kính phục vụ phải từ 1 đến 200 km.');
      return;
    }
    setSavingWarehouse(true);
    try {
      const result = await warehouseService.createWarehouse({
        warehouseName,
        address,
        phoneNumber: warehouseForm.phoneNumber.trim() || undefined,
        email: warehouseForm.email.trim() || undefined,
        description: warehouseForm.description.trim() || undefined,
        totalCapacityKg: warehouseForm.totalCapacityKg,
        latitude: warehouseForm.latitude,
        longitude: warehouseForm.longitude,
        serviceRadiusKm: warehouseForm.serviceRadiusKm,
      });
      await loadWarehouses(result.id);
      setWarehouseEditorOpen(false);
      setWarehouseForm({
        warehouseName: '',
        address: '',
        phoneNumber: '',
        email: '',
        description: '',
        totalCapacityKg: 15000,
        latitude: null,
        longitude: null,
        serviceRadiusKm: 24,
      });
      toast.success('Đã tạo kho mới và chuyển sang cấu hình kho.');
    } catch (e: any) {
      console.error('Create warehouse failed:', e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.title ||
          e?.message ||
          'Không thể tạo kho.',
      );
    } finally {
      setSavingWarehouse(false);
    }
  };

  const emptyWarehouseForm = (): WarehouseForm => ({
    warehouseName: '', address: '', phoneNumber: '', email: '', description: '',
    totalCapacityKg: 15000,
    latitude: null, longitude: null, serviceRadiusKm: 24,
  });

  const openCreateWarehouse = () => {
    setEditingWarehouseId(null);
    setWarehouseDetails(null);
    setDeleteWarehouseConfirm(false);
    setWarehouseForm(emptyWarehouseForm());
    setWarehouseEditorOpen(true);
  };

  const openEditWarehouse = async () => {
    if (!warehouseId) return;
    setSavingWarehouse(true);
    try {
      const data = await warehouseService.warehouse(warehouseId);
      setWarehouseDetails(data);
      setEditingWarehouseId(data.id);
      setDeleteWarehouseConfirm(false);
      setWarehouseForm({
        warehouseName: data.warehouseName,
        address: data.address,
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        description: data.description || '',
        totalCapacityKg: data.totalCapacityKg,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        serviceRadiusKm: data.serviceRadiusKm ?? 24,
      });
      setWarehouseEditorOpen(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tải thông tin kho.');
    } finally {
      setSavingWarehouse(false);
    }
  };

  const updateWarehouse = async () => {
    if (!editingWarehouseId) return;
    const warehouseName = warehouseForm.warehouseName.trim();
    const address = warehouseForm.address.trim();
    if (warehouseName.length < 3 || warehouseName.length > 150) {
      toast.warning('Tên kho phải có từ 3 đến 150 ký tự.');
      return;
    }
    if (address.length < 10 || address.length > 500) {
      toast.warning('Địa chỉ kho phải có từ 10 đến 500 ký tự.');
      return;
    }
    if (warehouseForm.latitude == null || warehouseForm.longitude == null) {
      toast.warning('Vui lòng chọn địa chỉ kho từ gợi ý hoặc ghim vị trí trên bản đồ.');
      return;
    }
    if (warehouseForm.serviceRadiusKm < 1 || warehouseForm.serviceRadiusKm > 200) {
      toast.warning('Bán kính phục vụ phải từ 1 đến 200 km.');
      return;
    }
    const minimumCapacity = Math.max(
      warehouseDetails?.allocatedAreaCapacityKg || 0,
      warehouseDetails?.currentWeightKg || 0,
    );
    if (warehouseForm.totalCapacityKg < minimumCapacity) {
      toast.warning(`Sức chứa kho không thể thấp hơn ${minimumCapacity} kg đang phân bổ hoặc lưu trữ.`);
      return;
    }
    setSavingWarehouse(true);
    try {
      await warehouseService.updateWarehouse(editingWarehouseId, {
        warehouseName,
        address,
        phoneNumber: warehouseForm.phoneNumber.trim() || undefined,
        email: warehouseForm.email.trim() || undefined,
        description: warehouseForm.description.trim() || undefined,
        totalCapacityKg: warehouseForm.totalCapacityKg,
        latitude: warehouseForm.latitude,
        longitude: warehouseForm.longitude,
        serviceRadiusKm: warehouseForm.serviceRadiusKm,
      });
      await loadWarehouses(editingWarehouseId);
      await load();
      setWarehouseEditorOpen(false);
      toast.success('Đã cập nhật thông tin kho.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể cập nhật kho.');
    } finally {
      setSavingWarehouse(false);
    }
  };

  const deleteWarehouse = async () => {
    if (!editingWarehouseId) return;
    setSavingWarehouse(true);
    try {
      await warehouseService.deleteWarehouse(editingWarehouseId);
      setWarehouseEditorOpen(false);
      setDeleteWarehouseConfirm(false);
      await loadWarehouses();
      toast.success('Đã xóa kho.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa kho đang có dữ liệu liên quan.');
    } finally {
      setSavingWarehouse(false);
    }
  };

  return (
    <AdminLayout>
      <div className="ops-page manager-warehouse">
        <header className="ops-pagehead">
          <div className="ops-pagehead-main">
            <span className="ops-pagehead-kicker">Warehouse Control Center</span>
            <h1>Quản lý nhập – xuất – tồn kho</h1>
            <p>
              Theo dõi xuyên suốt từ lô hàng, phân loại, tiếp nhận kho, vị trí lưu trữ đến mọi
              giao dịch phát sinh.
            </p>
          </div>
          <div className="warehouse-head-actions">
            <button
              className="ops-btn ops-btn-primary"
              onClick={openCreateWarehouse}
            >
              <Plus size={16} />
              Thêm kho
            </button>
            <button
              className="ops-btn ops-btn-secondary"
              onClick={() => void openEditWarehouse()}
              disabled={!warehouseId || savingWarehouse}
            >
              <Pencil size={16} />
              Chỉnh sửa kho
            </button>
            <button className="ops-btn ops-btn-secondary" onClick={load} disabled={loading}>
              <RefreshCw size={16} />
              {loading ? 'Đang tải' : 'Làm mới'}
            </button>
          </div>
        </header>

        <section className="warehouse-commandbar">
          <div>
            <Warehouse size={17} />
            <label>Kho đang quản lý</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <span>{warehouses.find((x) => x.id === warehouseId)?.address}</span>
        </section>

        <div className="ops-stats">
          <div className="ops-stat-card">
            <span className="ops-stat-label">Chờ nhận kho</span>
            <strong className="ops-stat-value">{stats?.pendingReceipt || 0}</strong>
            <small>Classified Batch</small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Chờ xếp vị trí</span>
            <strong className="ops-stat-value">{stats?.awaitingPutaway || 0}</strong>
            <small>Batch đã đối chiếu</small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Tồn khả dụng</span>
            <strong className="ops-stat-value">{stats?.availableWeightKg || 0} kg</strong>
            <small>
              {stats?.inventorySkuCount || 0} nhóm tồn kho
            </small>
          </div>
          <div className="ops-stat-card">
            <span className="ops-stat-label">Đang chứa / Tổng sức chứa kho</span>
            <strong className="ops-stat-value">
              {(layout?.currentWeightKg || 0).toLocaleString('vi-VN')} /{' '}
              {(layout?.capacityKg || 0).toLocaleString('vi-VN')} kg
            </strong>
            <div className="warehouse-capacity">
              <i
                style={{
                  width: `${Math.min(100, layout?.capacityKg ? (layout.currentWeightKg / layout.capacityKg) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <nav className="warehouse-tabs">
          {(Object.keys(tabLabels) as Tab[]).map((key) => (
            <button
              className={tab === key ? 'active' : ''}
              onClick={() => {
                setTab(key);
                setStatus('');
              }}
              key={key}
            >
              {key === 'layout' ? (
                <Building2 />
              ) : key === 'intake' ? (
                <PackageCheck />
              ) : key === 'inbound' ? (
                <Archive />
              ) : key === 'inventory' ? (
                <Boxes />
              ) : (
                <ClipboardList />
              )}
              <span>{tabLabels[key]}</span>
              {key !== 'layout' && (
                <b>
                  {key === 'intake'
                    ? intakes.length
                    : key === 'inbound'
                      ? batches.length
                      : key === 'inventory'
                        ? inventory.length
                        : transactions.length}
                </b>
              )}
            </button>
          ))}
        </nav>

        {tab === 'layout' ? (
          <LayoutView
            layout={layout}
            onLocation={(data) => setDetail({ kind: 'location', data })}
            onEdit={(editor) => {
              setDeleteLayoutConfirm(false);
              setLayoutEditor(editor);
            }}
            onEditLocation={(editor) => {
              setDeleteLocationConfirm(false);
              setLocationEditor(editor);
            }}
          />
        ) : (
          <>
            <section className="warehouse-filterbar">
              <div>
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mã batch, SKU, loại đồ, vị trí, nhân viên..."
                />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                {tab === 'inbound' && (
                  <>
                    <option value="PendingWarehouseReceipt">Chờ nhận kho</option>
                    <option value="WarehouseReceived">Chờ xếp vị trí</option>
                    <option value="Stored">Đã lưu kho</option>
                  </>
                )}
                {tab === 'inventory' && (
                  <>
                    <option value="Available">Khả dụng</option>
                    <option value="AwaitingPutaway">Chờ xếp kho</option>
                    <option value="Depleted">Đã hết</option>
                  </>
                )}
                {tab === 'transactions' && (
                  <>
                    <option value="RECEIPT">Nhập kho</option>
                    <option value="PUTAWAY">Xếp vị trí</option>
                    <option value="MOVE">Điều chuyển</option>
                    <option value="OUT">Xuất kho</option>
                  </>
                )}
              </select>
              <span>{source.length} kết quả</span>
            </section>
            <div className="warehouse-record-grid">
              {tab === 'intake' &&
                paged.map((item: any) => (
                  <IntakeCard
                    item={item}
                    onOpen={() => setDetail({ kind: 'intake', data: item })}
                  />
                ))}
              {tab === 'inbound' &&
                paged.map((item: any) => (
                  <BatchCard
                    item={item}
                    onOpen={() => setDetail({ kind: 'batch', data: item })}
                    onAction={(mode) => void openBatchAction(item, mode)}
                  />
                ))}
              {tab === 'inventory' &&
                paged.map((item: any) => (
                  <InventoryCard
                    item={item}
                    onOpen={() => setDetail({ kind: 'inventory', data: item })}
                  />
                ))}
              {tab === 'transactions' &&
                paged.map((item: any) => (
                  <TransactionCard
                    item={item}
                    onOpen={() => setDetail({ kind: 'transaction', data: item })}
                  />
                ))}
              {!loading && !paged.length && (
                <div className="ops-empty">
                  <Boxes size={36} />
                  <h4>Không có dữ liệu phù hợp</h4>
                </div>
              )}
            </div>
            {pages > 1 && (
              <div className="warehouse-pagination">
                <button disabled={page === 1} onClick={() => setPage((x) => x - 1)}>
                  <ChevronLeft />
                  Trước
                </button>
                <span>
                  Trang {page} / {pages}
                </span>
                <button disabled={page === pages} onClick={() => setPage((x) => x + 1)}>
                  Sau
                  <ChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {warehouseEditorOpen && (
          <div
            className="ops-modal-overlay warehouse-detail-overlay"
            onMouseDown={() => !savingWarehouse && setWarehouseEditorOpen(false)}
          >
            <section
              className="ops-panel warehouse-layout-editor warehouse-create-modal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header>
                <div>
                  <span>{editingWarehouseId ? 'CHỈNH SỬA KHO' : 'THÊM KHO MỚI'}</span>
                  <h2>{editingWarehouseId ? 'Cập nhật kho vận hành' : 'Thông tin kho vận hành'}</h2>
                  <p>
                    {editingWarehouseId
                      ? 'Cập nhật tên, địa chỉ, liên hệ và sức chứa vật lý của kho.'
                      : 'Sau khi tạo, hệ thống sẽ khởi tạo sơ đồ lưu trữ theo tổng sức chứa đã nhập.'}
                  </p>
                </div>
                <button onClick={() => setWarehouseEditorOpen(false)} disabled={savingWarehouse}>
                  <X />
                </button>
              </header>
              <div className="warehouse-action-form">
                <div className="warehouse-form-row">
                  <label>
                    Tên kho *
                    <input
                      autoFocus
                      required
                      maxLength={150}
                      value={warehouseForm.warehouseName}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, warehouseName: e.target.value })
                      }
                      placeholder="VD: Kho Bình Thạnh"
                    />
                  </label>
                  <label>
                    Tổng sức chứa (kg) *
                    <input
                      required
                      type="number"
                      min={Math.max(
                        1,
                        warehouseDetails?.allocatedAreaCapacityKg || 0,
                        warehouseDetails?.currentWeightKg || 0,
                      )}
                      max={10000000}
                      step={100}
                      value={warehouseForm.totalCapacityKg}
                      onChange={(e) =>
                        setWarehouseForm({
                          ...warehouseForm,
                          totalCapacityKg: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <AddressSearchMap
                  label="Địa chỉ đầy đủ"
                  required
                  value={warehouseForm.address}
                  location={warehouseForm.latitude != null && warehouseForm.longitude != null
                    ? { lat: warehouseForm.latitude, lon: warehouseForm.longitude }
                    : null}
                  onChange={(address) =>
                    setWarehouseForm((current) => ({ ...current, address }))
                  }
                  onLocationChange={(location) =>
                    setWarehouseForm((current) => ({
                      ...current,
                      latitude: location?.lat ?? null,
                      longitude: location?.lon ?? null,
                    }))
                  }
                />
                <label>
                  Bán kính phục vụ lấy hàng (km) *
                  <input
                    required
                    type="number"
                    min={1}
                    max={200}
                    step={1}
                    value={warehouseForm.serviceRadiusKm}
                    onChange={(e) => setWarehouseForm({
                      ...warehouseForm,
                      serviceRadiusKm: Number(e.target.value),
                    })}
                  />
                  <small>Địa chỉ ngoài bán kính này sẽ không thể chọn hình thức nhân viên đến lấy.</small>
                </label>
                <div className="warehouse-form-row">
                  <label>
                    Số điện thoại
                    <input
                      value={warehouseForm.phoneNumber}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, phoneNumber: e.target.value })
                      }
                      placeholder="0901234567"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={warehouseForm.email}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, email: e.target.value })
                      }
                      placeholder="warehouse@rethreads.vn"
                    />
                  </label>
                </div>
                <label>
                  Mô tả
                  <textarea
                    value={warehouseForm.description}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, description: e.target.value })
                    }
                    placeholder="Phạm vi phục vụ, giờ vận hành hoặc ghi chú quản lý..."
                  />
                </label>
                <div className="warehouse-capacity-rule">
                  <b>{editingWarehouseId ? 'Quy tắc sức chứa' : 'Cấu trúc khởi tạo'}</b>
                  <span>
                    {editingWarehouseId
                      ? `Không thể giảm dưới ${Math.max(warehouseDetails?.allocatedAreaCapacityKg || 0, warehouseDetails?.currentWeightKg || 0)} kg đang phân bổ hoặc lưu trữ.`
                      : 'Tổng sức chứa là giới hạn cho toàn bộ khu vực, dãy và vị trí được tạo trong kho.'}
                  </span>
                </div>
                <div className="warehouse-modal-actions">
                  {editingWarehouseId && (
                    <button
                      className="ops-btn teams-danger-btn warehouse-delete-button"
                      onClick={() => setDeleteWarehouseConfirm(true)}
                      disabled={savingWarehouse}
                    >
                      <Trash2 size={16} />
                      Xóa kho
                    </button>
                  )}
                  <button
                    className="ops-btn ops-btn-secondary"
                    onClick={() => setWarehouseEditorOpen(false)}
                    disabled={savingWarehouse}
                  >
                    Hủy
                  </button>
                  <button
                    className="ops-btn ops-btn-primary"
                    onClick={editingWarehouseId ? updateWarehouse : createWarehouse}
                    disabled={savingWarehouse}
                  >
                    {savingWarehouse
                      ? 'Đang lưu...'
                      : editingWarehouseId
                        ? 'Lưu thay đổi'
                        : 'Tạo kho'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
        {deleteWarehouseConfirm && (
          <WarehouseDeleteConfirmModal
            title={`Xóa kho “${warehouseForm.warehouseName}”?`}
            message="Chỉ xóa được kho không có nhân viên, ca làm, yêu cầu, batch hoặc hàng tồn. Các khu vực cấu hình rỗng của kho sẽ được xóa theo."
            pending={savingWarehouse}
            onCancel={() => setDeleteWarehouseConfirm(false)}
            onConfirm={() => void deleteWarehouse()}
          />
        )}
        {detail && (
          <DetailModal
            detail={detail}
            action={action}
            locations={locations}
            form={form}
            setForm={setForm}
            onAction={setAction}
            onSubmit={submitAction}
            onClose={() => {
              setDetail(null);
              setAction(null);
            }}
          />
        )}
        {layoutEditor && (
          <div
            className="ops-modal-overlay warehouse-detail-overlay"
            onMouseDown={() => !savingLayout && setLayoutEditor(null)}
          >
            <section
              className="ops-panel warehouse-layout-editor"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header>
                <div>
                  <span>
                    {layoutEditor.id ? 'CHỈNH SỬA' : 'THÊM MỚI'}{' '}
                    {layoutEditor.kind === 'area' ? 'KHU VỰC' : 'DÃY KHO'}
                  </span>
                  <h2>
                    {layoutEditor.kind === 'area'
                      ? 'Cấu hình khu vực'
                      : 'Cấu hình dãy trong khu vực'}
                  </h2>
                </div>
                <button onClick={() => setLayoutEditor(null)}>
                  <X />
                </button>
              </header>
              <div className="warehouse-action-form">
                <label>
                  Tên {layoutEditor.kind === 'area' ? 'khu vực' : 'dãy'}
                  <input
                    value={layoutEditor.name}
                    onChange={(e) => setLayoutEditor({ ...layoutEditor, name: e.target.value })}
                  />
                </label>
                <label>
                  Mô tả
                  <textarea
                    value={layoutEditor.description}
                    onChange={(e) =>
                      setLayoutEditor({ ...layoutEditor, description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Sức chứa (kg)
                  <input
                    type="number"
                    min={Math.max(1, layoutEditor.currentKg, layoutEditor.allocatedKg)}
                    value={layoutEditor.capacityKg}
                    onChange={(e) =>
                      setLayoutEditor({ ...layoutEditor, capacityKg: Number(e.target.value) })
                    }
                  />
                  <small>
                    Đang chứa: {layoutEditor.currentKg} kg
                    {layoutEditor.kind === 'area'
                      ? ` · Đã cấp cho các dãy: ${layoutEditor.allocatedKg} kg`
                      : ''}
                  </small>
                </label>
                {layoutEditor.kind === 'group' && (
                  <div className="warehouse-capacity-rule">
                    <b>Quy tắc sức chứa</b>
                    <span>Tổng capacity tất cả dãy không được vượt capacity của khu vực.</span>
                  </div>
                )}
                <div className="warehouse-layout-editor-actions">
                  {layoutEditor.id ? (
                    <button
                      className="ops-btn teams-danger-btn"
                      onClick={() => setDeleteLayoutConfirm(true)}
                      disabled={savingLayout}
                    >
                      <Trash2 />
                      Xóa
                    </button>
                  ) : (
                    <span />
                  )}
                  <div>
                    <button
                      className="ops-btn ops-btn-secondary"
                      onClick={() => setLayoutEditor(null)}
                    >
                      Hủy
                    </button>
                    <button
                      className="ops-btn ops-btn-primary"
                      onClick={saveLayoutEntity}
                      disabled={savingLayout}
                    >
                      {savingLayout ? 'Đang lưu...' : 'Lưu cấu hình'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        {deleteLayoutConfirm && layoutEditor && (
          <WarehouseDeleteConfirmModal
            title={`Xóa ${layoutEditor.kind === 'area' ? 'khu vực' : 'dãy'} “${layoutEditor.name}”?`}
            message="Chỉ xóa được khi không còn hàng tồn hoặc Intake Batch. Các vị trí trống bên trong sẽ được ngừng hoạt động."
            pending={savingLayout}
            onCancel={() => setDeleteLayoutConfirm(false)}
            onConfirm={() => void deleteLayoutEntity()}
          />
        )}
        {locationEditor && (
          <div
            className="ops-modal-overlay warehouse-detail-overlay"
            onMouseDown={() => !savingLayout && setLocationEditor(null)}
          >
            <section
              className="ops-panel warehouse-layout-editor"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header>
                <div>
                  <span>{locationEditor.id ? 'CHỈNH SỬA' : 'THÊM MỚI'} LOCATION</span>
                  <h2>Vị trí lưu trữ trong dãy</h2>
                </div>
                <button onClick={() => setLocationEditor(null)}>
                  <X />
                </button>
              </header>
              <div className="warehouse-action-form">
                <label>
                  Mã location
                  <input
                    value={locationEditor.locationCode}
                    onChange={(e) =>
                      setLocationEditor({
                        ...locationEditor,
                        locationCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="CHARITY-A02-R01-S01-B01"
                  />
                </label>
                <div className="warehouse-form-row">
                  <label>
                    Dãy / lối
                    <input
                      value={locationEditor.aisleCode}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          aisleCode: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label>
                    Kệ
                    <input
                      value={locationEditor.rackCode}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          rackCode: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label>
                    Tầng
                    <input
                      value={locationEditor.shelfCode}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          shelfCode: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label>
                    Ô chứa
                    <input
                      value={locationEditor.binCode}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          binCode: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="warehouse-form-row">
                  <label>
                    Loại đồ ưu tiên
                    <input
                      value={locationEditor.preferredGarmentGroup}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          preferredGarmentGroup: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Hướng xử lý ưu tiên
                    <select
                      value={locationEditor.preferredProcessingDirection}
                      onChange={(e) =>
                        setLocationEditor({
                          ...locationEditor,
                          preferredProcessingDirection: e.target.value,
                        })
                      }
                    >
                      <option value="">Đa mục đích</option>
                      <option value="Charity">Từ thiện</option>
                      <option value="Recycling">Tái chế</option>
                      <option value="Disposal">Tiêu hủy</option>
                    </select>
                  </label>
                </div>
                <div className="warehouse-form-row">
                  <label>
                    Sức chứa (kg)
                    <input
                      type="number"
                      min={Math.max(1, locationEditor.currentWeightKg)}
                      value={locationEditor.capacityKg}
                      onChange={(e) =>
                        setLocationEditor({ ...locationEditor, capacityKg: Number(e.target.value) })
                      }
                    />
                    <small>
                      Dãy đã phân bổ {locationEditor.allocatedKg}/{locationEditor.groupCapacityKg}{' '}
                      kg
                    </small>
                  </label>
                  <label>
                    Trạng thái
                    <select
                      value={locationEditor.status}
                      onChange={(e) =>
                        setLocationEditor({ ...locationEditor, status: e.target.value })
                      }
                    >
                      <option value="Available">Available</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </label>
                </div>
                <div className="warehouse-capacity-rule">
                  <b>Quy tắc capacity</b>
                  <span>
                    Tổng capacity location không được vượt capacity dãy; location còn hàng không thể
                    giảm dưới khối lượng hiện tại hoặc bị xóa.
                  </span>
                </div>
                <div className="warehouse-layout-editor-actions">
                  {locationEditor.id ? (
                    <button
                      className="ops-btn teams-danger-btn"
                      onClick={() => setDeleteLocationConfirm(true)}
                    >
                      <Trash2 />
                      Xóa
                    </button>
                  ) : (
                    <span />
                  )}
                  <div>
                    <button
                      className="ops-btn ops-btn-secondary"
                      onClick={() => setLocationEditor(null)}
                    >
                      Hủy
                    </button>
                    <button
                      className="ops-btn ops-btn-primary"
                      onClick={saveLocation}
                      disabled={savingLayout}
                    >
                      {savingLayout ? 'Đang lưu...' : 'Lưu location'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        {deleteLocationConfirm && locationEditor && (
          <WarehouseDeleteConfirmModal
            title={`Xóa vị trí “${locationEditor.locationCode}”?`}
            message="Chỉ xóa được khi vị trí không còn hàng tồn hoặc Intake Batch."
            pending={savingLayout}
            onCancel={() => setDeleteLocationConfirm(false)}
            onConfirm={() => void deleteLocation()}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function WarehouseDeleteConfirmModal({
  title,
  message,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, pending]);

  return createPortal(
    <div
      className="warehouse-confirm-overlay"
      role="presentation"
      onMouseDown={() => !pending && onCancel()}
    >
      <section
        className="warehouse-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="warehouse-delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className="warehouse-confirm-icon"><AlertTriangle /></span>
          <div>
            <small>XÁC NHẬN XÓA</small>
            <h2 id="warehouse-delete-title">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} disabled={pending} aria-label="Đóng">
            <X />
          </button>
        </header>
        <p>{message}</p>
        <footer>
          <button className="ops-btn ops-btn-secondary" type="button" onClick={onCancel} disabled={pending}>
            Hủy
          </button>
          <button className="ops-btn teams-danger-solid" type="button" onClick={onConfirm} disabled={pending}>
            <Trash2 size={16} />
            {pending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function LayoutView({
  layout,
  onLocation,
  onEdit,
  onEditLocation,
}: {
  layout: WarehouseLayout | null;
  onLocation: (x: any) => void;
  onEdit: (x: LayoutEditor) => void;
  onEditLocation: (x: LocationEditor) => void;
}) {
  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(new Set());

  if (!layout)
    return (
      <div className="ops-empty">
        <Warehouse size={36} />
        <h4>Chưa có sơ đồ kho</h4>
      </div>
    );
  return (
    <div className="warehouse-layout-view">
      <div className="warehouse-layout-title">
        <div>
          <span>SƠ ĐỒ LƯU TRỮ</span>
          <h2>
            {layout.areas.length} khu vực ·{' '}
            {layout.areas.reduce((sum, x) => sum + x.groups.length, 0)} dãy
          </h2>
        </div>
        <button
          className="ops-btn ops-btn-primary"
          onClick={() =>
            onEdit({
              kind: 'area',
              name: '',
              description: '',
              capacityKg: 1000,
              currentKg: 0,
              allocatedKg: 0,
            })
          }
        >
          <Plus />
          Thêm khu vực
        </button>
      </div>
      <section className="warehouse-code-guide">
        <div>
          <MapPin size={19} />
          <span>
            <strong>Cách đọc mã vị trí kho</strong>
            <small>Mã được đọc từ khu vực lớn đến ô chứa nhỏ nhất.</small>
          </span>
        </div>
        <div className="warehouse-code-example">
          <b>CHARITY</b>
          <i>–</i>
          <b>A01</b>
          <i>–</i>
          <b>R01</b>
          <i>–</i>
          <b>S01</b>
          <i>–</i>
          <b>B01</b>
        </div>
        <div className="warehouse-code-meanings">
          <span>
            <b>CHARITY</b>Khu hàng từ thiện
          </span>
          <span>
            <b>A01</b>Dãy / lối đi số 01
          </span>
          <span>
            <b>R01</b>Kệ số 01
          </span>
          <span>
            <b>S01</b>Tầng kệ số 01
          </span>
          <span>
            <b>B01</b>Ô chứa số 01
          </span>
        </div>
      </section>
      {layout.areas.map((area) => {
        const used = area.capacityKg
          ? Math.round((area.currentWeightKg / area.capacityKg) * 100)
          : 0;
        const allocated = area.groups.reduce((sum, x) => sum + x.capacityKg, 0);
        const expanded = expandedAreaIds.has(area.id);
        const isStagingArea = area.areaType !== 'Storage';
        const toggleArea = () => {
          setExpandedAreaIds((current) => {
            const next = new Set(current);
            if (next.has(area.id)) next.delete(area.id);
            else next.add(area.id);
            return next;
          });
        };
        return (
          <section className={`warehouse-area-card ${expanded ? 'expanded' : 'collapsed'}`} key={area.id}>
            <header>
              <button className="warehouse-area-summary" onClick={toggleArea} type="button">
                <span>KHU VỰC</span>
                <h3>{area.areaName}</h3>
                <p>{area.description}</p>
              </button>
              <div className="warehouse-area-actions">
                <b>
                  {area.currentWeightKg}/{area.capacityKg} kg
                </b>
                <button
                  onClick={() =>
                    onEdit({
                      kind: 'area',
                      id: area.id,
                      name: area.areaName,
                      description: area.description || '',
                      capacityKg: area.capacityKg,
                      currentKg: area.currentWeightKg,
                      allocatedKg: allocated,
                    })
                  }
                >
                  <Pencil />
                  Sửa
                </button>
                <button
                  className="warehouse-area-toggle"
                  onClick={toggleArea}
                  title={expanded ? 'Thu gọn khu vực' : 'Mở rộng khu vực'}
                  type="button"
                >
                  <ChevronDown className={expanded ? 'expanded' : ''} />
                </button>
              </div>
            </header>
            {expanded && (
              <div className="warehouse-area-content">
            <div className="warehouse-capacity">
              <i style={{ width: `${Math.min(100, used)}%` }} />
            </div>
            {area.areaType !== 'Storage' && (
              <div className="warehouse-group-list">
                {(area.intakeBatches ?? []).map((batch) => (
                  <div className="warehouse-group-row" key={batch.id}>
                    <span>
                      <Archive size={14} />
                      <b>{batch.batchCode}</b>
                      <small>
                        {getStatusLabel(batch.status)} · {batch.totalWeight.toFixed(1)} kg ·{' '}
                        {batch.donationRequests} đơn
                      </small>
                    </span>
                    <span className="warehouse-staging-meta">
                      {batch.groupName && <small>Vị trí: {batch.groupName}</small>}
                      {batch.warehouseReceivedAt && <small>Nhập lúc: {new Date(batch.warehouseReceivedAt).toLocaleString('vi-VN')}</small>}
                      {batch.warehouseReceivedBy && <small>Thực hiện: {batch.warehouseReceivedBy}</small>}
                      {batch.teamName && <small>{batch.teamName}</small>}
                    </span>
                  </div>
                ))}
                {!area.intakeBatches?.length && <small>Chưa có lô hàng trong khu này.</small>}
              </div>
            )}
            <div className="warehouse-group-head">
              <span>
                DÃY TRONG KHU VỰC · Đã phân bổ {allocated}/{area.capacityKg} kg
              </span>
              <button
                onClick={() =>
                  onEdit({
                    kind: 'group',
                    areaId: area.id,
                    name: '',
                    description: '',
                    capacityKg: Math.max(1, area.capacityKg - allocated),
                    currentKg: 0,
                    allocatedKg: allocated,
                  })
                }
                disabled={allocated >= area.capacityKg}
              >
                <Plus />
                Thêm dãy
              </button>
            </div>
            <div className="warehouse-group-list">
              {area.groups.map((group) => {
                const groupLocations = area.locations.filter(
                  (location) => location.areaGroupId === group.id,
                );
                const locationCapacity = groupLocations.reduce(
                  (sum, location) => sum + location.capacityKg,
                  0,
                );
                return (
                  <div className="warehouse-group-block" key={group.id}>
                    <div className="warehouse-group-row">
                      <span>
                        <Archive size={14} />
                        <b>{group.groupName}</b>
                        <small>
                          {isStagingArea
                            ? `${groupLocations.reduce((sum, location) => sum + location.itemQuantity, 0)} batch · `
                            : ''}
                          {group.currentWeightKg}/{group.capacityKg} kg · {groupLocations.length} location
                        </small>
                      </span>
                      <div>
                        <button
                          onClick={() =>
                            onEditLocation({
                              areaGroupId: group.id,
                              locationCode: '',
                              aisleCode: 'A01',
                              rackCode: 'R01',
                              shelfCode: 'S01',
                              binCode: 'B01',
                              preferredGarmentGroup: '',
                              preferredProcessingDirection: '',
                              capacityKg: Math.max(1, group.capacityKg - locationCapacity),
                              currentWeightKg: 0,
                              allocatedKg: locationCapacity,
                              groupCapacityKg: group.capacityKg,
                              status: 'Available',
                            })
                          }
                          disabled={locationCapacity >= group.capacityKg}
                        >
                          <Plus />
                          Vị trí
                        </button>
                        <button
                          onClick={() =>
                            onEdit({
                              kind: 'group',
                              id: group.id,
                              areaId: area.id,
                              name: group.groupName,
                              description: group.description || '',
                              capacityKg: group.capacityKg,
                              currentKg: group.currentWeightKg,
                              allocatedKg: allocated - group.capacityKg,
                            })
                          }
                        >
                          <Pencil />
                          Sửa dãy
                        </button>
                      </div>
                    </div>
                    <div className="warehouse-location-grid">
                      {groupLocations.map((location) => (
                        <div
                          className={`warehouse-location-card ${location.status.toLowerCase()}`}
                          key={location.id}
                        >
                          <button
                            title={`${decodeLocationCode(location.locationCode).area} · Dãy ${location.aisleCode} · Kệ ${location.rackCode} · Tầng ${location.shelfCode} · Ô ${location.binCode}`}
                            onClick={() => onLocation({ ...location, areaName: area.areaName })}
                          >
                            <MapPin size={14} />
                            <strong>{location.locationCode}</strong>
                            <small>
                              {location.itemQuantity} {isStagingArea ? 'batch' : 'item'} · {location.currentWeightKg}/
                              {location.capacityKg} kg
                            </small>
                          </button>
                          <button
                            className="warehouse-location-edit"
                            title="Chỉnh sửa location"
                            onClick={() =>
                              onEditLocation({
                                id: location.id,
                                areaGroupId: group.id,
                                locationCode: location.locationCode,
                                aisleCode: location.aisleCode,
                                rackCode: location.rackCode,
                                shelfCode: location.shelfCode,
                                binCode: location.binCode,
                                preferredGarmentGroup: location.preferredGarmentGroup || '',
                                preferredProcessingDirection:
                                  location.preferredProcessingDirection || '',
                                capacityKg: location.capacityKg,
                                currentWeightKg: location.currentWeightKg,
                                allocatedKg: locationCapacity - location.capacityKg,
                                groupCapacityKg: group.capacityKg,
                                status: location.status,
                              })
                            }
                          >
                            <Pencil />
                          </button>
                        </div>
                      ))}
                      {!groupLocations.length && (
                        <small className="warehouse-no-location">
                          Chưa có location trong dãy này.
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
              {!area.groups.length && <small>Chưa có dãy trong khu vực này.</small>}
            </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
function IntakeCard({ item, onOpen }: { item: WarehouseIntakeTrace; onOpen: () => void }) {
  return (
    <article className="warehouse-record-card">
      <header>
        <div>
          <span>LÔ HÀNG</span>
          <strong>{item.batchCode}</strong>
        </div>
        <b>{getStatusLabel(item.status)}</b>
      </header>
      <p>{item.routeName || 'Không có tên tuyến'}</p>
      <div className="warehouse-record-kpis">
        <span>
          <b>{item.donationRequests}</b> đơn donor
        </span>
        <span>
          <b>{item.classifiedItems}</b> item phân loại
        </span>
        <span>
          <b>{item.classifiedBatches.length}</b> batch đầu ra
        </span>
      </div>
      <footer>
        <small>{new Date(item.intakeDate).toLocaleString('vi-VN')}</small>
        <button onClick={onOpen}>
          <Eye />
          Truy vết
        </button>
      </footer>
    </article>
  );
}
function BatchCard({
  item,
  onOpen,
  onAction,
}: {
  item: WarehouseBatch;
  onOpen: () => void;
  onAction: (mode: 'receipt' | 'putaway') => void;
}) {
  return (
    <article className="warehouse-record-card">
      <header>
        <div>
          <span>CLASSIFIED / INBOUND</span>
          <strong>{item.batchCode}</strong>
        </div>
        <b className={item.status}>{statusLabel[item.status] || getStatusLabel(item.status)}</b>
      </header>
      <h3>
        {item.clothingType} · {item.fabricType}
      </h3>
      <p>
        Nhãn {item.conditionGrade} · {item.gender} · {item.targetUser} · Size {item.size}
      </p>
      <div className="warehouse-record-kpis">
        <span>
          <b>{item.receivedItemCount ?? item.expectedItemCount}</b> item
        </span>
        <span>
          <b>{item.receivedWeightKg ?? item.expectedWeightKg}</b> kg
        </span>
        <span>
          <b>{item.processingDirection}</b> hướng xử lý
        </span>
      </div>
      <footer>
        <button onClick={onOpen}>
          <Eye />
          Chi tiết
        </button>
        <div>
          {item.status === 'PendingWarehouseReceipt' && (
            <button onClick={() => onAction('receipt')}>
              <ArrowDownToLine />
              Nhận kho
            </button>
          )}
          {item.status === 'WarehouseReceived' && (
            <button onClick={() => onAction('putaway')}>
              <MapPin />
              Xếp vị trí
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
function InventoryCard({
  item,
  onOpen,
}: {
  item: WarehouseInventory;
  onOpen: () => void;
}) {
  return (
    <article className="warehouse-record-card">
      <header>
        <div>
          <span>INVENTORY SKU</span>
          <strong>{item.sku}</strong>
        </div>
        <b>{statusLabel[item.status] || getStatusLabel(item.status)}</b>
      </header>
      <h3>
        {item.clothingType} · {item.fabricType}
      </h3>
      <p>
        {item.locationCode} · {item.areaName}
      </p>
      <div className="warehouse-record-kpis">
        <span>
          <b>{item.availableWeightKg}</b> kg khả dụng
        </span>
        <span>
          <b>{item.reservedWeightKg}</b> kg giữ chỗ
        </span>
        <span>
          <b>{item.totalWeightKg}</b> kg tổng tồn
        </span>
      </div>
      <footer>
        <button onClick={onOpen}>
          <Eye />
          Chi tiết
        </button>
      </footer>
    </article>
  );
}
function TransactionCard({ item, onOpen }: { item: WarehouseTransaction; onOpen: () => void }) {
  const Icon = txIcon[item.transactionType] || ClipboardList;
  return (
    <article className="warehouse-record-card transaction">
      <header>
        <div>
          <span>WAREHOUSE TRANSACTION</span>
          <strong>{item.transactionCode}</strong>
        </div>
        <b>
          <Icon />
          {item.transactionType}
        </b>
      </header>
      <p>
        {item.performedBy} · {new Date(item.performedAt).toLocaleString('vi-VN')}
      </p>
      <div className="warehouse-record-kpis">
        <span>
          <b>{item.items.length}</b> dòng hàng
        </span>
        <span>
          <b>{getStatusLabel(item.status)}</b> trạng thái
        </span>
        <span>
          <b>{item.referenceType || 'Nội bộ'}</b> tham chiếu
        </span>
      </div>
      <footer>
        <small>{item.notes || 'Không có ghi chú'}</small>
        <button onClick={onOpen}>
          <Eye />
          Chi tiết
        </button>
      </footer>
    </article>
  );
}

function DetailModal({
  detail,
  action,
  locations,
  form,
  setForm,
  onAction,
  onSubmit,
  onClose,
}: {
  detail: { kind: string; data: any };
  action: 'issue' | 'move' | 'receipt' | 'putaway' | null;
  locations: StorageLocation[];
  form: any;
  setForm: (x: any) => void;
  onAction: (x: 'issue' | 'move' | 'receipt' | 'putaway' | null) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const d = detail.data;
  return (
    <div className="ops-modal-overlay warehouse-detail-overlay" onMouseDown={onClose}>
      <section
        className="ops-panel warehouse-detail-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>CHI TIẾT {detail.kind.toUpperCase()}</span>
            <h2>{d.batchCode || d.sku || d.transactionCode || d.locationCode}</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        {detail.kind === 'intake' && (
          <>
            <div className="warehouse-lineage">
              <b>{d.batchCode}</b>
              <i>→</i>
              <span>{d.classifiedItems} Classified Item</span>
              <i>→</i>
              <span>{d.classifiedBatches.length} Classified Batch</span>
              <i>→</i>
              <span>Inventory / vị trí</span>
            </div>
            <div className="warehouse-detail-list">
              {d.classifiedBatches.map((batch: any) => (
                <div key={batch.id}>
                  <span>
                    <strong>{batch.batchCode}</strong>
                    <small>
                      {batch.clothingType} · Nhãn {batch.conditionGrade} ·{' '}
                      {batch.processingDirection}
                    </small>
                  </span>
                  <span>
                    <b>
                      {batch.itemCount} item · {batch.weightKg} kg
                    </b>
                    <small>
                      {batch.inventorySku || 'Chưa nhập kho'} ·{' '}
                      {batch.locationCode || 'Chưa có vị trí'}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        {detail.kind === 'batch' && !action && (
          <>
            <div className="warehouse-detail-grid">
              <span>
                Trạng thái<b>{statusLabel[d.status] || getStatusLabel(d.status)}</b>
              </span>
              <span>
                Phân loại
                <b>
                  {d.clothingType} · {d.fabricType}
                </b>
              </span>
              <span>
                Thuộc tính
                <b>
                  {d.gender} · {d.targetUser} · {d.size}
                </b>
              </span>
              <span>
                Nhãn / xử lý
                <b>
                  {d.conditionGrade} · {d.processingDirection}
                </b>
              </span>
              <span>
                Dự kiến
                <b>
                  {d.expectedItemCount} item · {d.expectedWeightKg} kg
                </b>
              </span>
              <span>
                Thực nhận
                <b>
                  {d.receivedItemCount ?? '—'} item · {d.receivedWeightKg ?? '—'} kg
                </b>
              </span>
            </div>
            <p>{d.receiptNotes || 'Chưa có ghi chú tiếp nhận.'}</p>
          </>
        )}
        {detail.kind === 'batch' && action === 'receipt' && (
          <div className="warehouse-action-form">
            <h3>Xác nhận nhận Classified Batch vào kho</h3>
            <div className="warehouse-form-row">
              <label>
                Khối lượng thực nhận (kg)
                <input
                  type="number"
                  min=".01"
                  step=".01"
                  value={form.actualWeightKg}
                  onChange={(e) => setForm({ ...form, actualWeightKg: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="warehouse-check">
              <input
                type="checkbox"
                checked={form.sealIntact}
                onChange={(e) => setForm({ ...form, sealIntact: e.target.checked })}
              />
              Niêm phong / tình trạng bàn giao nguyên vẹn
            </label>
            <label>
              Ghi chú sai lệch
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={form.sealIntact ? 'Ghi chú tùy chọn' : 'Bắt buộc mô tả sai lệch'}
              />
            </label>
            <div className="warehouse-modal-actions">
              <button className="ops-btn ops-btn-secondary" onClick={() => onAction(null)}>
                Quay lại
              </button>
              <button className="ops-btn ops-btn-primary" onClick={onSubmit}>
                Xác nhận nhập kho
              </button>
            </div>
          </div>
        )}
        {detail.kind === 'batch' && action === 'putaway' && (
          <div className="warehouse-action-form">
            <h3>Xếp batch vào vị trí lưu trữ</h3>
            <label>
              Vị trí được hệ thống đề xuất
              <select
                value={form.destinationLocationId}
                onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })}
              >
                {locations.map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.locationCode} · {x.areaName} · còn {x.availableCapacityKg} kg · phù hợp{' '}
                    {x.matchScore}%
                  </option>
                ))}
              </select>
            </label>
            <div className="warehouse-location-hint">
              {locations.slice(0, 3).map((x) => (
                <span key={x.id}>
                  <b>{x.locationCode}</b>
                  <small>
                    {x.preferredProcessingDirection || 'Đa mục đích'} · còn {x.availableCapacityKg}{' '}
                    kg
                  </small>
                </span>
              ))}
            </div>
            <label>
              Ghi chú xếp kho
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <div className="warehouse-modal-actions">
              <button className="ops-btn ops-btn-secondary" onClick={() => onAction(null)}>
                Quay lại
              </button>
              <button
                className="ops-btn ops-btn-primary"
                onClick={onSubmit}
                disabled={!form.destinationLocationId}
              >
                Xác nhận PUTAWAY
              </button>
            </div>
          </div>
        )}
        {detail.kind === 'location' && (
          <>
            <div className="warehouse-location-decoded">
              {Object.entries(decodeLocationCode(d.locationCode)).map(([key, value]) => (
                <span key={key}>
                  <b>
                    {key === 'area'
                      ? 'Khu vực'
                      : key === 'aisle'
                        ? 'Dãy / lối đi'
                        : key === 'rack'
                          ? 'Kệ'
                          : key === 'shelf'
                            ? 'Tầng kệ'
                            : 'Ô chứa'}
                  </b>
                  {value}
                </span>
              ))}
            </div>
            <div className="warehouse-detail-grid">
              <span>
                Khu vực<b>{d.areaName}</b>
              </span>
              <span>
                Mã vị trí đầy đủ<b>{d.locationCode}</b>
              </span>
              <span>
                Dãy / kệ / tầng / ô
                <b>
                  {d.aisleCode} / {d.rackCode} / {d.shelfCode} / {d.binCode}
                </b>
              </span>
              <span>
                Đang chứa / Tổng sức chứa
                <b>
                  {d.currentWeightKg}/{d.capacityKg} kg
                </b>
              </span>
              <span>
                Tồn tại vị trí
                <b>
                  {d.inventoryCount} SKU · {d.itemQuantity} item
                </b>
              </span>
              <span>
                Trạng thái<b>{getStatusLabel(d.status)}</b>
              </span>
            </div>
          </>
        )}
        {detail.kind === 'transaction' && (
          <>
            <div className="warehouse-detail-grid">
              <span>
                Loại giao dịch<b>{d.transactionType}</b>
              </span>
              <span>
                Người thực hiện<b>{d.performedBy}</b>
              </span>
              <span>
                Thời gian<b>{new Date(d.performedAt).toLocaleString('vi-VN')}</b>
              </span>
              <span>
                Tham chiếu<b>{d.referenceType || '—'}</b>
              </span>
            </div>
            <div className="warehouse-detail-list">
              {d.items.map((item: any) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.sku}</strong>
                    <small>
                      {item.sourceLocationCode || 'RECEIVING'} →{' '}
                      {item.destinationLocationCode || 'OUTBOUND'}
                    </small>
                  </span>
                  <span>
                    <b>
                      {item.weightBefore} → {item.weightAfter} kg
                    </b>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        {detail.kind === 'inventory' && !action && (
          <>
            <div className="warehouse-detail-grid">
              <span>
                Classified Batch<b>{d.batchCode}</b>
              </span>
              <span>
                Vị trí
                <b>
                  {d.locationCode} · {d.areaName}
                </b>
              </span>
              <span>
                Phân loại
                <b>
                  {d.clothingType} · {d.fabricType}
                </b>
              </span>
              <span>
                Thuộc tính
                <b>
                  {d.gender} · {d.targetUser} · {d.size}
                </b>
              </span>
              <span>
                Tổng tồn
                <b>
                  {d.totalWeightKg} kg
                </b>
              </span>
              <span>
                Khả dụng
                <b>
                  {d.availableWeightKg} kg
                </b>
              </span>
            </div>
          </>
        )}
        {detail.kind === 'inventory' && action && (
          <div className="warehouse-action-form">
            <h3>{action === 'issue' ? 'Phiếu xuất kho' : 'Điều chuyển vị trí nội bộ'}</h3>
            {action === 'issue' ? (
              <div className="warehouse-form-row">
                <label>
                  Khối lượng (kg)
                  <input
                    type="number"
                    min=".01"
                    max={d.availableWeightKg}
                    step=".01"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                  />
                </label>
              </div>
            ) : (
              <label>
                Vị trí đích
                <select
                  value={form.destinationLocationId}
                  onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })}
                >
                  {locations.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.locationCode} · còn {x.availableCapacityKg} kg · điểm {x.matchScore}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Lý do
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </label>
            <label>
              Ghi chú
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <div className="warehouse-modal-actions">
              <button className="ops-btn ops-btn-secondary" onClick={() => onAction(null)}>
                Quay lại
              </button>
              <button className="ops-btn ops-btn-primary" onClick={onSubmit}>
                Xác nhận và ghi sổ
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
