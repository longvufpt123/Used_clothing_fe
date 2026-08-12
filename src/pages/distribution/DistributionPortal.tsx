import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
  PackageCheck,
  Pencil,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  distributionService,
  type CatalogItem,
  type DistributionRequest,
} from '@/services/distributionService';
import { useToast } from '@/context/ToastContext';
import { getStatusLabel } from '@/utils/statusLabels';
import ghnAdministrative from '@/ghnAdministrative.json';
import './DistributionPortal.css';
import './ProductCatalogModal.css';

type Mode = 'organization' | 'manager' | 'warehouse';

export default function DistributionPortal({ mode }: { mode: Mode }) {
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<DistributionRequest[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [warehouses, setWarehouses] = useState<
    { id: string; warehouseName: string; address: string }[]
  >([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [selectedItemCodes, setSelectedItemCodes] = useState<Record<string, string[]>>({});
  const [activeBatch, setActiveBatch] = useState<CatalogItem | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [requestWarehouse, setRequestWarehouse] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DistributionRequest | null>(null);
  const [detailRequest, setDetailRequest] = useState<DistributionRequest | null>(null);
  const [ghnTarget, setGhnTarget] = useState<DistributionRequest | null>(null);
  const [ghnSubmitting, setGhnSubmitting] = useState(false);
  const [ghnErrors, setGhnErrors] = useState<Record<string, string>>({});
  const [ghnForm, setGhnForm] = useState({
    provinceId: '',
    provinceName: '',
    paymentTypeId: '1',
    serviceTypeId: '2',
    requiredNote: 'KHONGCHOXEMHANG',
    toDistrictId: '',
    districtName: '',
    toWardCode: '',
    wardName: '',
  });
  const [form, setForm] = useState({
    recipientName: '',
    recipientPhone: '',
    toAddress: '',
    notes: '',
  });

  const load = async () => {
    try {
      if (mode === 'organization') {
        const [cat, mine] = await Promise.all([
          distributionService.catalog(warehouseId || undefined),
          distributionService.mine(),
        ]);
        setCatalog(cat.items);
        setWarehouses(cat.warehouses);
        setRequests(mine);
      } else
        setRequests(
          mode === 'manager'
            ? await distributionService.manager()
            : await distributionService.warehouse(),
        );
    } catch {
      toast.error('Không thể tải dữ liệu phân phối.');
    }
  };
  useEffect(() => {
    load();
  }, [mode, warehouseId]);
  useEffect(() => {
    if (!activeBatch) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setActiveBatch(null);
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflow = '';
    };
  }, [activeBatch]);
  useEffect(() => {
    setProductPage(1);
  }, [activeBatch?.inventoryId]);

  const shown = useMemo(
    () =>
      catalog.filter((x) =>
        `${x.batchCode} ${x.clothingType} ${x.fabricType} ${x.gender} ${x.size}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [catalog, search],
  );
  const catalogPageSize = 6;
  const catalogPageCount = Math.max(1, Math.ceil(shown.length / catalogPageSize));
  const pagedCatalog = shown.slice(
    (catalogPage - 1) * catalogPageSize,
    catalogPage * catalogPageSize,
  );
  const productPageSize = 6;
  const productPageCount = activeBatch
    ? Math.max(1, Math.ceil(activeBatch.items.length / productPageSize))
    : 1;
  const pagedProducts =
    activeBatch?.items.slice((productPage - 1) * productPageSize, productPage * productPageSize) ||
    [];
  const organizationView =
    location.pathname.split('/').length > 3 ? 'requests' : searchParams.get('tab') || 'catalog';
  const requestPageSize = 5;
  const requestWarehouses = useMemo(
    () => Array.from(new Set(requests.map((request) => request.warehouseName))).sort(),
    [requests],
  );
  const requestStatuses = useMemo(
    () => Array.from(new Set(requests.map((request) => request.status))).sort(),
    [requests],
  );
  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();
    return requests.filter(
      (request) =>
        (organizationView !== 'tracking' || !!request.ghnOrderCode) &&
        (!requestStatus || request.status === requestStatus) &&
        (!requestWarehouse || request.warehouseName === requestWarehouse) &&
        (!requestDate || request.requestedAt.slice(0, 10) === requestDate) &&
        (!query ||
          `${request.code} ${request.organizationName} ${request.recipientName} ${request.recipientPhone} ${request.toAddress}`
            .toLowerCase()
            .includes(query)),
    );
  }, [requests, organizationView, requestStatus, requestWarehouse, requestDate, requestSearch]);
  const requestPageCount = Math.max(1, Math.ceil(filteredRequests.length / requestPageSize));
  const pagedRequests = filteredRequests.slice(
    (requestPage - 1) * requestPageSize,
    requestPage * requestPageSize,
  );
  useEffect(() => {
    setCatalogPage(1);
  }, [warehouseId, search]);
  useEffect(
    () => setRequestPage(1),
    [requestSearch, requestStatus, requestWarehouse, requestDate, organizationView],
  );
  useEffect(() => {
    if (requestPage > requestPageCount) setRequestPage(requestPageCount);
  }, [requestPage, requestPageCount]);
  useEffect(() => {
    if (catalogPage > catalogPageCount) setCatalogPage(catalogPageCount);
  }, [catalogPage, catalogPageCount]);
  const setQuantity = (batch: CatalogItem, quantity: number) => {
    const normalized = Math.min(batch.availableQuantity, Math.max(0, quantity));
    setSelected((value) => ({ ...value, [batch.inventoryId]: normalized }));
    setSelectedItemCodes((value) => ({
      ...value,
      [batch.inventoryId]: batch.items.slice(0, normalized).map((item) => item.itemCode),
    }));
  };
  const toggleProduct = (batch: CatalogItem, itemCode: string) => {
    setSelectedItemCodes((value) => {
      const current = value[batch.inventoryId] || [];
      const next = current.includes(itemCode)
        ? current.filter((code) => code !== itemCode)
        : [...current, itemCode];
      setSelected((quantity) => ({
        ...quantity,
        [batch.inventoryId]: next.length,
      }));
      return { ...value, [batch.inventoryId]: next };
    });
  };
  const create = async () => {
    if (
      !form.recipientName.trim() ||
      !form.recipientPhone.trim() ||
      !form.toAddress.trim() ||
      !form.notes.trim()
    )
      return toast.warning('Vui lòng nhập đầy đủ tất cả thông tin bắt buộc.');
    if (!/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(form.recipientPhone.replace(/[\s.\-()]/g, '')))
      return toast.warning('Số điện thoại nhận hàng không hợp lệ.');
    if (!warehouseId || !Object.values(selected).some((x) => x > 0))
      return toast.warning('Chọn kho và ít nhất một batch.');
    try {
      const payload = {
        warehouseId,
        ...form,
        items: Object.entries(selected)
          .filter(([, q]) => q > 0)
          .map(([inventoryId, quantity]) => ({ inventoryId, quantity })),
      };
      if (editingRequestId) await distributionService.update(editingRequestId, payload);
      else await distributionService.create(payload);
      setEditingRequestId(null);
      setForm({
        recipientName: '',
        recipientPhone: '',
        toAddress: '',
        notes: '',
      });
      setSelected({});
      setSelectedItemCodes({});
      toast.success('Đã gửi yêu cầu đến Manager.');
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo yêu cầu.');
    }
  };
  const startEdit = (request: DistributionRequest) => {
    setEditingRequestId(request.id);
    setWarehouseId(
      warehouses.find((warehouse) => warehouse.warehouseName === request.warehouseName)?.id || '',
    );
    setForm({
      recipientName: request.recipientName,
      recipientPhone: request.recipientPhone,
      toAddress: request.toAddress,
      notes: request.notes || '',
    });
    setSelected(
      Object.fromEntries(request.items.map((item) => [item.inventoryId, item.requestedQuantity])),
    );
    setSelectedItemCodes({});
    setSearchParams({ tab: 'catalog' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => {
    setEditingRequestId(null);
    setSelected({});
    setSelectedItemCodes({});
    setForm({
      recipientName: '',
      recipientPhone: '',
      toAddress: '',
      notes: '',
    });
  };
  const deleteRequest = async () => {
    if (!deleteTarget) return;
    try {
      await distributionService.remove(deleteTarget.id);
      toast.success('Đã xóa yêu cầu.');
      setDeleteTarget(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xóa yêu cầu.');
    }
  };
  const action = async (id: string, kind: 'approve' | 'reject' | 'issue' | 'refresh') => {
    try {
      if (kind === 'approve' || kind === 'reject')
        await distributionService.approve(
          id,
          kind === 'approve',
          kind === 'reject' ? 'Không phù hợp nhu cầu hiện tại' : undefined,
        );
      if (kind === 'issue') await distributionService.issue(id, 'Xuất theo yêu cầu tổ chức');
      if (kind === 'refresh') await distributionService.refresh(id);
      toast.success('Đã cập nhật.');
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const openGhnForm = (request: DistributionRequest) => {
    setGhnTarget(request);
    setGhnErrors({});
    setGhnForm({
      provinceId: '',
      provinceName: '',
      paymentTypeId: '1',
      serviceTypeId: '2',
      requiredNote: 'KHONGCHOXEMHANG',
      toDistrictId: '',
      districtName: '',
      toWardCode: '',
      wardName: '',
    });
  };

  const ghnDistricts = useMemo(
    () =>
      ghnAdministrative.districts.filter(
        (district) => String(district.provinceId) === ghnForm.provinceId,
      ),
    [ghnForm.provinceId],
  );
  const ghnWards = useMemo(
    () =>
      ghnAdministrative.wards.filter((ward) => String(ward.districtId) === ghnForm.toDistrictId),
    [ghnForm.toDistrictId],
  );

  const createGhnShipment = async () => {
    if (!ghnTarget) return;
    const errors: Record<string, string> = {};
    const districtId = Number(ghnForm.toDistrictId);
    if (!ghnForm.provinceId) errors.provinceId = 'Vui lòng chọn tỉnh/thành phố trong danh sách.';
    if (!ghnForm.toDistrictId.trim() || !Number.isInteger(districtId) || districtId <= 0)
      errors.toDistrictId = 'Vui lòng chọn quận/huyện trong danh sách.';
    if (!ghnForm.toWardCode.trim()) errors.toWardCode = 'Vui lòng chọn phường/xã trong danh sách.';
    if (!ghnForm.paymentTypeId) errors.paymentTypeId = 'Vui lòng chọn bên thanh toán phí.';
    if (!ghnForm.serviceTypeId) errors.serviceTypeId = 'Vui lòng chọn loại dịch vụ GHN.';
    if (!ghnForm.requiredNote) errors.requiredNote = 'Vui lòng chọn yêu cầu giao hàng.';
    setGhnErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      setGhnSubmitting(true);
      await distributionService.ghn(ghnTarget.id, {
        paymentTypeId: Number(ghnForm.paymentTypeId),
        serviceTypeId: Number(ghnForm.serviceTypeId),
        requiredNote: ghnForm.requiredNote,
        toDistrictId: districtId,
        toWardCode: ghnForm.toWardCode.trim(),
      });
      toast.success('Đã tạo vận đơn GHN.');
      setGhnTarget(null);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo vận đơn GHN.');
    } finally {
      setGhnSubmitting(false);
    }
  };

  return (
    <div className="distribution-page">
      <header>
        <span>CHARITY DISTRIBUTION</span>
        <h1>
          {mode === 'organization'
            ? 'Đăng ký nhận đồ từ thiện'
            : mode === 'manager'
              ? 'Duyệt yêu cầu phân phối'
              : 'Xuất kho & giao hàng GHN'}
        </h1>
        <p>Theo dõi minh bạch các đơn đã phân loại đến tổ chức tiếp nhận.</p>
      </header>
      {mode === 'organization' && organizationView === 'catalog' && (
        <>
          <section className="distribution-toolbar">
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">Chọn kho để xem tồn khả dụng</option>
              {warehouses.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.warehouseName}
                </option>
              ))}
            </select>
            <label>
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm batch, loại đồ, size..."
              />
            </label>
          </section>
          <div className="distribution-catalog">
            {pagedCatalog.map((batch) => (
              <article key={batch.inventoryId}>
                <div className="distribution-card-head">
                  <div>
                    <b>{batch.batchCode}</b>
                    <h3>
                      {batch.clothingType} · {batch.fabricType}
                    </h3>
                  </div>
                  <span>Nhãn {batch.grade}</span>
                </div>
                <p>
                  {batch.gender} · {batch.targetUser} · Size {batch.size}
                </p>
                <strong>
                  {batch.availableQuantity} item · {batch.availableWeight} kg khả dụng
                </strong>
                <button className="product-preview" onClick={() => setActiveBatch(batch)}>
                  <Eye size={18} /> Xem {batch.items.length} sản phẩm
                </button>
                <div className="quantity-picker">
                  <button onClick={() => setQuantity(batch, batch.availableQuantity)}>
                    Chọn tất cả
                  </button>
                  <label>
                    <span>Số lượng</span>
                    <input
                      type="number"
                      min="0"
                      max={batch.availableQuantity}
                      value={selected[batch.inventoryId] || 0}
                      onChange={(e) => setQuantity(batch, Number(e.target.value))}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
          {shown.length > catalogPageSize && (
            <nav className="catalog-pagination" aria-label="Phân trang danh sách batch">
              <span>
                Hiển thị {(catalogPage - 1) * catalogPageSize + 1}–
                {Math.min(catalogPage * catalogPageSize, shown.length)} trong {shown.length} batch
              </span>
              <div>
                <button
                  disabled={catalogPage === 1}
                  onClick={() => setCatalogPage((page) => page - 1)}
                  aria-label="Trang trước"
                >
                  <ChevronLeft />
                </button>
                {Array.from({ length: catalogPageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    className={page === catalogPage ? 'active' : ''}
                    onClick={() => setCatalogPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={catalogPage === catalogPageCount}
                  onClick={() => setCatalogPage((page) => page + 1)}
                  aria-label="Trang sau"
                >
                  <ChevronRight />
                </button>
              </div>
            </nav>
          )}
          <section className={`distribution-form${editingRequestId ? ' editing' : ''}`}>
            {editingRequestId && (
              <div className="edit-banner">
                <Pencil /> Đang chỉnh sửa yêu cầu chờ Manager duyệt
              </div>
            )}
            <h2>Tạo Distribution Request</h2>
            <label className="distribution-field">
              <span>
                Tên người/tổ chức nhận <b>*</b>
              </span>
              <input
                placeholder="Nhập tên người hoặc tổ chức nhận"
                value={form.recipientName}
                required
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              />
            </label>
            <label className="distribution-field">
              <span>
                Số điện thoại <b>*</b>
              </span>
              <input
                placeholder="Nhập số điện thoại"
                value={form.recipientPhone}
                required
                inputMode="tel"
                onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              />
            </label>
            <label className="distribution-field">
              <span>
                Địa chỉ nhận hàng <b>*</b>
              </span>
              <input
                placeholder="Nhập địa chỉ nhận hàng"
                value={form.toAddress}
                required
                onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
              />
            </label>
            <label className="distribution-field full">
              <span>
                Mục đích sử dụng / ghi chú <b>*</b>
              </span>
              <textarea
                placeholder="Mô tả mục đích sử dụng"
                value={form.notes}
                required
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            {editingRequestId && (
              <button className="cancel-edit" onClick={cancelEdit}>
                <X /> Hủy chỉnh sửa
              </button>
            )}
            <button onClick={create}>
              <Send /> Gửi yêu cầu ({Object.values(selected).reduce((a, b) => a + b, 0)} item)
            </button>
          </section>
        </>
      )}
      {(mode !== 'organization' || organizationView !== 'catalog') && (
        <section className="distribution-requests">
          <h2>{mode === 'organization' ? 'Yêu cầu của tổ chức' : 'Danh sách yêu cầu'}</h2>
          <div className="distribution-request-filters">
            <label>
              <Search size={16} />
              <input
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
                placeholder="Tìm mã yêu cầu, tổ chức, người nhận, SĐT..."
              />
            </label>
            <select
              value={requestStatus}
              onChange={(event) => setRequestStatus(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {requestStatuses.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            <select
              value={requestWarehouse}
              onChange={(event) => setRequestWarehouse(event.target.value)}
            >
              <option value="">Tất cả kho</option>
              {requestWarehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>
                  {warehouse}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={requestDate}
              onChange={(event) => setRequestDate(event.target.value)}
            />
            {(requestSearch || requestStatus || requestWarehouse || requestDate) && (
              <button
                type="button"
                onClick={() => {
                  setRequestSearch('');
                  setRequestStatus('');
                  setRequestWarehouse('');
                  setRequestDate('');
                }}
              >
                <X size={15} /> Xóa lọc
              </button>
            )}
            <span>
              {filteredRequests.length}/{requests.length} yêu cầu
            </span>
          </div>
          {!pagedRequests.length && (
            <div className="distribution-request-empty">
              <Search />
              Không tìm thấy yêu cầu phù hợp bộ lọc.
            </div>
          )}
          {pagedRequests.map((r) => (
            <article
              key={r.id}
              className="distribution-request-summary"
              onClick={() => setDetailRequest(r)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setDetailRequest(r);
              }}
            >
              <div className="request-title">
                <div>
                  <b>{r.code}</b>
                  <h3>
                    {r.organizationName} → {r.warehouseName}
                  </h3>
                </div>
                <span>{getStatusLabel(r.status)}</span>
              </div>
              <p>
                {r.recipientName} · {r.recipientPhone} · {r.toAddress}
              </p>
              <div className="request-summary-meta">
                <span>{r.items.length} batch</span>
                {r.issueSlipCode && <span>Đã lập phiếu xuất</span>}
                {r.ghnOrderCode && <span>GHN: {getStatusLabel(r.ghnStatus)}</span>}
              </div>
              <b className="request-summary-link">Xem chi tiết →</b>
            </article>
          ))}
          {requestPageCount > 1 && (
            <nav
              className="catalog-pagination distribution-request-pagination"
              aria-label="Phân trang yêu cầu phân phối"
            >
              <span>
                Hiển thị {(requestPage - 1) * requestPageSize + 1}–
                {Math.min(requestPage * requestPageSize, filteredRequests.length)} trong{' '}
                {filteredRequests.length} yêu cầu
              </span>
              <div>
                <button
                  disabled={requestPage === 1}
                  onClick={() => setRequestPage((page) => page - 1)}
                >
                  <ChevronLeft />
                </button>
                {Array.from({ length: requestPageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    className={page === requestPage ? 'active' : ''}
                    onClick={() => setRequestPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={requestPage === requestPageCount}
                  onClick={() => setRequestPage((page) => page + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </nav>
          )}
        </section>
      )}
      {detailRequest && (
        <div className="product-modal-backdrop" onMouseDown={() => setDetailRequest(null)}>
          <section
            className="distribution-detail-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <b>{detailRequest.code}</b>
                <h2>
                  {detailRequest.organizationName} → {detailRequest.warehouseName}
                </h2>
                <p>
                  {detailRequest.recipientName} · {detailRequest.recipientPhone} ·{' '}
                  {detailRequest.toAddress}
                </p>
              </div>
              <button aria-label="Đóng" onClick={() => setDetailRequest(null)}>
                <X />
              </button>
            </header>
            <span className="distribution-detail-status">{getStatusLabel(detailRequest.status)}</span>
            <div className="request-lines">
              {detailRequest.items.map((item) => (
                <div key={item.id}>
                  <PackageCheck />
                  <span>
                    <b>{item.batchCode}</b>
                    <small>
                      {item.clothingType} · {item.gender} · Size {item.size}
                    </small>
                  </span>
                  <strong>
                    {item.issuedQuantity || item.approvedQuantity || item.requestedQuantity} item ·{' '}
                    {item.issuedWeight || item.requestedWeight} kg
                  </strong>
                </div>
              ))}
            </div>
            {detailRequest.issueSlipCode && (
              <div className="issue-slip">
                <b>Phiếu xuất: {detailRequest.issueSlipCode}</b>
                <span>
                  Xuất lúc{' '}
                  {detailRequest.warehouseIssuedAt &&
                    new Date(detailRequest.warehouseIssuedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            )}
            {detailRequest.ghnOrderCode && (
              <div className="ghn-state">
                <Truck />
                <b>{detailRequest.ghnOrderCode}</b>
                <span>{getStatusLabel(detailRequest.ghnStatus)}</span>
              </div>
            )}
            {detailRequest.shipmentHistory?.length > 0 && (
              <div className="shipment-timeline">
                {detailRequest.shipmentHistory.map((h, i) => (
                  <div key={i}>
                    <i />
                    <span>
                      <b>{getStatusLabel(h.status)}</b>
                      <small>
                        {new Date(h.occurredAt).toLocaleString('vi-VN')} · {h.description}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="request-actions">
              {mode === 'organization' && detailRequest.status === 'PendingManagerApproval' && (
                <>
                  <button
                    onClick={() => {
                      setDetailRequest(null);
                      startEdit(detailRequest);
                    }}
                  >
                    <Pencil /> Chỉnh sửa
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      setDetailRequest(null);
                      setDeleteTarget(detailRequest);
                    }}
                  >
                    <Trash2 /> Xóa
                  </button>
                </>
              )}
              {mode === 'manager' && detailRequest.status === 'PendingManagerApproval' && (
                <>
                  <button onClick={() => action(detailRequest.id, 'approve')}>
                    <Check /> Duyệt
                  </button>
                  <button className="danger" onClick={() => action(detailRequest.id, 'reject')}>
                    <X /> Từ chối
                  </button>
                </>
              )}
              {mode === 'warehouse' && detailRequest.status === 'ApprovedAwaitingWarehouse' && (
                <button onClick={() => action(detailRequest.id, 'issue')}>
                  <PackageCheck /> Lập phiếu xuất
                </button>
              )}
              {mode === 'warehouse' && detailRequest.status === 'ReadyForGhn' && (
                <button
                  onClick={() => {
                    setDetailRequest(null);
                    openGhnForm(detailRequest);
                  }}
                >
                  <Truck /> Tạo vận đơn GHN
                </button>
              )}
              {detailRequest.ghnOrderCode && (
                <button onClick={() => action(detailRequest.id, 'refresh')}>
                  <RefreshCw /> Đồng bộ GHN
                </button>
              )}
              <button className="secondary" onClick={() => setDetailRequest(null)}>
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="product-modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="delete-request-modal"
            role="alertdialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span>
              <Trash2 />
            </span>
            <h2>Xóa yêu cầu {deleteTarget.code}?</h2>
            <p>Yêu cầu sẽ biến mất khỏi danh sách và Manager không thể duyệt yêu cầu này.</p>
            <div>
              <button onClick={() => setDeleteTarget(null)}>Giữ lại</button>
              <button className="danger" onClick={deleteRequest}>
                <Trash2 /> Xóa yêu cầu
              </button>
            </div>
          </section>
        </div>
      )}
      {ghnTarget && (
        <div
          className="product-modal-backdrop"
          onMouseDown={() => !ghnSubmitting && setGhnTarget(null)}
        >
          <section
            className="ghn-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ghn-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>TẠO VẬN ĐƠN GIAO HÀNG</span>
                <h2 id="ghn-form-title">Thông tin vận đơn GHN</h2>
                <p>
                  {ghnTarget.code} · {ghnTarget.warehouseName}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                disabled={ghnSubmitting}
                onClick={() => setGhnTarget(null)}
              >
                <X />
              </button>
            </header>
            <div className="ghn-recipient-summary">
              <div>
                <span>Người nhận</span>
                <strong>{ghnTarget.recipientName}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{ghnTarget.recipientPhone}</strong>
              </div>
              <div className="wide">
                <span>Địa chỉ giao hàng</span>
                <strong>{ghnTarget.toAddress}</strong>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createGhnShipment();
              }}
            >
              <label className={`ghn-admin-field ${ghnErrors.provinceId ? 'invalid' : ''}`}>
                <span>
                  Tỉnh/thành phố <b>*</b>
                </span>
                <div>
                  <Search />
                  <input
                    list="ghn-provinces"
                    value={ghnForm.provinceName}
                    onChange={(event) => {
                      const value = event.target.value;
                      const province = ghnAdministrative.provinces.find(
                        (item) => `${item.name} — ${item.id}` === value,
                      );
                      setGhnForm((current) => ({
                        ...current,
                        provinceName: value,
                        provinceId: province ? String(province.id) : '',
                        districtName: '',
                        toDistrictId: '',
                        wardName: '',
                        toWardCode: '',
                      }));
                      setGhnErrors((current) => ({
                        ...current,
                        provinceId: '',
                        toDistrictId: '',
                        toWardCode: '',
                      }));
                    }}
                    placeholder="Tìm tỉnh/thành phố..."
                    autoComplete="off"
                  />
                </div>
                <datalist id="ghn-provinces">
                  {ghnAdministrative.provinces.map((item) => (
                    <option key={item.id} value={`${item.name} — ${item.id}`} />
                  ))}
                </datalist>
                {ghnErrors.provinceId && <small>{ghnErrors.provinceId}</small>}
              </label>
              <label className={`ghn-admin-field ${ghnErrors.toDistrictId ? 'invalid' : ''}`}>
                <span>
                  Quận/huyện <b>*</b>
                </span>
                <div>
                  <Search />
                  <input
                    list="ghn-districts"
                    disabled={!ghnForm.provinceId}
                    value={ghnForm.districtName}
                    onChange={(event) => {
                      const value = event.target.value;
                      const district = ghnDistricts.find(
                        (item) => `${item.name} — ${item.id}` === value,
                      );
                      setGhnForm((current) => ({
                        ...current,
                        districtName: value,
                        toDistrictId: district ? String(district.id) : '',
                        wardName: '',
                        toWardCode: '',
                      }));
                      setGhnErrors((current) => ({ ...current, toDistrictId: '', toWardCode: '' }));
                    }}
                    placeholder={
                      ghnForm.provinceId ? 'Tìm quận/huyện...' : 'Chọn tỉnh/thành phố trước'
                    }
                    autoComplete="off"
                  />
                </div>
                <datalist id="ghn-districts">
                  {ghnDistricts.map((item) => (
                    <option key={item.id} value={`${item.name} — ${item.id}`} />
                  ))}
                </datalist>
                {ghnErrors.toDistrictId && <small>{ghnErrors.toDistrictId}</small>}
              </label>
              <label className={`ghn-admin-field ${ghnErrors.toWardCode ? 'invalid' : ''}`}>
                <span>
                  Phường/xã <b>*</b>
                </span>
                <div>
                  <Search />
                  <input
                    list="ghn-wards"
                    disabled={!ghnForm.toDistrictId}
                    value={ghnForm.wardName}
                    onChange={(event) => {
                      const value = event.target.value;
                      const ward = ghnWards.find((item) => `${item.name} — ${item.code}` === value);
                      setGhnForm((current) => ({
                        ...current,
                        wardName: value,
                        toWardCode: ward?.code || '',
                      }));
                      setGhnErrors((current) => ({ ...current, toWardCode: '' }));
                    }}
                    placeholder={
                      ghnForm.toDistrictId ? 'Tìm phường/xã...' : 'Chọn quận/huyện trước'
                    }
                    autoComplete="off"
                  />
                </div>
                <datalist id="ghn-wards">
                  {ghnWards.map((item) => (
                    <option
                      key={`${item.districtId}-${item.code}`}
                      value={`${item.name} — ${item.code}`}
                    />
                  ))}
                </datalist>
                {ghnErrors.toWardCode && <small>{ghnErrors.toWardCode}</small>}
              </label>
              <label className={ghnErrors.paymentTypeId ? 'invalid' : ''}>
                <span>
                  Thanh toán phí vận chuyển <b>*</b>
                </span>
                <select
                  value={ghnForm.paymentTypeId}
                  onChange={(event) =>
                    setGhnForm((current) => ({ ...current, paymentTypeId: event.target.value }))
                  }
                >
                  <option value="1">Bên gửi thanh toán</option>
                  <option value="2">Bên nhận thanh toán</option>
                </select>
              </label>
              <label className={ghnErrors.serviceTypeId ? 'invalid' : ''}>
                <span>
                  Loại dịch vụ GHN <b>*</b>
                </span>
                <select
                  value={ghnForm.serviceTypeId}
                  onChange={(event) =>
                    setGhnForm((current) => ({ ...current, serviceTypeId: event.target.value }))
                  }
                >
                  <option value="2">Giao hàng tiêu chuẩn</option>
                  <option value="5">Hàng nặng</option>
                </select>
                {ghnErrors.serviceTypeId && <small>{ghnErrors.serviceTypeId}</small>}
              </label>
              <label className={ghnErrors.requiredNote ? 'invalid' : ''}>
                <span>
                  Yêu cầu khi giao hàng <b>*</b>
                </span>
                <select
                  value={ghnForm.requiredNote}
                  onChange={(event) =>
                    setGhnForm((current) => ({ ...current, requiredNote: event.target.value }))
                  }
                >
                  <option value="KHONGCHOXEMHANG">Không cho xem hàng</option>
                  <option value="CHOXEMHANGKHONGTHU">Cho xem hàng, không cho thử</option>
                  <option value="CHOTHUHANG">Cho thử hàng</option>
                </select>
              </label>
              <div className="ghn-form-actions">
                <button type="button" disabled={ghnSubmitting} onClick={() => setGhnTarget(null)}>
                  Hủy
                </button>
                <button type="submit" className="primary" disabled={ghnSubmitting}>
                  {ghnSubmitting ? <RefreshCw className="spinning" /> : <Truck />}
                  {ghnSubmitting ? 'Đang tạo vận đơn...' : 'Tạo vận đơn GHN'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {activeBatch && (
        <div className="product-modal-backdrop" onMouseDown={() => setActiveBatch(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span>DANH SÁCH SẢN PHẨM</span>
                <h2>
                  {activeBatch.clothingType} · {activeBatch.fabricType}
                </h2>
                <p>
                  {activeBatch.batchCode} · Nhãn {activeBatch.grade}
                </p>
              </div>
              <button aria-label="Đóng" onClick={() => setActiveBatch(null)}>
                <X />
              </button>
            </header>
            <div className="product-modal-summary">
              <span>
                <ShoppingBag /> {activeBatch.items.length} sản phẩm
              </span>
              <span>{activeBatch.gender}</span>
              <span>{activeBatch.targetUser}</span>
              <span>Size {activeBatch.size}</span>
            </div>
            <div className="product-grid">
              {pagedProducts.map((item) => {
                const isSelected = (selectedItemCodes[activeBatch.inventoryId] || []).includes(
                  item.itemCode,
                );
                return (
                  <article
                    key={item.itemCode}
                    className={`product-tile selectable${isSelected ? ' selected' : ''}`}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleProduct(activeBatch, item.itemCode)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleProduct(activeBatch, item.itemCode);
                      }
                    }}
                  >
                    <div className="product-image">
                      {item.imageUrls[0] ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={`${item.clothingType} ${item.itemCode}`}
                        />
                      ) : (
                        <div>
                          <ImageOff />
                          <span>Chưa có ảnh</span>
                        </div>
                      )}
                      <span className="product-grade">Nhãn {activeBatch.grade}</span>
                      {isSelected && (
                        <span className="product-selected-mark">
                          <Check /> Đã chọn
                        </span>
                      )}
                    </div>
                    <div className="product-info">
                      <small>{item.itemCode}</small>
                      <h3>{item.clothingType}</h3>
                      <p>{item.fabricType}</p>
                      <div>
                        <span>{item.gender}</span>
                        <span>{item.targetUser}</span>
                        <span>Size {item.size}</span>
                      </div>
                      {item.notes && <em>{item.notes}</em>}
                    </div>
                  </article>
                );
              })}
            </div>
            {activeBatch.items.length > productPageSize && (
              <nav
                className="catalog-pagination product-pagination"
                aria-label="Phân trang sản phẩm"
              >
                <span>
                  Hiển thị {(productPage - 1) * productPageSize + 1}–
                  {Math.min(productPage * productPageSize, activeBatch.items.length)} trong{' '}
                  {activeBatch.items.length} sản phẩm
                </span>
                <div>
                  <button
                    disabled={productPage === 1}
                    onClick={() => setProductPage((page) => page - 1)}
                    aria-label="Trang sản phẩm trước"
                  >
                    <ChevronLeft />
                  </button>
                  {Array.from({ length: productPageCount }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      className={page === productPage ? 'active' : ''}
                      onClick={() => setProductPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={productPage === productPageCount}
                    onClick={() => setProductPage((page) => page + 1)}
                    aria-label="Trang sản phẩm sau"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </nav>
            )}
            <footer>
              <div>
                <b>
                  {selected[activeBatch.inventoryId] || 0}/{activeBatch.availableQuantity}
                </b>
                <span> sản phẩm đã chọn</span>
              </div>
              <div>
                <button className="secondary" onClick={() => setActiveBatch(null)}>
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setQuantity(activeBatch, activeBatch.availableQuantity);
                    setActiveBatch(null);
                  }}
                >
                  <ShoppingBag /> Chọn toàn bộ batch
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
