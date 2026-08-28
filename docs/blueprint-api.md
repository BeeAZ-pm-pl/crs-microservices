# Blueprint API (Tài Liệu Hợp Đồng API Toàn Hệ Thống)

Tài liệu mô tả chi tiết toàn bộ các Endpoint HTTP RESTful trong hệ thống CRS, định dạng dữ liệu (Request/Response DTO), phân quyền truy cập, các tham số phân trang và định dạng lỗi chuẩn.

---

## 1. auth-service (Cổng: 8081 | Gateway: `/api/auth/**`)

### 1.1. Đăng nhập hệ thống
- **Method**: `POST`
- **Path**: `/auth/login` (Qua Gateway: `/api/auth/login`)
- **Phân quyền**: Public
- **Request Body**:
```json
{
  "username": "student1",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "username": "student1",
  "role": "ROLE_STUDENT",
  "studentId": 1
}
```
- **Response Lỗi**:
  - `401 Unauthorized`: Sai tên đăng nhập hoặc mật khẩu.

### 1.2. Đăng ký tài khoản
- **Method**: `POST`
- **Path**: `/auth/register` (Qua Gateway: `/api/auth/register`)
- **Phân quyền**: Public
- **Request Body**:
```json
{
  "username": "student2",
  "password": "password123",
  "fullName": "Nguyen Van B",
  "email": "student2@edu.vn",
  "role": "STUDENT"
}
```
- **Response `201 Created`**:
```json
{
  "id": 2,
  "username": "student2",
  "fullName": "Nguyen Van B",
  "role": "STUDENT"
}
```

---

## 2. course-service (Cổng: 8082 | Gateway: `/api/courses/**`)

### 2.1. Lấy danh sách môn học (có Tìm kiếm & Phân trang)
- **Method**: `GET`
- **Path**: `/courses` (Qua Gateway: `/api/courses`)
- **Phân quyền**: Public
- **Query Parameters**:
  - `keyword` *(optional, string)*: Từ khoá tìm kiếm theo tên môn học (tìm tương đối không phân biệt hoa thường).
  - `page` *(optional, int, default: `0`)*: Số thứ tự trang (bắt đầu từ `0`).
  - `size` *(optional, int, default: `10`)*: Số phần tử mỗi trang.
  - `sort` *(optional, string)*: Trường sắp xếp (mặc định theo `id,asc` hoặc `tenMonHoc`).
- **Response `200 OK`**:
```json
{
  "content": [
    {
      "id": 1,
      "tenMonHoc": "Lap trinh Microservices",
      "soTinChi": 3,
      "soChoToiDa": 40,
      "soChoConLai": 15
    },
    {
      "id": 2,
      "tenMonHoc": "Kien truc phan mem nang cao",
      "soTinChi": 4,
      "soChoToiDa": 30,
      "soChoConLai": 0
    }
  ],
  "totalElements": 2,
  "totalPages": 1,
  "number": 0,
  "size": 10
}
```

### 2.2. Xem chi tiết một môn học
- **Method**: `GET`
- **Path**: `/courses/{id}` (Qua Gateway: `/api/courses/{id}`)
- **Phân quyền**: Public
- **Response `200 OK`**:
```json
{
  "id": 1,
  "tenMonHoc": "Lap trinh Microservices",
  "soTinChi": 3,
  "soChoToiDa": 40,
  "soChoConLai": 15
}
```
- **Response `404 Not Found`**: Không tìm thấy môn học theo ID.

### 2.3. Thêm mới môn học
- **Method**: `POST`
- **Path**: `/courses` (Qua Gateway: `/api/courses`)
- **Phân quyền**: `ROLE_ADMIN` (Header: `Authorization: Bearer <JWT>`)
- **Request Body**:
```json
{
  "tenMonHoc": "He co so du lieu phan tan",
  "soTinChi": 3,
  "soChoToiDa": 50
}
```
- **Response `201 Created`**: Trả về `CourseDTO` đã tạo (mặc định `soChoConLai = soChoToiDa`).
- **Response `400 Bad Request`**: Dữ liệu không hợp lệ hoặc tên môn học đã tồn tại.

### 2.4. Cập nhật môn học
- **Method**: `PUT`
- **Path**: `/courses/{id}` (Qua Gateway: `/api/courses/{id}`)
- **Phân quyền**: `ROLE_ADMIN` (Header: `Authorization: Bearer <JWT>`)
- **Request Body**:
```json
{
  "tenMonHoc": "He co so du lieu phan tan",
  "soTinChi": 3,
  "soChoToiDa": 60,
  "soChoConLai": 35
}
```
- **Response `200 OK`**: Trả về `CourseDTO` sau khi cập nhật.

### 2.5. Xoá môn học
- **Method**: `DELETE`
- **Path**: `/courses/{id}` (Qua Gateway: `/api/courses/{id}`)
- **Phân quyền**: `ROLE_ADMIN` (Header: `Authorization: Bearer <JWT>`)
- **Response `204 No Content`**

---

## 3. course-service: API Nội Bộ (Internal API)
> [!WARNING]
> Các API này **chỉ được gọi trực tiếp giữa các service** (từ `registration-service`), **KHÔNG** được public qua Gateway cho Frontend.

