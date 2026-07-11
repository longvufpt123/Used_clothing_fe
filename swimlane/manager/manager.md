# Quy quy trình Swimlane - Manager

Tài liệu này tổng hợp toàn bộ các quy trình nghiệp vụ dạng Swimlane của vai trò **Manager** và sự tương tác giữa **Manager**, **Hệ thống (System)** và **AI Gemini**.

---

## 1. Nhóm cấu hình (Configuration)

### 1.1. Manager Configure Shift (Cấu hình ca làm việc)
Quy trình giúp Manager thiết lập, chỉnh sửa ca làm việc và phân bổ nhân sự vào ca.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        M1_Start([Bắt đầu])
        M1_Login[Đăng nhập]
        M1_OpenConfig[Mở trang cấu hình]
        M1_EditShift[Chỉnh sửa ca làm việc]
        M1_AddStaff[Thêm nhân viên vào ca]
        M1_Save[Lưu cấu hình]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        S1_Load[Tải dữ liệu cấu hình cũ]
        S1_Display[Hiển thị thiết lập ca hiện tại]
        S1_Check{Cấu hình mới hợp lệ?}
        S1_NotifyInvalid[Thông báo cấu hình không hợp lệ]
        S1_Update[Cập nhật cấu hình hệ thống]
        S1_NotifySuccess[Thông báo lưu thành công]
        S1_End([Kết thúc])
    end

    M1_Start --> M1_Login
    M1_Login --> M1_OpenConfig
    M1_OpenConfig --> S1_Load
    S1_Load --> S1_Display
    S1_Display --> M1_EditShift
    M1_EditShift --> S1_Check
    
    S1_Check -- "Không (No)" --> S1_NotifyInvalid
    S1_NotifyInvalid --> M1_EditShift
    
    S1_Check -- "Có (Yes)" --> M1_AddStaff
    M1_AddStaff --> M1_Save
    M1_Save --> S1_Update
    S1_Update --> S1_NotifySuccess
    S1_NotifySuccess --> S1_End

    style M1_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style S1_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style S1_Check fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

### 1.2. Manager Configure System (Cấu hình hệ thống)
Quy trình Manager thiết lập các cấu hình hệ thống tổng quát.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        M2_Start([Bắt đầu])
        M2_Login[Đăng nhập]
        M2_OpenConfig[Mở trang cấu hình]
        M2_EditSettings[Chỉnh sửa thiết lập]
        M2_Save[Lưu cấu hình]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        S2_Load[Tải cấu hình]
        S2_Display[Hiển thị thiết lập hiện tại]
        S2_Check{Thiết lập mới hợp lệ?}
        S2_NotifyInvalid[Thông báo thiết lập không hợp lệ]
        S2_Update[Cập nhật cấu hình]
        S2_NotifySuccess[Thông báo lưu cấu hình thành công]
        S2_End([Kết thúc])
    end

    M2_Start --> M2_Login
    M2_Login --> M2_OpenConfig
    M2_OpenConfig --> S2_Load
    S2_Load --> S2_Display
    S2_Display --> M2_EditSettings
    M2_EditSettings --> S2_Check
    
    S2_Check -- "Không (No)" --> S2_NotifyInvalid
    S2_NotifyInvalid --> M2_EditSettings
    
    S2_Check -- "Có (Yes)" --> M2_Save
    M2_Save --> S2_Update
    S2_Update --> S2_NotifySuccess
    S2_NotifySuccess --> S2_End

    style M2_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style S2_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style S2_Check fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

---

## 2. Nhóm quản lý tài khoản & Yêu cầu (Account & Requests)

### 2.1. Manager Manage Account (Quản lý tài khoản)
Quy trình Manager quản lý các tài khoản trong hệ thống.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        M3_Start([Bắt đầu])
        M3_Login[Đăng nhập]
        M3_OpenInfo[Mở trang thông tin tài khoản]
        M3_ViewMgmt[Xem quản lý tài khoản]
        M3_ViewList[Xem danh sách tài khoản]
        M3_EditAcc[Chỉnh sửa thông tin tài khoản]
        M3_Save[Lưu thay đổi]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        S3_Retrieve[Truy xuất dữ liệu tài khoản]
        S3_Display[Hiển thị danh sách tài khoản]
        S3_Check{Thay đổi hợp lệ?}
        S3_NotifyInvalid[Thông báo chỉnh sửa không hợp lệ]
        S3_Update[Cập nhật dữ liệu tài khoản]
        S3_NotifySuccess[Thông báo cập nhật thành công]
        S3_End([Kết thúc])
    end

    M3_Start --> M3_Login
    M3_Login --> M3_OpenInfo
    M3_OpenInfo --> S3_Retrieve
    S3_Retrieve --> S3_Display
    S3_Display --> M3_ViewList
    M3_ViewList --> M3_EditAcc
    M3_EditAcc --> S3_Check
    
    S3_Check -- "Không (No)" --> S3_NotifyInvalid
    S3_NotifyInvalid --> M3_EditAcc
    
    S3_Check -- "Có (Yes)" --> M3_Save
    M3_Save --> S3_Update
    S3_Update --> S3_NotifySuccess
    S3_NotifySuccess --> S3_End

    style M3_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style S3_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style S3_Check fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

