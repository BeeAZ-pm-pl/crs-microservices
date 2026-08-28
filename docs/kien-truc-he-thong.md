# Kiến Trúc Hệ Thống (System Architecture & Security)

## 1. Tổng Thể Mô Hình Kiến Trúc Microservices

Hệ thống Course Registration System (CRS) áp dụng mô hình kiến trúc phân tán dựa trên Spring Boot & Spring Cloud:

```mermaid
flowchart TD
    subgraph Client Layer
        Browser["Trình duyệt / React SPA (Port 5173)"]
        PartnerClient["Đối tác ngoài (Third-party)"]
    end

    subgraph Gateway Layer
        Gateway["API Gateway (Port 8080)\n- Spring Cloud Gateway\n- CORS Centralized\n- Route Rules & API Key Filter"]
    end

    subgraph Service Mesh / Microservices
        AuthSvc["auth-service (Port 8081)\n- Cấp phát & ký JWT (HMAC-SHA256)\n- Xác thực User/Student\n- DB: auth_db"]
        CourseSvc["course-service (Port 8082)\n- Quản lý học phần\n- Tìm kiếm, Phân trang (Pageable)\n- Internal API: reserve/release seat\n- DB: course_db"]
        RegSvc["registration-service (Port 8083)\n- Đăng ký / Hủy học phần\n- RestTemplate gọi liên-service\n- DB: registration_db"]
    end

    Browser -->|HTTP Requests| Gateway
    PartnerClient -->|GET /api/public/courses + X-API-Key| Gateway

    Gateway -->|/api/auth/**| AuthSvc
    Gateway -->|/api/courses/**| CourseSvc
    Gateway -->|/api/registrations/**| RegSvc

    RegSvc -->|PATCH /internal/courses/{id}/reserve-seat| CourseSvc
    RegSvc -->|PATCH /internal/courses/{id}/release-seat| CourseSvc
```

---

## 2. Mô Hình Bảo Mật & Xác Thực (Security & Authentication Architecture)

### 2.1. Chu trình xác thực JWT (JSON Web Token)
1. **Đăng nhập (`/api/auth/login`)**:
   - Sinh viên hoặc Admin gửi thông tin đăng nhập (`username`, `password`) tới `auth-service` qua Gateway.
   - `auth-service` kiểm tra thông tin hợp lệ, tạo JWT token chứa các Claims: `userId`, `username`, `role` (`ROLE_STUDENT` hoặc `ROLE_ADMIN`), `studentId` và thời gian hết hạn (`exp`).
   - Token được ký bằng thuật toán HMAC-SHA256 với Secret Key dùng chung giữa các microservices.
2. **Gửi request kèm Token**:
   - Client lưu JWT tại `localStorage` hoặc `sessionStorage`, gửi kèm trong mọi request qua header:
     ```http
     Authorization: Bearer <jwt_token>
     ```
3. **Bảo mật phòng thủ theo chiều sâu (Defense-in-depth)**:
   - **Tầng Gateway**: Định tuyến request, chặn các request sai định dạng, xử lý CORS pre-flight (`OPTIONS`).
   - **Tầng Microservice**: Mỗi service (`course-service`, `registration-service`) đều có `JwtAuthenticationFilter` độc lập để parse và verify chữ ký JWT, không tin tưởng mù quáng vào Gateway.

### 2.2. Cơ chế phân quyền bằng Role (Role-based Access Control - RBAC)
- **Public**: `GET /api/courses`, `POST /api/auth/login`, `POST /api/auth/register`.
- **ROLE_ADMIN**: `POST /api/courses`, `PUT /api/courses/{id}`, `DELETE /api/courses/{id}`.
- **ROLE_STUDENT**: `POST /api/registrations`, `GET /api/registrations/my`, `DELETE /api/registrations/{id}`.

### 2.3. Tuyến đường API Key cho đối tác ngoài
- Tuyến đường `/api/public/courses` được kiểm tra qua `ApiKeyGatewayFilter` tại Gateway.
- Header yêu cầu: `X-API-Key: CRS_PARTNER_SECRET_KEY_2026`.
- Không bắt buộc token JWT của người dùng cá nhân.

---

## 3. Giao Tiếp Liên-Service (Inter-Service Communication)

### 3.1. Cơ chế gọi đồng bộ (Synchronous REST Call)
Khi sinh viên đăng ký môn học tại `registration-service`:
1. `registration-service` nhận request `POST /registrations` kèm `courseId` và `studentId` từ JWT.
2. `registration-service` khởi tạo `RestTemplate` (hoặc `WebClient`) thực hiện gọi HTTP sang `course-service`:
   ```http
   PATCH http://localhost:8082/internal/courses/{courseId}/reserve-seat
   ```
3. `course-service` thực hiện kiểm tra `soChoConLai > 0`, trừ `soChoConLai` đi 1 và lưu vào DB trong một giao dịch (`@Transactional`).
4. Nếu `course-service` trả về `200 OK`, `registration-service` tiến hành lưu bản ghi đăng ký vào `registration_db`.
5. Nếu `course-service` trả về lỗi (ví dụ: `400 Bad Request` do hết chỗ), `registration-service` lập tức hủy giao dịch và phản hồi thông báo lỗi rõ ràng về cho Client.

### 3.2. Giới hạn và Giải pháp Transaction phân tán
- Trong khuôn khổ dự án học tập, hệ thống áp dụng cơ chế gọi HTTP đồng bộ có kiểm tra lỗi để thực hiện đền bù (compensating action) khi xảy ra sự cố (hủy đăng ký sẽ gọi `release-seat`).

---

## 4. Xử Lý Ngoại Lệ & Lan Truyền Lỗi (Error Handling & Propagation)

### 4.1. Xử lý tập trung ở Backend (`@RestControllerAdvice`)
Mỗi service đều triển khai `GlobalExceptionHandler` bắt các loại lỗi:
- `MethodArgumentNotValidException`: Lỗi validate dữ liệu DTO đầu vào -> trả về map các trường lỗi.
- `CourseNotFoundException` / `ResourceNotFoundException`: Trả về mã `404 Not Found`.
- `SeatUnavailableException` / `DuplicateRegistrationException`: Trả về mã `400 Bad Request` kèm thông báo nghiệp vụ cụ thể.
- `Exception`: Bắt các lỗi chưa lường trước -> trả về `500 Internal Server Error`.

### 4.2. Xử lý lỗi thông minh tại Frontend (`crs-frontend`)
Custom hook `useCourses` phân biệt 2 nhóm lỗi:
1. **Lỗi nghiệp vụ từ Backend** (`err.response?.data?.message`): Hiển thị thông báo cụ thể từ service trả về.
2. **Lỗi hạ tầng / mất kết nối** (`!err.response`): Khi API Gateway hoặc service đích bị dừng (offline), Frontend hiển thị:
   > *"Khong ket noi duoc toi he thong. Vui long thu lai sau."*
   Kèm nút **"Thu lai"** (Retry) cho phép người dùng kích hoạt tải lại dữ liệu mà không làm sập (crash) ứng dụng React.
