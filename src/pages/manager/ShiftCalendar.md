# Trang Lịch Ca Làm Việc (ShiftCalendar)

- **File:** `src/pages/manager/ShiftCalendar.tsx`
- **Route:** `/manager/shifts` (gắn trong `AppRoutes.tsx:131`, chỉ role **Manager** truy cập được)
- **Service dùng chung:** `src/services/receivingService.ts`

## Danh sách API đã gắn

| # | API (method + endpoint) | Hàm gọi trong service | Khi nào gọi | Loại |
|---|---|---|---|---|
| 1 | `GET /receiving-operations/manager-setup` | `getManagerSetup()` | Khi trang vừa load (`useEffect`) và mỗi lần bấm nút làm mới (🔄) | **Lấy dữ liệu** — trả về danh sách kho, nhân viên nhận hàng và toàn bộ ca làm việc để hiển thị lên lịch |
| 2 | `POST /receiving-operations/standard-shifts` | `generateStandardShifts(warehouseId, date)` | Bấm "Tạo 2 ca" cho 1 ngày cụ thể trong panel bên phải | **FE xử lý rồi gửi lên BE** — FE lấy `warehouseId` đang chọn + ngày đang chọn trên lịch, gửi lên để BE tạo ca sáng/chiều mặc định |
| 3 | `POST /receiving-operations/year-shifts` | `generateYearShifts(warehouseId, year, holidayDates, workingDays, times)` | Bấm "Xác nhận tạo lịch" trong modal "Tạo lịch năm" | **FE xử lý rồi gửi lên BE** — FE thu thập kho, năm, danh sách ngày lễ (parse từ textarea), các thứ làm việc trong tuần, giờ ca sáng/chiều rồi gửi nguyên khối lên BE để sinh ca cho cả năm |
| 4 | `POST /receiving-operations/month-shifts` | `generateMonthShifts(warehouseId, year, month, holidayDates, workingDays, times)` | Bấm nút "Tạo N ca cho Tháng X" trong modal "Tạo lịch tháng" | **FE xử lý rồi gửi lên BE** — tương tự API tạo lịch năm nhưng chỉ cho 1 tháng; FE còn tự tính trước số ngày làm việc/ca dự kiến (`monthPreview`) để hiển thị preview trước khi gửi |
| 5 | `DELETE /receiving-operations/year-shifts?warehouseId=...&year=...` | `deleteYearShifts(warehouseId, year)` | Bấm "Xác nhận xóa tất cả" trong modal xóa lịch năm | **FE gửi yêu cầu xóa lên BE** — BE tự loại trừ các ca đã phát sinh vận hành (đã có team/đơn/intake batch) |
| 6 | `PUT /receiving-operations/manager-shifts/:shiftId` | `updateShift(shiftId, data)` | Bấm "Lưu thay đổi" khi chỉnh sửa 1 ca trong modal chi tiết ca | **FE xử lý rồi gửi lên BE** — FE lấy dữ liệu form (tên ca, ngày, giờ bắt đầu/kết thúc) đã validate rồi gửi lên cập nhật |
| 7 | `DELETE /receiving-operations/manager-shifts/:shiftId` | `deleteShift(shiftId)` | Bấm "Xác nhận xóa" khi xóa 1 ca đơn lẻ trong modal chi tiết ca | **FE gửi yêu cầu xóa lên BE** — chỉ cho phép xóa ca đang ở trạng thái "Đã lên lịch" (validate ở FE bằng cách disable nút) |

## Ghi chú
- Tất cả API đều đi qua `apiClient` (axios wrapper) trong `src/services/api.ts`, không gọi trực tiếp trong component.
- Các API tạo lịch (2, 3, 4) đều có validate phía FE trước khi gửi (giờ bắt đầu phải trước giờ kết thúc, ca sáng phải kết thúc trước khi ca chiều bắt đầu, định dạng ngày `YYYY-MM-DD`...) nhằm giảm request lỗi lên BE.
- Sau mỗi API tạo/sửa/xóa thành công, FE đều gọi lại `getManagerSetup()` (API #1) để đồng bộ lại toàn bộ dữ liệu lịch mới nhất từ BE.
