# Hướng Dẫn Cài Đặt & Khởi Chạy Hệ Thống CRS

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Java**: JDK 17 hoặc JDK 21
- **Node.js**: Phiên bản 18.x hoặc mới hơn (kèm npm)
- **Database**: MySQL Server 8.x
- **Công cụ phát triển**: IntelliJ IDEA (hoặc Eclipse / VS Code), Postman Desktop, Git

---

## 2. Thiết Lập Cơ Sở Dữ Liệu MySQL

Đăng nhập vào MySQL Server (qua MySQL Workbench hoặc CLI) và tạo 3 cơ sở dữ liệu độc lập cho 3 microservices:

```sql
-- 1. Cơ sở dữ liệu cho Auth Service
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Cơ sở dữ liệu cho Course Service
CREATE DATABASE IF NOT EXISTS course_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Cơ sở dữ liệu cho Registration Service
CREATE DATABASE IF NOT EXISTS registration_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> [!NOTE]
> Khi các service Spring Boot khởi chạy với cấu hình `spring.jpa.hibernate.ddl-auto=update`, các bảng cần thiết (`users`, `students`, `courses`, `registrations`) sẽ được tự động khởi tạo.

---

## 3. Thứ Tự Khởi Chạy Các Service Backend

Để hệ thống hoạt động ổn định và sẵn sàng nhận kết nối, khuyến nghị khởi chạy theo trình tự sau:

### Bước 1: Khởi chạy `auth-service` (Cổng 8081)
- Mở thư mục `crs-microservices/auth-service` trong IDE.
- Kiểm tra file `src/main/resources/application.properties` (username/password của MySQL).
- Chạy class: `vn.edu.crs.auth_service.AuthServiceApplication`.

### Bước 2: Khởi chạy `course-service` (Cổng 8082)
- Mở thư mục `crs-microservices/course-service` trong IDE.
- Kiểm tra kết nối tới database `course_db`.
- Chạy class: `vn.edu.crs.course_service.CourseServiceApplication`.

### Bước 3: Khởi chạy `registration-service` (Cổng 8083)
- Mở thư mục `crs-microservices/registration-service` trong IDE.
- Kiểm tra kết nối tới database `registration_db`.
- Chạy class: `vn.edu.crs.registration_service.RegistrationServiceApplication`.

### Bước 4: Khởi chạy `api-gateway` (Cổng 8080)
- Mở thư mục `crs-microservices/api-gateway` trong IDE.
- Chạy class: `vn.edu.crs.api_gateway.ApiGatewayApplication`.
- API Gateway sẽ lắng nghe tại `http://localhost:8080` và chuyển tiếp các yêu cầu đến 3 service phía sau.

---

## 4. Khởi Chạy Ứng Dụng Frontend (`crs-frontend`)

### Bước 1: Kiểm tra cấu hình môi trường
File `crs-microservices/crs-frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### Bước 2: Cài đặt thư viện và khởi động Web App
Mở terminal tại thư mục `crs-frontend`:
```bash
cd crs-microservices/crs-frontend
npm install
npm run dev
```

Truy cập ứng dụng tại địa chỉ: **`http://localhost:5173`** (hoặc cổng hiển thị trên terminal của Vite).

---

## 5. Kịch Bản Kiểm Thử & Xác Thực Nghiệp Vụ

### Kịch bản 1: Trạng thái Tải dữ liệu & Thành công (Loading & Success)
1. Mở trang web `http://localhost:5173`.
2. Quan sát thấy thông báo `"Dang tai danh sach mon hoc..."` xuất hiện trong tích tắc.
3. Bảng danh sách môn học hiển thị đầy đủ các cột: *Tên môn học*, *Số tín chỉ*, *Số chỗ còn lại*.

### Kịch bản 2: Tìm kiếm có Debounce & Trạng thái Rỗng (Empty State)
1. Nhập từ khóa bất kỳ vào ô tìm kiếm (ví dụ: `"Lap trinh"`). Quan sát thấy hệ thống chỉ gửi 1 request sau khi ngừng gõ 400ms.
2. Nhập từ khóa không tồn tại (ví dụ: `"monhoc_khong_co_999"`).
3. Giao diện chuyển sang trạng thái rỗng và hiển thị dòng chữ:
   > *"Khong tim thay mon hoc nao phu hop."*

### Kịch bản 3: Phân trang (Pagination)
1. Tạo nhiều hơn 10 môn học trong `course_db`.
2. Thanh phân trang xuất hiện bên dưới bảng dữ liệu.
3. Bấm chuyển sang trang tiếp theo: danh sách môn học cập nhật tương ứng, số trang hiện tại được in đậm và gạch chân.
4. Khi đang ở trang 2 hoặc 3, thực hiện gõ từ khóa tìm kiếm mới -> Hệ thống tự động reset về trang 1 (`page = 0`).

### Kịch bản 4: Xử lý Lỗi & Nút "Thử lại" (Error State & Retry)
1. Dừng service `api-gateway` (tắt process tại cổng 8080).
2. Tải lại trang hoặc tìm kiếm.
3. Giao diện không bị sập (trắng trang) mà hiển thị thông báo lỗi màu đỏ:
   > *"Khong ket noi duoc toi he thong. Vui long thu lai sau."*
   Kèm nút **"Thu lai"**.
4. Bật lại `api-gateway` và bấm nút **"Thu lai"** -> Dữ liệu được tải lại thành công mà không cần F5 trình duyệt.