### 2.2. Manager Approve Organization's Request (Phê duyệt yêu cầu từ Tổ chức)
Quy trình tiếp nhận và phê duyệt/từ chối các yêu cầu phân phối quần áo từ các tổ chức/đơn vị.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        M4_Start([Bắt đầu])
        M4_Login[Đăng nhập]
        M4_OpenReq[Mở trang yêu cầu phân phối]
        M4_ViewReq[Xem thông tin yêu cầu]
        M4_CheckInventory[Kiểm tra lượng kho khả dụng]
        M4_Decide{Phê duyệt yêu cầu?}
        M4_InputReason[Nhập lý do từ chối]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        S4_Retrieve[Truy xuất thông tin yêu cầu]
        S4_Display[Hiển thị thông tin yêu cầu]
        
        %% Rẽ nhánh Phê duyệt
        S4_UpdateApprove[Cập nhật trạng thái = Đã phê duyệt]
        S4_RecordApprove[Lưu lịch sử phê duyệt]
        S4_NotifyApprove[Thông báo tới Tổ chức / Đơn vị tái chế và Nhóm kho]
        
        %% Rẽ nhánh Từ chối
        S4_UpdateReject[Cập nhật trạng thái = Từ chối]
        S4_RecordReject[Lưu lịch sử từ chối + lý do]
        S4_NotifyReject[Thông báo tới Tổ chức / Đơn vị tái chế]
        
        S4_End([Kết thúc])
    end

    M4_Start --> M4_Login
    M4_Login --> M4_OpenReq
    M4_OpenReq --> S4_Retrieve
    S4_Retrieve --> S4_Display
    S4_Display --> M4_ViewReq
    M4_ViewReq --> M4_CheckInventory
    M4_CheckInventory --> M4_Decide

    %% Xử lý kết quả Approve / Reject
    M4_Decide -- "Phê duyệt (Approve)" --> S4_UpdateApprove
    S4_UpdateApprove --> S4_RecordApprove
    S4_RecordApprove --> S4_NotifyApprove
    S4_NotifyApprove --> S4_End

    M4_Decide -- "Từ chối (Reject)" --> M4_InputReason
    M4_InputReason --> S4_UpdateReject
    S4_UpdateReject --> S4_RecordReject
    S4_RecordReject --> S4_NotifyReject
    S4_NotifyReject --> S4_End

    style M4_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style S4_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style M4_Decide fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

---

## 3. Nhóm xem báo cáo (Reports)

### 3.1. Manager View Reports (Xem báo cáo & Thống kê)
Quy trình Manager truy xuất, kiểm tra số liệu và tải báo cáo về thiết bị.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        M5_Start([Bắt đầu])
        M5_Login[Đăng nhập]
        M5_OpenDB[Mở Bảng điều khiển (Dashboard)]
        M5_ViewDB[Xem Bảng điều khiển]
        M5_Download[Tải báo cáo về]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        S5_Retrieve[Truy xuất dữ liệu báo cáo]
        S5_Generate[Tạo báo cáo và số liệu thống kê]
        S5_Display[Hiển thị báo cáo & số liệu]
        S5_End([Kết thúc])
    end

    M5_Start --> M5_Login
    M5_Login --> M5_OpenDB
    M5_OpenDB --> S5_Retrieve
    S5_Retrieve --> S5_Generate
    S5_Generate --> S5_Display
    S5_Display --> M5_ViewDB
    M5_ViewDB --> M5_Download
    M5_Download --> S5_End

    style M5_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style S5_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
