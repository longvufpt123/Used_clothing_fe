import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalendarDays, Edit3, ImageIcon, PackageSearch, RefreshCw, Save, Truck, X, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import apiClient from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import './MyOrders.css';

interface DonorRequestSearchApiResponse {
  id: string;
  code: string;
  donorName: string;
  phoneNumber: string;
  description?: string;
  imageUrls?: string[];
  estimateWeight: number;
  actualWeight?: number | null;
  pickupAddress: string;
  pickupDate?: string | null;
  warehouseId: string;
  warehouseAddress: string;
  status: string;
  statusText: string;
  createdAt?: string | null;
}

interface WarehouseOption {
  id: string;
  address: string;
}

interface UpdateOrderFormState {
  category: string;
  weight: string;
  condition: string;
  pickupAddress: string;
  pickupDate: string;
  warehouseId: string;
  notes: string;
  imageUrls: string[];
}

interface UpdateDonationPayload {
  pickupDate: string;
  description: string;
  imageUrls: string[];
  estimateWeight: number;
  pickupAddress: string;
  warehouseId: string;
}

const categoryOptions = [
  { value: 'outerwear', label: 'Áo khoác / Đồ ấm mùa đông' },
  { value: 'shirts', label: 'Áo thun / Áo sơ mi dệt kim' },
  { value: 'pants', label: 'Quần jeans / Quần dài / Kaki' },
  { value: 'kids', label: 'Quần áo trẻ em' },
  { value: 'mixed', label: 'Hỗn hợp / Khác' },
];

const weightOptions = [
  { value: 'under-5', label: 'Dưới 5 kg (Túi nhỏ)' },
  { value: '5-10', label: 'Từ 5 - 10 kg (Thùng carton vừa)' },
  { value: '10-20', label: 'Từ 10 - 20 kg (Bao tải lớn)' },
  { value: 'over-20', label: 'Trên 20 kg (Nhiều bao tải)' },
];

const conditionOptions = [
  { value: 'good', label: 'Còn tốt, lành lặn (Dùng làm từ thiện)' },
  { value: 'recycle', label: 'Cũ rách, mục hỏng (Dành để tái chế dệt lại)' },
  { value: 'mixed', label: 'Hỗn hợp (Có cả đồ từ thiện và đồ tái chế)' },
];

const estimateWeightByOption: Record<string, number> = {
  'under-5': 3,
  '5-10': 7.5,
  '10-20': 15,
  'over-20': 25,
};

const getDescriptionValue = (description: string | undefined, label: string) => {
  if (!description) {
    return '';
  }

  const line = description
    .split('\n')
    .find(item => item.toLowerCase().startsWith(label.toLowerCase()));

  return line?.split(':').slice(1).join(':').trim() || '';
};

const findOptionValueByLabel = (options: { value: string; label: string }[], label: string, fallback: string) => {
  return options.find(option => option.label === label)?.value || fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Chưa cập nhật';
  }

  return new Date(value).toLocaleDateString('vi-VN');
};

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }

  return new Date(value).toISOString().split('T')[0];
};

const canModifyOrder = (status: string) => {
  return status === 'PendingStaffAssign' || status === 'WaitingReceivingStaff';
};

const getStatusToneClass = (status: string) => {
  if (status === 'Cancelled' || status === 'Reject') {
    return 'order-status-danger';
  }

  if (status.includes('Pending') || status.includes('Waiting')) {
    return 'order-status-warning';
  }

  if (status === 'Confirmed' || status === 'Stored' || status === 'Classified') {
    return 'order-status-success';
  }

  return 'order-status-info';
};

