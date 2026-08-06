import React, { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useRef } from "react";
import {
  CalendarDays,
  Edit3,
  ImageIcon,
  PackageSearch,
  RefreshCw,
  Save,
  Truck,
  X,
  XCircle,
  FilterX,
  Search,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import apiClient from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import "./MyOrders.css";

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
  { value: "outerwear", label: "Áo khoác / Đồ ấm mùa đông" },
  { value: "shirts", label: "Áo thun / Áo sơ mi dệt kim" },
  { value: "pants", label: "Quần denim / Quần dài / kaki" },
  { value: "kids", label: "Quần áo trẻ em" },
  { value: "mixed", label: "Hỗn hợp / Khác" },
];

const weightOptions = [
  { value: "under-5", label: "Dưới 5 kg (Túi nhỏ)" },
  { value: "5-10", label: "Từ 5 - 10 kg (Thùng giấy vừa)" },
  { value: "10-20", label: "Từ 10 - 20 kg (Bao tải lớn)" },
  { value: "over-20", label: "Trên 20 kg (Nhiều bao tải)" },
];

const conditionOptions = [
  { value: "good", label: "Còn tốt, lành lặn (Dùng làm từ thiện)" },
  { value: "recycle", label: "Cũ rách, mục hỏng (Dành để tái chế dệt lại)" },
  { value: "mixed", label: "Hỗn hợp (Có cả đồ từ thiện và đồ tái chế)" },
];

const estimateWeightByOption: Record<string, number> = {
  "under-5": 3,
  "5-10": 7.5,
  "10-20": 15,
  "over-20": 25,
};

const getDescriptionValue = (
  description: string | undefined,
  label: string,
) => {
  if (!description) {
    return "";
  }

  const line = description
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(label.toLowerCase()));

  return line?.split(":").slice(1).join(":").trim() || "";
};

const findOptionValueByLabel = (
  options: { value: string; label: string }[],
  label: string,
  fallback: string,
) => {
  return options.find((option) => option.label === label)?.value || fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day
    ? `${Number(day)}/${Number(month)}/${year}`
    : "Chưa cập nhật";
};

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return value.slice(0, 10);
};

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const isPickupDateInputWeekend = (value: string) => {
  if (!value) return false;
  const [year, month, day] = value.split("-").map(Number);
  return isWeekend(new Date(year, month - 1, day));
};