```

---

## 4. Nhóm lập lịch trình bằng AI (Gemini Planning & Shifts)

### 4.1. Gemini Planning Shifts (Gemini lập lịch thu gom tự động)
Quy trình tự động hóa lập kế hoạch gom hàng chạy ngầm bằng AI Gemini dựa trên thời gian và thông tin các điểm gom.

```mermaid
flowchart TD
    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        SG_Start([Bắt đầu])
        SG_SendAddr[Gửi danh sách địa chỉ & thời gian yêu cầu quyên góp]
        SG_CreateShift[Tạo các ca làm việc]
        SG_CreateGroup[Tạo các nhóm vận hành]
        SG_CreateBatch[Tạo các lô tiếp nhận]
        SG_AddReq[Đưa yêu cầu quyên góp vào lô tiếp nhận]
        SG_CheckTime{Đã đến thời gian cấu hình?}
        SG_CheckNewReq{Có yêu cầu quyên góp mới?}
        SG_Notify[Thông báo tới Manager]
    end

    subgraph Gemini ["Làn tác vụ: AI Gemini"]
        G_Receive[Nhận toàn bộ thông tin đầu vào]
        G_AddShift[Bổ sung ca làm việc có yêu cầu quyên góp]
        G_GenRoute[Tự động tính toán lộ trình tối ưu]
        G_AddGroup[Phân phối nhóm vận hành cho các ca]
        G_AddBatch[Gán lô tiếp nhận cho từng nhóm]
        G_AddOptReq[Đưa các yêu cầu tối ưu vào lô tiếp nhận]
        G_End([Kết thúc tính toán])
    end

    SG_Start --> SG_SendAddr
    SG_SendAddr --> G_Receive
    G_Receive --> G_AddShift
    G_AddShift --> G_GenRoute
    G_GenRoute --> G_AddGroup
    G_AddGroup --> G_AddBatch
    G_AddBatch --> G_AddOptReq
    G_AddOptReq --> SG_CreateShift
    SG_CreateShift --> SG_CreateGroup
    SG_CreateGroup --> SG_CreateBatch
    SG_CreateBatch --> SG_AddReq
    SG_AddReq --> SG_CheckTime
    
    %% Rẽ nhánh kiểm tra thời gian
    SG_CheckTime -- "Chưa (No)" --> SG_CheckNewReq
    SG_CheckNewReq -- "Không (No)" --> SG_CheckTime
    SG_CheckNewReq -- "Có (Yes)" --> SG_Notify
    
    SG_CheckTime -- "Rồi (Yes)" --> SG_Notify
    SG_Notify --> G_End

    style SG_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style G_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style SG_CheckTime fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style SG_CheckNewReq fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

### 4.2. Manager Confirm Planning Shift (Xác nhận lịch trình đề xuất)
Quy trình Manager kiểm tra, điều chỉnh và xác nhận lịch trình ca làm việc được tạo bởi AI.

```mermaid
flowchart TD
    subgraph Manager ["Làn tác vụ: Manager"]
        MC_Start([Bắt đầu])
        MC_Login[Đăng nhập]
        MC_Receive[Nhận thông báo xác nhận ca]
        MC_ViewPlan[Xem kế hoạch đề xuất]
        MC_Edit{Cần chỉnh sửa?}
        MC_Input[Nhập dữ liệu thay đổi]
        MC_Confirm[Xác nhận kế hoạch lịch trình]
        MC_Assign[Gán nhân viên vào nhóm vận hành]
    end

    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        SC_Display[Hiển thị kết quả kế hoạch đề xuất]
        SC_Check{Thay đổi hợp lệ?}
        SC_Save[Lưu thông tin các nhóm]
        SC_End([Kết thúc])
    end

    MC_Start --> MC_Login
    MC_Login --> MC_Receive
    MC_Receive --> MC_ViewPlan
    MC_ViewPlan --> SC_Display
    SC_Display --> MC_Edit
    
    %% Rẽ nhánh Chỉnh sửa
    MC_Edit -- "Có (Yes)" --> MC_Input
    MC_Input --> SC_Check
    SC_Check -- "Không (No)" --> MC_Input
    SC_Check -- "Có (Yes)" --> MC_Confirm
    
    MC_Edit -- "Không (No)" --> MC_Confirm
    
    MC_Confirm --> MC_Assign
    MC_Assign --> SC_Save
    SC_Save --> SC_End

    style MC_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style SC_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style MC_Edit fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style SC_Check fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

### 4.3. Manager re-confirm shift planning (Tái cấu trúc và xác nhận lại)
Quy trình xử lý việc cập nhật lại lịch trình khi có sự thay đổi vào ngày vận hành thực tế.

```mermaid
flowchart TD
    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        SR_Start([Bắt đầu])
        SR_CheckDay{Đã đến ngày vận hành?}
        SR_Notify[Thông báo tới Manager]
        SR_Display[Hiển thị kết quả kế hoạch]
        SR_Check{Thay đổi hợp lệ?}
    end

    subgraph Gemini ["Làn tác vụ: AI Gemini"]
        GR_Replan[Lập lịch lại ca làm việc dựa trên trạng thái yêu cầu quyên góp]
    end

    subgraph Manager ["Làn tác vụ: Manager"]
        MR_Login[Đăng nhập]
        MR_Review[Xem xét lại lịch trình ca]
        MR_Edit{Cần chỉnh sửa?}
        MR_Input[Nhập dữ liệu thay đổi]
        MR_Confirm{Xác nhận?}
        MR_Operate[Vận hành ca làm việc]
        MR_End([Kết thúc])
    end

    SR_Start --> SR_CheckDay
    
    %% Rẽ nhánh Ngày vận hành
    SR_CheckDay -- "Chưa (No)" --> GR_Replan
    GR_Replan --> SR_CheckDay
    
    SR_CheckDay -- "Rồi (Yes)" --> SR_Notify
    SR_Notify --> MR_Login
    MR_Login --> MR_Review
    MR_Review --> SR_Display
    SR_Display --> MR_Edit
    
    %% Rẽ nhánh chỉnh sửa của Manager
    MR_Edit -- "Có (Yes)" --> MR_Input
    MR_Input --> SR_Check
    SR_Check -- "Không (No)" --> MR_Input
    SR_Check -- "Có (Yes)" --> MR_Confirm
    
    MR_Edit -- "Không (No)" --> MR_Confirm
    
    MR_Confirm -- "Có (Yes)" --> MR_Operate
    MR_Confirm -- "Không (No)" --> MR_End
    MR_Operate --> MR_End

    style SR_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style MR_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style SR_CheckDay fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style MR_Edit fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style SR_Check fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style MR_Confirm fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

