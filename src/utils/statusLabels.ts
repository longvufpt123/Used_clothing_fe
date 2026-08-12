const STATUS_LABELS: Record<string, string> = {
  ReceivedAtWarehouse: 'Đã nhập Khu nhận đồ',
  AwaitingClassificationAssignment: 'Chờ phân công team phân loại',
  AssignedToClassification: 'Đã phân công team phân loại',
  Active: 'Đang hoạt động', Inactive: 'Ngừng hoạt động', Locked: 'Đã khóa', Suspended: 'Tạm ngừng',
  Available: 'Khả dụng', Unavailable: 'Không khả dụng', Pending: 'Chờ xử lý',
  Blocked: 'Đã khóa', Depleted: 'Đã hết tồn kho', Posted: 'Đã ghi sổ',
  PendingVerification: 'Chờ xác minh', Deleted: 'Đã xóa',
  pending: 'Chờ xử lý', done: 'Đã hoàn thành',
  WaitingReceivingStaff: 'Chờ phân công nhân viên tiếp nhận',
  PendingStaffAssign: 'Chờ phân công nhân viên tiếp nhận', Reject: 'Đã từ chối',
  ReceivingStaffAssigned: 'Đã phân công nhân viên tiếp nhận', Assigned: 'Đã phân công',
  PendingDropOff: 'Chờ người quyên góp mang đến kho', DropOffOverdue: 'Quá hạn mang đến kho',
  Received: 'Đã tiếp nhận', Collected: 'Đã thu gom', Confirmed: 'Đã xác nhận',
  Rescheduled: 'Đã hẹn lại', Cancelled: 'Đã hủy', Canceled: 'Đã hủy', Rejected: 'Đã từ chối',
  Scheduled: 'Đã lên lịch', NotStarted: 'Chưa bắt đầu', Started: 'Đã bắt đầu',
  InProgress: 'Đang thực hiện', Completed: 'Đã hoàn thành', Ended: 'Đã kết thúc',
  Planned: 'Đã lập kế hoạch', SentToClassification: 'Đã gửi sang phân loại',
  Receiving: 'Đang thu gom', Transferring: 'Đang chuyển đi',
  PendingConfirmation: 'Chờ xác nhận nhận lô', AwaitingClassificationCount: 'Chờ kiểm đếm',
  ReadyForClassification: 'Sẵn sàng phân loại', Classifying: 'Đang phân loại',
  PendingClassification: 'Chờ phân loại',
  Classified: 'Đã phân loại', InClassifiedArea: 'Đã phân loại', Open: 'Đang mở',
  SendingToWarehouse: 'Đang gửi sang kho', PendingWarehouseReceipt: 'Chờ kho xác nhận',
  SentToWarehouse: 'Đã gửi sang kho',
  WarehouseReceived: 'Kho đã tiếp nhận', PendingStorage: 'Chờ xếp vị trí',
  AwaitingPutaway: 'Chờ xếp vị trí', Stored: 'Đã lưu kho', Full: 'Đã đầy',
  Maintenance: 'Đang bảo trì', Prepared: 'Đã chuẩn bị', Shipped: 'Đã xuất kho',
  PendingManagerApproval: 'Chờ quản lý phê duyệt',
  ApprovedAwaitingWarehouse: 'Đã duyệt, chờ kho xử lý', ReadyForGhn: 'Sẵn sàng tạo vận đơn GHN',
  GhnBooked: 'Đã tạo vận đơn GHN', Shipping: 'Đang giao hàng', InTransit: 'Đang vận chuyển',
  Delivered: 'Đã giao hàng', DeliveryFailed: 'Giao hàng thất bại',
  ready_to_pick: 'Chờ GHN lấy hàng', picking: 'GHN đang lấy hàng',
  money_collect_picking: 'Đang thu tiền khi lấy hàng', picked: 'GHN đã lấy hàng',
  storing: 'Đang lưu tại kho GHN', transporting: 'Đang vận chuyển',
  sorting: 'Đang phân loại tại GHN', delivering: 'Đang giao hàng',
  money_collect_delivering: 'Đang thu tiền khi giao hàng', delivered: 'Đã giao hàng',
  delivery_fail: 'Giao hàng thất bại', waiting_to_return: 'Chờ hoàn hàng',
  return: 'Đang hoàn hàng', returned: 'Đã hoàn hàng', cancel: 'Đã hủy',
  exception: 'Có sự cố', damage: 'Hàng bị hư hỏng', lost: 'Hàng bị thất lạc',
};

export const getStatusLabel = (status?: string | null, fallback = 'Chưa xác định') => {
  if (!status) return fallback;
  return STATUS_LABELS[status] ?? status;
};

export default STATUS_LABELS;
