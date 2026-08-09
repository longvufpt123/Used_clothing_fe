# Báo Cáo Kỹ Thuật & Tài Liệu Tích Hợp: Trang Lịch Ca Làm Việc (ShiftCalendar)

Tài liệu này tổng hợp toàn bộ thông tin về kiến trúc, danh sách API, luồng vận hành dữ liệu và các file liên quan của tính năng **Quản lý Lịch Ca Làm Việc** dành cho vai trò Quản lý (Manager).

---

## 📌 1. Thông Tin Chung

- **Tên trang:** Quản lý Lịch Ca Làm Việc Tiếp Nhận (Shift Calendar)
- **Tuyến đường (Route):** `/manager/shifts` (Định nghĩa tại `AppRoutes.tsx`)
- **Phân quyền truy cập:** **Manager** (`[Authorize(Roles = "Manager")]`)
- **Mục đích:** Cho phép Quản lý tạo, cập nhật, xóa và tự động sinh lịch ca làm việc (ca sáng / ca chiều) theo ngày, tháng, hoặc cả năm cho các kho tiếp nhận quần áo.

---

## 📁 2. Các File Liên Quan Trong Hệ Thống

| Tầng | File Path | Mô tả / Vai trò |
|---|---|---|
| **UI Component** | [ShiftCalendar.tsx](file:///d:/Long/Used_clothing_fe/src/pages/manager/ShiftCalendar.tsx) | Component React chính hiển thị giao diện lịch, modal tạo lịch tháng/năm và chi tiết ca |
| **CSS Style** | [ShiftCalendar.css](file:///d:/Long/Used_clothing_fe/src/pages/manager/ShiftCalendar.css) | Layout ma trận lịch 42 ngày, danh sách ca làm việc và responsive design |
| **CSS Style** | [ShiftDetail.css](file:///d:/Long/Used_clothing_fe/src/pages/manager/ShiftDetail.css) | Style cho Modal chi tiết ca, chỉnh sửa ca và xác nhận xóa ca |
| **FE Service Client** | [receivingService.ts](file:///d:/Long/Used_clothing_fe/src/services/receivingService.ts) | Tầng Service khai báo Interface DTO và các hàm gọi RESTful API từ Axios |
| **Axios Instance** | [api.ts](file:///d:/Long/Used_clothing_fe/src/services/api.ts) | Cấu hình Base URL, Bearer Authorization Header và xử lý lỗi/timeout |
| **BE Controller** | [ReceivingOperationsController.cs](file:///d:/Long/SU26SE046/src/Capstone-API/Controllers/ReceivingOperationsController.cs) | Backend Controller xử lý các endpoint của hệ thống tiếp nhận |
| **BE Service** | [ReceivingOperationsService.cs](file:///d:/Long/SU26SE046/src/BLL/Services/Implements/ReceivingOperations/ReceivingOperationsService.cs) | Logic nghiệp vụ sinh ca, kiểm tra trùng lặp và tương tác Database |
| **BE DTOs** | [ReceivingOperationsDtos.cs](file:///d:/Long/SU26SE046/src/BLL/DTOs/ReceivingOperationsDtos.cs) | Khai báo Record/DTOs cho Request và Response giữa FE và BE |

---

## 🔌 3. Danh Sách API Đã Gắn Vàn Chi Tiết Endpoint

### 3.1. Danh Sách Tổng Quan API

| # | HTTP Method | Endpoint Backend | Hàm gọi ở Service FE | Chức năng chính |
|---|---|---|---|---|
| 1 | `GET` | `/api/receiving-operations/manager-setup` | `getManagerSetup()` | Lấy toàn bộ danh sách Kho, Nhân viên và Ca làm việc |
| 2 | `POST` | `/api/receiving-operations/shifts/generate` | `generateShifts(data)` | **API V2**: Tự động sinh lịch ca hàng loạt (Ngày, Tháng, Năm) |
| 3 | `PUT` | `/api/receiving-operations/manager-shifts/{shiftId}` | `updateShift(shiftId, data)` | Chỉnh sửa tên ca, giờ bắt đầu/kết thúc |
| 4 | `DELETE` | `/api/receiving-operations/manager-shifts/{shiftId}` | `deleteShift(shiftId)` | Xóa 1 ca làm việc cụ thể chưa phát sinh vận hành |
| 5 | `DELETE` | `/api/receiving-operations/year-shifts?warehouseId=...&year=...` | `deleteYearShifts(warehouseId, year)` | Xóa hàng loạt tất cả ca làm việc trong năm được chọn |

---

### 3.2. Chi Tiết API V2 Sinh Ca Hàng Loạt (`POST /api/receiving-operations/shifts/generate`)

Đây là **API hợp nhất mới (V2)** thay thế cho các API v1 cũ (`standard-shifts`, `month-shifts`, `year-shifts`).

#### 📩 Request Payload (`GenerateShiftsParams`):
```json
{
  "warehouseId": "01746BFF-CBE1-46A0-8375-890B50CD2F99",
  "startDate": "2026-09-01",
  "periodUnit": 2,          // Enum: 0 = Day, 1 = Week, 2 = Month, 3 = Quarter, 4 = Year, 5 = Custom
  "periodValue": 1,         // Số lượng chu kỳ (VD: 1 tháng, 1 năm)
  "customEndDate": null,
  "workingDays": [0, 1, 2, 3, 4, 5], // Thứ làm việc (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)
  "excludedDates": ["2026-09-02"],   // Các ngày nghỉ lễ loại trừ ("YYYY-MM-DD")
  "shiftDefinitions": [
    {
      "name": "Ca sáng",
      "startTime": "08:00:00",
      "endTime": "11:00:00"
    },
    {
      "name": "Ca chiều",
      "startTime": "13:00:00",
      "endTime": "17:00:00"
    }
  ]
}
```

#### 📤 Response Payload (`GenerateShiftsResult`):
```json
{
  "startDate": "2026-09-01T00:00:00",
  "endDate": "2026-09-30T00:00:00",
  "workingDays": 25,
  "createdShifts": 50,
  "skippedExisting": 0
}
```

---

## 🔄 4. Luồng Vận Hành Dữ Liệu (Data Flow)

### 4.1. Luồng Khởi Tạo Trang (Page Initialization Flow)
```
[User truy cập /manager/shifts]
         │
         ▼
`useEffect` gọi `receivingService.getManagerSetup()`
         │
         ▼
[BE REST API: GET /api/receiving-operations/manager-setup]
         │
         ▼
Trả về { warehouses, receivingStaff, shifts }
         │
         ▼
FE cập nhật State -> Hiển thị Kho mặc định & Vẽ Lịch 42 ngày theo tháng
```

### 4.2. Luồng Tạo Lịch (Nút "Tạo 2 ca", "Tạo lịch tháng", "Tạo lịch năm")
```
[Manager thao tác trên UI]
  ├── (A) Bấm "Tạo 2 ca" cho ngày chọn ──> `periodUnit: 0` (Day)
  ├── (B) Mở Modal & Bấm "Tạo lịch tháng" ──> `periodUnit: 2` (Month)
  └── (C) Mở Modal & Bấm "Tạo lịch năm" ──> `periodUnit: 4` (Year)
         │
         ▼
FE thực hiện Validate dữ liệu:
  ├── Kiểm tra đã chọn Kho chưa (`warehouseId`)
  ├── Kiểm tra đã chọn ít nhất 1 ngày làm việc (`workingDays`)
  └── Kiểm tra thời gian: startTime < endTime và Ca sáng kết thúc trước Ca chiều
         │
         ▼
Gọi `receivingService.generateShifts(payload)`
         │
         ▼
[BE REST API: POST /api/receiving-operations/shifts/generate]
  ├── Tự động bỏ qua các ngày nghỉ lễ (`excludedDates` & 01/01, 30/04, 01/05, 02/09)
  ├── Chỉ sinh ca vào các ngày thuộc `workingDays`
  └── Giữ nguyên các ca đã tồn tại (`skippedExisting`)
         │
         ▼
FE nhận phản hồi Toast thành công ("Đã tạo X ca trên Y ngày...")
         │
         ▼
FE tự động gọi lại `getManagerSetup()` để Reload toàn bộ lịch mới lên giao diện.
```

### 4.3. Luồng Chỉnh Sửa / Xóa Ca
```
[Manager click vào 1 Ca trên Lịch] ──> Mở Modal Chi tiết ca
         │
         ├── Thao tác CHỈNH SỬA:
         │   1. Chọn "Chỉnh sửa" -> Cập nhật Form (ShiftName, StartTime, EndTime)
         │   2. FE validate không bị trùng giờ với các ca khác trong cùng ngày của Kho.
         │   3. Gọi `receivingService.updateShift(shiftId, editForm)`
         │   4. BE cập nhật DB -> FE báo Toast thành công -> Reload Lịch.
         │
         └── Thao tác XÓA CA:
             1. Chọn "Xóa ca" -> Bấm xác nhận xóa.
             2. Gọi `receivingService.deleteShift(shiftId)`
             3. BE xóa ca (Nếu ca chưa có đơn/team) -> FE báo Toast thành công -> Reload Lịch.
```

---

## 🛡️ 5. Ràng Buộc Nghiệp Vụ & Validation Tại Frontend

1. **Ràng buộc thời gian ca:**
   - `morningStartTime` < `morningEndTime`
   - `afternoonStartTime` < `afternoonEndTime`
   - `morningEndTime` <= `afternoonStartTime` (Ca sáng phải kết thúc trước khi ca chiều bắt đầu).
2. **Loại trừ ngày nghỉ:**
   - Ngày nghỉ mặc định cố định: `01/01`, `30/04`, `01/05`, `02/09`.
   - Các ngày nghỉ bổ sung nhập từ Textarea (được tự động định dạng thành mảng `YYYY-MM-DD`).
3. **Bảo vệ dữ liệu vận hành:**
   - Chỉ cho phép chỉnh sửa/xóa các ca ở trạng thái `Scheduled` (Đã lên lịch) và chưa phát sinh đơn hàng / phân công Team.
   - Nút xóa/sửa sẽ tự động disable trên giao diện nếu trạng thái không hợp lệ.

---

## 📝 6. Kết Luận & Tóm Tắt Nâng Cấp

- Tính năng đã được chuyển đổi hoàn toàn sang **API V2 (`POST /api/receiving-operations/shifts/generate`)**.
- Mã nguồn Frontend đồng bộ sạch sẽ, có kiểm thử kiểu TypeScript (`npx tsc --noEmit`) đạt **0 lỗi**.
- Tài liệu này hỗ trợ bất kỳ lập trình viên nào đọc vào là nắm trọn kiến trúc và luồng tích hợp của trang **Lịch Ca Làm Việc**.