### 3.1. Giữ chỗ / Trừ chỗ khi sinh viên đăng ký môn
- **Method**: `PATCH`
- **Path**: `http://localhost:8082/internal/courses/{id}/reserve-seat`
- **Mô tả**: Kiểm tra môn học tồn tại và `soChoConLai > 0`. Thực hiện trừ `soChoConLai` đi 1 trong transaction (`@Transactional`).
- **Response `200 OK`**:
```json
{
  "id": 1,
  "tenMonHoc": "Lap trinh Microservices",
  "soTinChi": 3,
  "soChoToiDa": 40,
  "soChoConLai": 14
}
```
- **Response `400 Bad Request`**: Môn học đã hết chỗ (`soChoConLai <= 0`).
- **Response `404 Not Found`**: Môn học không tồn tại.

### 3.2. Hoàn trả chỗ khi sinh viên huỷ đăng ký
- **Method**: `PATCH`
- **Path**: `http://localhost:8082/internal/courses/{id}/release-seat`
- **Mô tả**: Hoàn trả 1 chỗ (`soChoConLai + 1`) nếu `soChoConLai < soChoToiDa`.
- **Response `200 OK`**: Trả về `CourseDTO` sau khi tăng chỗ.

---

## 4. course-service: API Dành Cho Đối Tác Ngoài (API Key)

### 4.1. Lấy danh sách môn học qua API Key
- **Method**: `GET`
- **Path**: `/api/public/courses` (Qua Gateway)
- **Header bắt buộc**: `X-API-Key: CRS_PARTNER_SECRET_KEY_2026`
- **Phân quyền**: Xác thực qua API Key tại Gateway Filter, không cần JWT Bearer token.
- **Response `200 OK`**: Trả về danh sách môn học.

---

## 5. registration-service (Cổng: 8083 | Gateway: `/api/registrations/**`)

### 5.1. Đăng ký học phần
- **Method**: `POST`
- **Path**: `/registrations` (Qua Gateway: `/api/registrations`)
- **Phân quyền**: `ROLE_STUDENT` (Header: `Authorization: Bearer <JWT>`)
- **Request Body**:
```json
{
  "courseId": 1
}
```
- **Xử lý ngầm**:
  1. Lấy `studentId` từ Claims của JWT.
  2. Kiểm tra xem sinh viên đã đăng ký môn này chưa.
  3. Gửi HTTP PATCH sang `http://localhost:8082/internal/courses/1/reserve-seat`.
  4. Nếu reserve thành công -> Lưu bản ghi vào bảng `registrations` của `registration_db`.
- **Response `201 Created`**:
```json
{
  "id": 101,
  "studentId": 1,
  "courseId": 1,
  "status": "REGISTERED",
  "registrationDate": "2026-08-28T14:30:00"
}
```
- **Response Lỗi**:
  - `400 Bad Request`: Môn học đã hết chỗ hoặc sinh viên đã đăng ký môn học này trước đó.
  - `404 Not Found`: Môn học không tồn tại.

### 5.2. Lấy danh sách học phần đã đăng ký của tôi
- **Method**: `GET`
- **Path**: `/registrations/my` (Qua Gateway: `/api/registrations/my`)
- **Phân quyền**: `ROLE_STUDENT` (Header: `Authorization: Bearer <JWT>`)
- **Response `200 OK`**:
```json
[
  {
    "id": 101,
    "studentId": 1,
    "courseId": 1,
    "status": "REGISTERED",
    "registrationDate": "2026-08-28T14:30:00"
  }
]
```

### 5.3. Huỷ đăng ký học phần
- **Method**: `DELETE`
- **Path**: `/registrations/{id}` (Qua Gateway: `/api/registrations/{id}`)
- **Phân quyền**: `ROLE_STUDENT` (chính chủ) hoặc `ROLE_ADMIN`
- **Xử lý ngầm**:
  1. Kiểm tra quyền sở hữu bản ghi đăng ký.
  2. Gửi HTTP PATCH sang `http://localhost:8082/internal/courses/{courseId}/release-seat`.
  3. Xoá hoặc cập nhật trạng thái bản ghi trong `registration_db`.
- **Response `204 No Content`**

---

## 6. Định Dạng Lỗi Chuẩn (Standard Error Response)

Mọi phản hồi lỗi từ các dịch vụ hoặc từ Gateway đều tuân theo chuẩn cấu trúc sau:

```json
{
  "timestamp": "2026-08-28T14:35:00.123+07:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Mon hoc nay da het cho con lai.",
  "path": "/api/registrations"
}
```

Trường hợp lỗi Validate dữ liệu đầu vào (`400 Bad Request`):
```json
{
  "timestamp": "2026-08-28T14:35:00.123+07:00",
  "status": 400,
  "error": "Validation Error",
  "message": "Du lieu dau vao khong hop le",
  "errors": {
    "tenMonHoc": "Ten mon hoc khong duoc de trong",
    "soTinChi": "So tin chi phai tu 1 den 10"
  }
}
```