const getEarliestPickupDateInput = () => {
  const date = new Date();
  while (isWeekend(date)) {
    date.setDate(date.getDate() + 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const canModifyOrder = (status: string) => {
  return status === "PendingStaffAssign" || status === "WaitingReceivingStaff";
};

const getStatusToneClass = (status: string) => {
  if (status === "Cancelled" || status === "Reject") {
    return "order-status-danger";
  }

  if (status.includes("Pending") || status.includes("Waiting")) {
    return "order-status-warning";
  }

  if (
    status === "Confirmed" ||
    status === "Stored" ||
    status === "Classified"
  ) {
    return "order-status-success";
  }

  return "order-status-info";
};

export const MyOrders: React.FC = () => {
  const pageSize = 10;
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<DonorRequestSearchApiResponse[] | null>(
    null,
  );
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateOrderFormState | null>(null);
  const [pendingCancelOrder, setPendingCancelOrder] =
    useState<DonorRequestSearchApiResponse | null>(null);
  const [selectedOrder, setSelectedOrder] =
    useState<DonorRequestSearchApiResponse | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const handledCreatedIdRef = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.address,
  }));

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          (orders || [])
            .map((order) =>
              (order.pickupDate || order.createdAt || "").slice(0, 4),
            )
            .filter(Boolean),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [orders],
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Map(
          (orders || []).map((order) => [
            order.status,
            order.statusText || order.status,
          ]),
        ).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1], "vi")),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const code = searchCode.trim().toLocaleLowerCase("vi");
    return (orders || []).filter((order) => {
      const orderDate = (order.pickupDate || order.createdAt || "").slice(
        0,
        10,
      );
      return (
        (!code || order.code.toLocaleLowerCase("vi").includes(code)) &&
        (!filterDate || orderDate === filterDate) &&
        (!filterMonth || orderDate.slice(0, 7) === filterMonth) &&
        (!filterYear || orderDate.slice(0, 4) === filterYear) &&
        (!filterStatus || order.status === filterStatus)
      );
    });
  }, [orders, searchCode, filterDate, filterMonth, filterYear, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => setPage(1), [
    searchCode,
    filterDate,
    filterMonth,
    filterYear,
    filterStatus,
  ]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const loadMyOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await apiClient.get<
        unknown,
        DonorRequestSearchApiResponse[]
      >("/donor-requests/my");
      setOrders(result);
      setSelectedOrder((current) =>
        current ? result.find((order) => order.id === current.id) || null : null,
      );
    } catch (error) {
      if (!silent) {
        toast.error(
          error instanceof Error ? error.message : "Không thể tải danh sách đơn.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    setWarehouseLoading(true);
    try {
      const result = await apiClient.get<unknown, WarehouseOption[]>(
        "/warehouses",
      );
      setWarehouses(result);
    } catch {
      toast.error("Không thể tải danh sách kho tiếp nhận.");
    } finally {
      setWarehouseLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      loadMyOrders();
      loadWarehouses();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => {
      if (document.visibilityState === "visible") void loadMyOrders(true);
    };
    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId && orders) {
      setSelectedOrder(orders.find((order) => order.id === requestId) || null);
    }
  }, [orders, searchParams]);

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    if (searchParams.has("requestId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("requestId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    const createdId = searchParams.get("created");
    if (!createdId || !orders?.length) return;
    if (handledCreatedIdRef.current === createdId) return;
    const index = orders.findIndex((order) => order.id === createdId);
    if (index < 0) return;
    handledCreatedIdRef.current = createdId;
    setSearchCode(""); setFilterDate(""); setFilterMonth(""); setFilterYear(""); setFilterStatus("");
    setPage(Math.floor(index / pageSize) + 1);
    setHighlightedOrderId(createdId);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const timer = window.setTimeout(() => setHighlightedOrderId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [orders, searchParams]);

  const startEditOrder = (order: DonorRequestSearchApiResponse) => {
    const categoryLabel = getDescriptionValue(
      order.description,
      "Loai quan ao",
    );
    const weightLabel = getDescriptionValue(
      order.description,
      "Khoi luong uoc luong",
    );
    const conditionLabel = getDescriptionValue(order.description, "Tinh trang");

    setEditingOrderId(order.id);
    setEditForm({
      category: findOptionValueByLabel(categoryOptions, categoryLabel, "mixed"),
      weight: findOptionValueByLabel(weightOptions, weightLabel, "5-10"),
      condition: findOptionValueByLabel(
        conditionOptions,
        conditionLabel,
        "good",
      ),
      pickupAddress: order.pickupAddress,
      pickupDate: toDateInputValue(order.pickupDate),
      warehouseId:
        order.warehouseId ||
        warehouses.find((item) => item.address === order.warehouseAddress)
          ?.id ||
        warehouses[0]?.id ||
        "",
      notes: getDescriptionValue(order.description, "Ghi chu"),
      imageUrls: order.imageUrls || [],
    });
  };

  const stopEditOrder = () => {
    setEditingOrderId(null);
    setEditForm(null);
  };

  const updateEditForm = (field: keyof UpdateOrderFormState, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdateOrder = async (order: DonorRequestSearchApiResponse) => {
    if (!editForm) {
      return;
    }

    if (
      !editForm.pickupAddress ||
      !editForm.pickupDate ||
      !editForm.warehouseId
    ) {
      toast.error(
        "Vui lòng nhập đầy đủ địa chỉ, ngày lấy hàng và kho tiếp nhận.",
      );
      return;
    }

    if (isPickupDateInputWeekend(editForm.pickupDate)) {
      toast.error("Chỉ nhận hàng từ Thứ 2 đến Thứ 6. Vui lòng chọn ngày khác.");
      return;
    }

    const selectedCategoryLabel =
      categoryOptions.find((option) => option.value === editForm.category)
        ?.label || "Hỗn hợp / Khác";
    const selectedWeightLabel =
      weightOptions.find((option) => option.value === editForm.weight)?.label ||
      "Dưới 5 kg (Túi nhỏ)";
    const selectedConditionLabel =
      conditionOptions.find((option) => option.value === editForm.condition)
        ?.label || "Còn tốt, lành lặn (Dùng làm từ thiện)";

    const payload: UpdateDonationPayload = {
      pickupDate: `${editForm.pickupDate}T00:00:00`,
      description: [
        `Nguoi quyen gop: ${order.donorName}`,
        `So dien thoai: ${order.phoneNumber}`,
        `Loai quan ao: ${selectedCategoryLabel}`,
        `Khoi luong uoc luong: ${selectedWeightLabel}`,
        `Tinh trang: ${selectedConditionLabel}`,
        editForm.notes.trim() ? `Ghi chu: ${editForm.notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      imageUrls: editForm.imageUrls,
      estimateWeight:
        estimateWeightByOption[editForm.weight] ?? order.estimateWeight,
      pickupAddress: editForm.pickupAddress,
      warehouseId: editForm.warehouseId,
    };

    setSavingOrderId(order.id);
    try {
      await apiClient.put<unknown, unknown>(
        `/donor-requests/${order.id}`,
        payload,
      );
      toast.success("Cập nhật đơn quyên góp thành công.");
      stopEditOrder();
      await loadMyOrders();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật đơn quyên góp.",
      );
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
      await apiClient.patch<unknown, unknown>(
        `/donor-requests/${pendingCancelOrder.id}/cancel`,
      );
      toast.success("Đã hủy đơn quyên góp.");
      if (editingOrderId === pendingCancelOrder.id) {
        stopEditOrder();
      }
      setPendingCancelOrder(null);
      await loadMyOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể hủy đơn quyên góp.",
      );
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
        <Button type="button" isLoading={loading} onClick={() => void loadMyOrders()}>
          Làm mới <RefreshCw size={16} style={{ marginLeft: 8 }} />
        </Button>
        <div className="orders-filterbar">
          <label className="orders-code-search">
            <Search size={17} />
            <input
              value={searchCode}
              onChange={(event) => setSearchCode(event.target.value)}
              placeholder="Tìm theo mã đơn..."
            />
          </label>
          <label>
            <span>Ngày</span>
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </label>
          <label>
            <span>Tháng</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
            />
          </label>
          <label>
            <span>Năm</span>
            <select
              value={filterYear}
              onChange={(event) => setFilterYear(event.target.value)}
            >
              <option value="">Tất cả năm</option>
              {years.map((year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Trạng thái</span>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {(searchCode ||
            filterDate ||
            filterMonth ||
            filterYear ||
            filterStatus) && (
            <button
              type="button"
              className="orders-clear-filter"
              onClick={() => {
                setSearchCode("");
                setFilterDate("");
                setFilterMonth("");
                setFilterYear("");
                setFilterStatus("");
              }}
            >
              <FilterX size={16} /> Xóa lọc
            </button>
          )}
          <span className="orders-result-count">
            {filteredOrders.length} đơn
          </span>
        </div>
      </div>

      {orders !== null && (
        <section className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="orders-empty glass">
              <PackageSearch size={34} />
              <p>
                {orders.length
                  ? "Không tìm thấy đơn phù hợp bộ lọc."
                  : "Tài khoản này chưa có đơn quyên góp nào."}
              </p>
            </div>
          ) : (
            pagedOrders.map((order) => {
              const isEditing = editingOrderId === order.id && editForm;
              const isModifiable = canModifyOrder(order.status);

              return (
                <article
                  className={`order-card glass ${isEditing ? "is-editing" : ""} ${highlightedOrderId === order.id ? "is-newly-created" : ""}`}
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if (
                      (event.target as HTMLElement).closest(
                        "button, a, input, select, textarea, form",
                      )
                    )
                      return;
                    setSelectedOrder(order);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedOrder(order);
                    }
                  }}
                >
                  <div className="order-card-header">
                    <div>
                      <span className="order-code">{order.code}</span>
                      <h2>
                        {getDescriptionValue(
                          order.description,
                          "Loai quan ao",
                        ) || "Đơn quyên góp"}
                      </h2>
                    </div>
                    <div className="order-header-actions">
                      <span
                        className={`order-status ${getStatusToneClass(order.status)}`}
                      >
                        {order.statusText}
                      </span>
                      {isModifiable && !isEditing && (
                        <div className="order-actions">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditOrder(order)}
                          >
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
                    <form
                      className="edit-order-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleUpdateOrder(order);
                      }}
                    >
                      <div className="edit-form-grid">
                        <Select
                          label="Loại quần áo"
                          options={categoryOptions}
                          value={editForm.category}
                          onChange={(event) =>
                            updateEditForm("category", event.target.value)
                          }
                        />
                        <Select
                          label="Khối lượng ước lượng"
                          options={weightOptions}
                          value={editForm.weight}
                          onChange={(event) =>
                            updateEditForm("weight", event.target.value)
                          }
                        />
                        <Select
                          label="Tình trạng"
                          options={conditionOptions}
                          value={editForm.condition}
                          onChange={(event) =>
                            updateEditForm("condition", event.target.value)
                          }
                        />
                        <Input
                          label="Ngày lấy hàng"
                          type="date"
                          value={editForm.pickupDate}
                          min={getEarliestPickupDateInput()}
                          onChange={(event) => {
                            if (isPickupDateInputWeekend(event.target.value)) {
                              toast.error(
                                "Chỉ nhận hàng từ Thứ 2 đến Thứ 6. Vui lòng chọn ngày khác.",
                              );
                              return;
                            }
                            updateEditForm("pickupDate", event.target.value);
                          }}
                          required
                        />
                        <Select
                          label="Kho tiếp nhận"
                          options={
                            warehouseOptions.length > 0
                              ? warehouseOptions
                              : [
                                  {
                                    value: "",
                                    label: warehouseLoading
                                      ? "Đang tải danh sách kho..."
                                      : "Không có kho tiếp nhận",
                                  },
                                ]
                          }
                          value={editForm.warehouseId}
                          onChange={(event) =>
                            updateEditForm("warehouseId", event.target.value)
                          }
                          disabled={
                            warehouseLoading || warehouseOptions.length === 0
                          }
                          required
                        />
                        <Input
                          label="Địa chỉ lấy hàng"
                          value={editForm.pickupAddress}
                          onChange={(event) =>
                            updateEditForm("pickupAddress", event.target.value)
                          }
                          required
                        />
                      </div>

                      <label
                        className="edit-notes-label"
                        htmlFor={`notes-${order.id}`}
                      >
                        Ghi chú
                      </label>
                      <textarea
                        id={`notes-${order.id}`}
                        className="edit-notes-input"
                        value={editForm.notes}
                        onChange={(event) =>
                          updateEditForm("notes", event.target.value)
                        }
                        rows={3}
                        placeholder="Ghi chú thêm cho nhân viên tiếp nhận"
                      />

                      <div className="edit-form-actions">
                        <Button
                          type="submit"
                          isLoading={savingOrderId === order.id}
                          disabled={
                            warehouseLoading || warehouseOptions.length === 0
                          }
                        >
                          <Save size={16} /> Lưu thay đổi
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopEditOrder}
                        >
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
                        <div>
                          <strong>Người gửi</strong>
                          <span>{order.donorName}</span>
                        </div>
                        <div>
                          <strong>Số điện thoại</strong>
                          <span>{order.phoneNumber}</span>
                        </div>
                        <div>
                          <strong>Khối lượng</strong>
                          <span>
                            {getDescriptionValue(
                              order.description,
                              "Khoi luong uoc luong",
                            ) || `${order.estimateWeight} kg`}
                          </span>
                        </div>
                        <div>
                          <strong>Tình trạng</strong>
                          <span>
                            {getDescriptionValue(
                              order.description,
                              "Tinh trang",
                            ) || "Đang cập nhật"}
                          </span>
                        </div>
                        <div>
                          <strong>Ngày lấy hàng</strong>
                          <span>{formatDate(order.pickupDate)}</span>
                        </div>
                        <div>
                          <strong>Kho tiếp nhận</strong>
                          <span>{order.warehouseAddress}</span>
                        </div>
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
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="order-image"
                                key={`${order.id}-${url}`}
                              >
                                <img
                                  src={url}
                                  alt={`Hình ảnh đơn ${order.code} ${index + 1}`}
                                  loading="lazy"
                                />
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
      {filteredOrders.length > pageSize && (
        <div className="orders-pagination">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {selectedOrder && (
        <div
          className="order-detail-overlay"
          onMouseDown={closeOrderDetail}
        >
          <section
            className="order-detail-modal glass"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="order-code">{selectedOrder.code}</span>
                <h2>
                  {getDescriptionValue(
                    selectedOrder.description,
                    "Loai quan ao",
                  ) || "Đơn quyên góp"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết"
                onClick={closeOrderDetail}
              >
                <X size={20} />
              </button>
            </header>
            <span
              className={`order-status ${getStatusToneClass(selectedOrder.status)}`}
            >
              {selectedOrder.statusText}
            </span>
            <div className="order-detail-grid">
              <div><span>Người gửi</span><strong>{selectedOrder.donorName}</strong></div>
              <div><span>Số điện thoại</span><strong>{selectedOrder.phoneNumber}</strong></div>
              <div><span>Khối lượng</span><strong>{getDescriptionValue(selectedOrder.description, "Khoi luong uoc luong") || `${selectedOrder.estimateWeight} kg`}</strong></div>
              <div><span>Tình trạng</span><strong>{getDescriptionValue(selectedOrder.description, "Tinh trang") || "Đang cập nhật"}</strong></div>
              <div><span>Ngày lấy hàng</span><strong>{formatDate(selectedOrder.pickupDate)}</strong></div>
              <div><span>Ngày tạo</span><strong>{formatDate(selectedOrder.createdAt)}</strong></div>
              <div className="wide"><span>Kho tiếp nhận</span><strong>{selectedOrder.warehouseAddress}</strong></div>
              <div className="wide"><span>Địa chỉ lấy hàng</span><strong>{selectedOrder.pickupAddress}</strong></div>
            </div>
            {selectedOrder.imageUrls &&
              selectedOrder.imageUrls.length > 0 && (
                <div className="order-detail-images">
                  <h3><ImageIcon size={17} /> Hình ảnh</h3>
                  <div>
                    {selectedOrder.imageUrls.map((url, index) => (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        key={`${selectedOrder.id}-detail-${url}`}
                      >
                        <img
                          src={url}
                          alt={`Hình ảnh đơn ${selectedOrder.code} ${index + 1}`}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            <footer>
              {canModifyOrder(selectedOrder.status) && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      startEditOrder(selectedOrder);
                      closeOrderDetail();
                    }}
                  >
                    <Edit3 size={15} /> Sửa đơn
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="btn-danger"
                    onClick={() => {
                      requestCancelOrder(selectedOrder);
                      closeOrderDetail();
                    }}
                  >
                    <XCircle size={15} /> Hủy đơn
                  </Button>
                </>
              )}
              <Button type="button" onClick={closeOrderDetail}>
                Đóng
              </Button>
            </footer>
          </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingCancelOrder)}
        title="Hủy đơn quyên góp"
        message={
          pendingCancelOrder
            ? `Bạn có chắc muốn hủy đơn ${pendingCancelOrder.code}? Sau khi hủy, đơn sẽ không thể tiếp tục cập nhật.`
            : ""
        }
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