---

## 5. Nhóm phân phối hàng hóa (Distribution Requests)

### 5.1. Tạo yêu cầu phân phối khi kho đầy (>80%)
Quy trình tự động kích hoạt khi dung tích lưu trữ của kho vượt quá 80%, Manager tạo yêu cầu phân phối đến các tổ chức thích hợp.

```mermaid
flowchart TD
    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        SD1_Start([Bắt đầu])
        SD1_Notify[Thông báo Manager: Dung tích kho > 80%]
        SD1_Save[Lưu yêu cầu phân phối]
        SD1_SetStatus[Thiết lập trạng thái = Chờ xử lý / Pending]
        SD1_NotifyOrg[Thông báo tới Tổ chức nhận]
        SD1_End([Kết thúc])
    end

    subgraph Manager ["Làn tác vụ: Manager"]
        MD1_View[Xem thông tin kho bãi]
        MD1_Create[Tạo yêu cầu phân phối tới Tổ chức cụ thể]
        MD1_Input[Nhập loại quần áo và số lượng]
    end

    SD1_Start --> SD1_Notify
    SD1_Notify --> MD1_View
    MD1_View --> MD1_Create
    MD1_Create --> MD1_Input
    MD1_Input --> SD1_Save
    SD1_Save --> SD1_SetStatus
    SD1_SetStatus --> SD1_NotifyOrg
    SD1_NotifyOrg --> SD1_End

    style SD1_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style SD1_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
```

### 5.2. Xác nhận yêu cầu phân phối đã được duyệt
Quy trình Manager xác nhận yêu cầu phân phối đã được phê duyệt thành công để tiến hành chuẩn bị đóng gói và chuyển giao cho nhóm kho.

```mermaid
flowchart TD
    subgraph System ["Làn tác vụ: Hệ thống (System)"]
        SD2_Start([Bắt đầu])
        SD2_Notify[Thông báo Manager: Yêu cầu phân phối đã được duyệt]
        SD2_SetStatus[Thiết lập trạng thái = Đang chuẩn bị / Preparing]
        SD2_SendInfo[Gửi thông tin yêu cầu tới Nhóm kho]
        SD2_End([Kết thúc])
    end

    subgraph Manager ["Làn tác vụ: Manager"]
        MD2_View[Xem yêu cầu]
        MD2_Confirm[Xác nhận yêu cầu phân phối]
    end

    SD2_Start --> SD2_Notify
    SD2_Notify --> MD2_View
    MD2_View --> MD2_Confirm
    MD2_Confirm --> SD2_SetStatus
    SD2_SetStatus --> SD2_SendInfo
    SD2_SendInfo --> SD2_End

    style SD2_Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style SD2_End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
```