export const MyOrders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<DonorRequestSearchApiResponse[] | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateOrderFormState | null>(null);
  const [pendingCancelOrder, setPendingCancelOrder] = useState<DonorRequestSearchApiResponse | null>(null);

  const warehouseOptions = warehouses.map(warehouse => ({
    value: warehouse.id,
    label: warehouse.address,
  }));

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<unknown, DonorRequestSearchApiResponse[]>('/donor-requests/my');
      setOrders(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách đơn.');
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    setWarehouseLoading(true);
    try {
      const result = await apiClient.get<unknown, WarehouseOption[]>('/warehouses');
      setWarehouses(result);
    } catch {
      toast.error('Không thể tải danh sách kho tiếp nhận.');
    } finally {
      setWarehouseLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMyOrders();
      loadWarehouses();
    }
  }, [isAuthenticated]);

  const startEditOrder = (order: DonorRequestSearchApiResponse) => {
    const categoryLabel = getDescriptionValue(order.description, 'Loai quan ao');
    const weightLabel = getDescriptionValue(order.description, 'Khoi luong uoc luong');
    const conditionLabel = getDescriptionValue(order.description, 'Tinh trang');

    setEditingOrderId(order.id);
    setEditForm({
      category: findOptionValueByLabel(categoryOptions, categoryLabel, 'mixed'),
      weight: findOptionValueByLabel(weightOptions, weightLabel, '5-10'),
      condition: findOptionValueByLabel(conditionOptions, conditionLabel, 'good'),
      pickupAddress: order.pickupAddress,
      pickupDate: toDateInputValue(order.pickupDate),
      warehouseId: order.warehouseId || warehouses.find(item => item.address === order.warehouseAddress)?.id || warehouses[0]?.id || '',
      notes: getDescriptionValue(order.description, 'Ghi chu'),
      imageUrls: order.imageUrls || [],
    });
  };

  const stopEditOrder = () => {
    setEditingOrderId(null);
    setEditForm(null);
  };

  const updateEditForm = (field: keyof UpdateOrderFormState, value: string) => {
    setEditForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleUpdateOrder = async (order: DonorRequestSearchApiResponse) => {
    if (!editForm) {
      return;
    }

    if (!editForm.pickupAddress || !editForm.pickupDate || !editForm.warehouseId) {
      toast.error('Vui lòng nhập đầy đủ địa chỉ, ngày lấy hàng và kho tiếp nhận.');
      return;
    }

    const selectedCategoryLabel = categoryOptions.find(option => option.value === editForm.category)?.label || 'Hỗn hợp / Khác';
    const selectedWeightLabel = weightOptions.find(option => option.value === editForm.weight)?.label || 'Dưới 5 kg (Túi nhỏ)';
    const selectedConditionLabel = conditionOptions.find(option => option.value === editForm.condition)?.label || 'Còn tốt, lành lặn (Dùng làm từ thiện)';

    const payload: UpdateDonationPayload = {
      pickupDate: new Date(`${editForm.pickupDate}T00:00:00`).toISOString(),
      description: [
        `Nguoi quyen gop: ${order.donorName}`,
        `So dien thoai: ${order.phoneNumber}`,
        `Loai quan ao: ${selectedCategoryLabel}`,
        `Khoi luong uoc luong: ${selectedWeightLabel}`,
        `Tinh trang: ${selectedConditionLabel}`,
        editForm.notes.trim() ? `Ghi chu: ${editForm.notes.trim()}` : '',
      ].filter(Boolean).join('\n'),
      imageUrls: editForm.imageUrls,
      estimateWeight: estimateWeightByOption[editForm.weight] ?? order.estimateWeight,
      pickupAddress: editForm.pickupAddress,
      warehouseId: editForm.warehouseId,
    };

    setSavingOrderId(order.id);
    try {
      await apiClient.put<unknown, unknown>(`/donor-requests/${order.id}`, payload);
      toast.success('Cập nhật đơn quyên góp thành công.');
      stopEditOrder();
      await loadMyOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật đơn quyên góp.');
    } finally {
      setSavingOrderId(null);
    }
  };

  const requestCancelOrder = (order: DonorRequestSearchApiResponse) => {
    setPendingCancelOrder(order);
  };

  const closeCancelDialog = () => {
    if (!cancellingOrderId) {
      setPendingCancelOrder(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!pendingCancelOrder) {
      return;
    }

    setCancellingOrderId(pendingCancelOrder.id);
    try {
      await apiClient.patch<unknown, unknown>(`/donor-requests/${pendingCancelOrder.id}/cancel`);
      toast.success('Đã hủy đơn quyên góp.');
      if (editingOrderId === pendingCancelOrder.id) {
        stopEditOrder();
      }
      setPendingCancelOrder(null);
      await loadMyOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy đơn quyên góp.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="my-orders-page container">
      <div className="my-orders-header">
        <span className="section-subtitle">Đơn của tôi</span>
        <h1>Lịch sử quyên góp</h1>
      </div>

      <div className="my-orders-toolbar glass">
        <div>
          <strong>Danh sách đơn</strong>
          <p>Danh sách đơn hàng mà bạn đã quyên góp</p>
        </div>
        <Button type="button" isLoading={loading} onClick={loadMyOrders}>
          Làm mới <RefreshCw size={16} style={{ marginLeft: 8 }} />
        </Button>
      </div>

      {orders !== null && (
        <section className="orders-list">
          {orders.length === 0 ? (
            <div className="orders-empty glass">
              <PackageSearch size={34} />
              <p>Tài khoản này chưa có đơn quyên góp nào.</p>
            </div>
          ) : (
            orders.map(order => {
              const isEditing = editingOrderId === order.id && editForm;
              const isModifiable = canModifyOrder(order.status);

              return (
                <article className="order-card glass" key={order.id}>
                  <div className="order-card-header">
                    <div>
                      <span className="order-code">{order.code}</span>
                      <h2>{getDescriptionValue(order.description, 'Loai quan ao') || 'Đơn quyên góp'}</h2>
                    </div>
                    <div className="order-header-actions">
                      <span className={`order-status ${getStatusToneClass(order.status)}`}>{order.statusText}</span>
                      {isModifiable && !isEditing && (
                        <div className="order-actions">
                          <Button type="button" variant="outline" size="sm" onClick={() => startEditOrder(order)}>
                            <Edit3 size={15} /> Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="btn-danger"
                            isLoading={cancellingOrderId === order.id}
                            onClick={() => requestCancelOrder(order)}
                          >
                            <XCircle size={15} /> Hủy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <form className="edit-order-form" onSubmit={(event) => { event.preventDefault(); handleUpdateOrder(order); }}>
                      <div className="edit-form-grid">
                        <Select
                          label="Loại quần áo"
                          options={categoryOptions}
                          value={editForm.category}
                          onChange={(event) => updateEditForm('category', event.target.value)}
                        />
                        <Select
                          label="Khối lượng ước lượng"
                          options={weightOptions}
                          value={editForm.weight}
                          onChange={(event) => updateEditForm('weight', event.target.value)}
                        />
                        <Select
                          label="Tình trạng"
                          options={conditionOptions}
                          value={editForm.condition}
                          onChange={(event) => updateEditForm('condition', event.target.value)}
                        />
                        <Input
                          label="Ngày lấy hàng"
                          type="date"
                          value={editForm.pickupDate}
                          onChange={(event) => updateEditForm('pickupDate', event.target.value)}
                          required
                        />
                        <Select
                          label="Kho tiếp nhận"
                          options={warehouseOptions.length > 0 ? warehouseOptions : [{ value: '', label: warehouseLoading ? 'Đang tải danh sách kho...' : 'Không có kho tiếp nhận' }]}
                          value={editForm.warehouseId}
                          onChange={(event) => updateEditForm('warehouseId', event.target.value)}
                          disabled={warehouseLoading || warehouseOptions.length === 0}
                          required
                        />
                        <Input
                          label="Địa chỉ lấy hàng"
                          value={editForm.pickupAddress}
                          onChange={(event) => updateEditForm('pickupAddress', event.target.value)}
                          required
                        />
                      </div>

                      <label className="edit-notes-label" htmlFor={`notes-${order.id}`}>Ghi chú</label>
                      <textarea
                        id={`notes-${order.id}`}
                        className="edit-notes-input"
                        value={editForm.notes}
                        onChange={(event) => updateEditForm('notes', event.target.value)}
                        rows={3}
                        placeholder="Ghi chú thêm cho nhân viên tiếp nhận"
                      />

                      <div className="edit-form-actions">
                        <Button type="submit" isLoading={savingOrderId === order.id} disabled={warehouseLoading || warehouseOptions.length === 0}>
                          <Save size={16} /> Lưu thay đổi
                        </Button>
                        <Button type="button" variant="outline" onClick={stopEditOrder}>
                          <X size={16} /> Đóng
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="btn-danger"
                          isLoading={cancellingOrderId === order.id}
                          onClick={() => requestCancelOrder(order)}
                        >
                          <XCircle size={16} /> Hủy đơn
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="order-meta-grid">
                        <div><strong>Người gửi</strong><span>{order.donorName}</span></div>
                        <div><strong>Số điện thoại</strong><span>{order.phoneNumber}</span></div>
                        <div><strong>Khối lượng</strong><span>{getDescriptionValue(order.description, 'Khoi luong uoc luong') || `${order.estimateWeight} kg`}</span></div>
                        <div><strong>Tình trạng</strong><span>{getDescriptionValue(order.description, 'Tinh trang') || 'Đang cập nhật'}</span></div>
                        <div><strong>Ngày lấy hàng</strong><span>{formatDate(order.pickupDate)}</span></div>
                        <div><strong>Kho tiếp nhận</strong><span>{order.warehouseAddress}</span></div>
                      </div>

                      <div className="order-address">
                        <Truck size={17} />
                        <span>{order.pickupAddress}</span>
                      </div>

                      {order.imageUrls && order.imageUrls.length > 0 && (
                        <div className="order-images-block">
                          <div className="order-images-title">
                            <ImageIcon size={17} />
                            <span>Hình ảnh</span>
                          </div>
                          <div className="order-images-grid">
                            {order.imageUrls.map((url, index) => (
                              <a href={url} target="_blank" rel="noreferrer" className="order-image" key={`${order.id}-${url}`}>
                                <img src={url} alt={`Hình ảnh đơn ${order.code} ${index + 1}`} loading="lazy" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="order-footer">
                    <CalendarDays size={16} />
                    <span>Tạo ngày {formatDate(order.createdAt)}</span>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingCancelOrder)}
        title="Hủy đơn quyên góp"
        message={pendingCancelOrder ? `Bạn có chắc muốn hủy đơn ${pendingCancelOrder.code}? Sau khi hủy, đơn sẽ không thể tiếp tục cập nhật.` : ''}
        confirmText="Hủy đơn"
        cancelText="Giữ lại"
        tone="danger"
        isLoading={Boolean(cancellingOrderId)}
        onConfirm={handleCancelOrder}
        onCancel={closeCancelDialog}
      />
    </div>
  );
};

export default MyOrders;