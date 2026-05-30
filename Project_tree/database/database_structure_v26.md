# 📊 Cấu trúc Database - `treefamily` (v26)

> **Database:** `treefamily`  
> **Engine:** MySQL 8.0.41  
> **Charset:** `utf8mb4_0900_ai_ci`  
> **Cập nhật:** 2026-05-30

---

## Danh sách bảng

| # | Tên bảng | Mô tả chức năng |
|---|----------|-----------------|
| 1 | `chucnang` | Danh mục chức năng / menu hệ thống |
| 2 | `dongho` | Thông tin các dòng họ |
| 3 | `loaiquanhe` | Loại quan hệ giữa thành viên |
| 4 | `loaisukien` | Loại sự kiện |
| 5 | `nguoidung` | Tài khoản người dùng |
| 6 | `quanhe` | Quan hệ giữa các thành viên |
| 7 | `role` | Nhóm quyền (role) |
| 8 | `role_chucnang` | Bảng phân quyền: role ↔ chức năng ↔ thao tác |
| 9 | `sukien` | Sự kiện dòng họ |
| 10 | `taichinhchi` | Quản lý chi tiêu tài chính |
| 11 | `taichinhthu` | Quản lý thu nhập tài chính |
| 12 | `tailieu` | Tài liệu, gia phả, văn bản |
| 13 | `thanhvien` | Thành viên trong dòng họ |
| 14 | `thaotac` | Danh mục thao tác (VIEW, CREATE, UPDATE, DELETE) |

---

## Chi tiết cấu trúc từng bảng

---

### 1. `chucnang` — Chức năng / Menu hệ thống

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `chucNangId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `chucNangCode` | VARCHAR(50) | NOT NULL | — | Mã chức năng: SUKIEN, TAICHINH... *(UNIQUE)* |
| `tenChucNang` | VARCHAR(100) | NOT NULL | — | Tên hiển thị |
| `moTa` | VARCHAR(255) | YES | NULL | Mô tả |
| `parentId` | VARCHAR(50) | YES | NULL | Chức năng cha (nếu có) |
| `icon` | VARCHAR(50) | YES | NULL | Icon hiển thị |
| `duongDan` | VARCHAR(100) | YES | NULL | URL path: /admin/events |
| `thuTu` | INT | YES | 0 | Thứ tự hiển thị |
| `active_flag` | TINYINT | YES | 1 | Trạng thái |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `chucNangId`
- `UNIQUE KEY uk_chucnang_code`: `chucNangCode`

---

### 2. `dongho` — Thông tin dòng họ

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `dongHoId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `tenDongHo` | VARCHAR(255) | YES | NULL | Tên dòng họ |
| `queQuanGoc` | VARCHAR(255) | YES | NULL | Quê quán gốc |
| `ngayThanhLap` | DATE | YES | NULL | Ngày thành lập |
| `nguoiQuanLy` | VARCHAR(255) | YES | NULL | Người quản lý |
| `ghiChu` | TEXT | YES | NULL | Ghi chú |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |
| `ngayTao` | DATETIME | YES | NULL | Ngày tạo |

**Khóa:**
- `PRIMARY KEY`: `dongHoId`

---

### 3. `loaiquanhe` — Loại quan hệ

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `loaiQuanHeId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `tenLoaiQuanHe` | VARCHAR(100) | YES | NULL | Tên loại quan hệ |
| `moTa` | TEXT | YES | NULL | Mô tả |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `loaiQuanHeId`

---

### 4. `loaisukien` — Loại sự kiện

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `loaiSuKien` | INT | NOT NULL | — | **PK** |
| `tenLoaiSuKien` | VARCHAR(200) | YES | NULL | Tên loại sự kiện |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |
| `active_flag` | INT | YES | NULL | Trạng thái |

**Khóa:**
- `PRIMARY KEY`: `loaiSuKien`

---

### 5. `nguoidung` — Người dùng

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `nguoiDungId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `dongHoId` | VARCHAR(50) | YES | NULL | **FK** → `dongho.dongHoId` |
| `roleId` | VARCHAR(50) | YES | NULL | **FK** → `role.roleId` |
| `tenDangNhap` | VARCHAR(100) | NOT NULL | — | Tên đăng nhập *(UNIQUE)* |
| `matKhau` | VARCHAR(255) | YES | NULL | Mật khẩu (hash) |
| `ngayTao` | DATETIME | YES | CURRENT_TIMESTAMP | Ngày tạo |
| `online_flag` | TINYINT | YES | 0 | Đang online |
| `active_flag` | TINYINT | YES | 1 | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `nguoiDungId`
- `UNIQUE KEY`: `tenDangNhap`
- `FK nguoidung_ibfk_1`: `roleId` → `role.roleId` ON DELETE SET NULL
- `FK nguoidung_ibfk_2`: `dongHoId` → `dongho.dongHoId` ON DELETE SET NULL

---

### 6. `quanhe` — Quan hệ thành viên

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `quanHeId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `thanhVien1Id` | INT | YES | NULL | **FK** → `thanhvien.thanhVienId` |
| `thanhVien2Id` | INT | YES | NULL | **FK** → `thanhvien.thanhVienId` |
| `loaiQuanHeId` | VARCHAR(50) | YES | NULL | **FK** → `loaiquanhe.loaiQuanHeId` |
| `ngayBatDau` | DATE | YES | NULL | Ngày bắt đầu quan hệ |
| `ngayKetThuc` | DATE | YES | NULL | Ngày kết thúc |
| `ghiChu` | TEXT | YES | NULL | Ghi chú |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |
| `dongHoId1` | VARCHAR(50) | YES | NULL | Dòng họ thành viên 1 |
| `dongHoId2` | VARCHAR(50) | YES | NULL | Dòng họ thành viên 2 |

**Khóa:**
- `PRIMARY KEY`: `quanHeId`
- `FK quanhe_ibfk_3`: `loaiQuanHeId` → `loaiquanhe.loaiQuanHeId` ON DELETE RESTRICT

---

### 7. `role` — Nhóm quyền

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `roleId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `roleCode` | VARCHAR(50) | YES | NULL | Mã role: sa, thudo, thanhvien... |
| `roleName` | VARCHAR(100) | YES | NULL | Tên role |
| `description` | VARCHAR(255) | YES | NULL | Mô tả |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `createDate` | VARCHAR(50) | YES | NULL | Ngày tạo |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `roleId`

---

### 8. `role_chucnang` — Phân quyền

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `id` | INT | NOT NULL AUTO_INCREMENT | — | **PK** |
| `roleId` | VARCHAR(50) | NOT NULL | — | **FK** → `role.roleId` |
| `chucNangId` | VARCHAR(50) | NOT NULL | — | **FK** → `chucnang.chucNangId` |
| `thaoTacId` | VARCHAR(50) | NOT NULL | — | **FK** → `thaotac.thaoTacId` |
| `dongHoId` | VARCHAR(50) | YES | NULL | NULL = tất cả dòng họ |
| `active_flag` | TINYINT | YES | 1 | Trạng thái |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `id`
- `UNIQUE KEY uk_role_chucnang`: (`roleId`, `chucNangId`, `thaoTacId`, `dongHoId`)
- `FK fk_rc_role`: `roleId` → `role.roleId` ON DELETE CASCADE
- `FK fk_rc_chucnang`: `chucNangId` → `chucnang.chucNangId` ON DELETE CASCADE
- `FK fk_rc_thaotac`: `thaoTacId` → `thaotac.thaoTacId` ON DELETE CASCADE

---

### 9. `sukien` — Sự kiện dòng họ

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `suKienId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `dongHoId` | VARCHAR(50) | YES | NULL | **FK** → `dongho.dongHoId` |
| `tenSuKien` | VARCHAR(255) | YES | NULL | Tên sự kiện |
| `ngayDienRa` | DATE | YES | NULL | Ngày diễn ra |
| `gioDienRa` | TIME | YES | NULL | Giờ diễn ra |
| `diaDiem` | VARCHAR(255) | YES | NULL | Địa điểm |
| `moTa` | TEXT | YES | NULL | Mô tả |
| `lapLai` | TINYINT | YES | NULL | Có lặp lại không |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | **FK** → `nguoidung.nguoiDungId` |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `loaiSuKien` | INT | YES | NULL | **FK** → `loaisukien.loaiSuKien` |
| `uuTien` | INT | YES | NULL | Mức độ ưu tiên |
| `lu_user_id` | VARCHAR(100) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `suKienId`
- `FK sukien_ibfk_1`: `dongHoId` → `dongho.dongHoId` ON DELETE CASCADE
- `FK sukien_ibfk_3`: `nguoiTaoId` → `nguoidung.nguoiDungId` ON DELETE SET NULL
- `FK fk_sukien_loaisukien`: `loaiSuKien` → `loaisukien.loaiSuKien`

---

### 10. `taichinhchi` — Chi tiêu tài chính

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `chiId` | INT | NOT NULL | — | **PK** (composite) |
| `dongHoId` | VARCHAR(50) | NOT NULL | — | **PK** (composite) + **FK** → `dongho.dongHoId` |
| `ngayChi` | DATE | YES | NULL | Ngày chi |
| `soTien` | DECIMAL(18,2) | YES | NULL | Số tiền |
| `phuongThucThanhToan` | VARCHAR(100) | YES | NULL | Phương thức thanh toán |
| `noiDung` | TEXT | YES | NULL | Nội dung chi |
| `nguoiNhan` | VARCHAR(255) | YES | NULL | Người nhận |
| `ghiChu` | TEXT | YES | NULL | Ghi chú |
| `ngayTao` | DATETIME | YES | NULL | Ngày tạo |
| `nguoiNhapId` | VARCHAR(50) | YES | NULL | **FK** → `nguoidung.nguoiDungId` |
| `active_flag` | TINYINT | YES | 1 | Trạng thái |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(100) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: (`chiId`, `dongHoId`)
- `FK taichinhchi_ibfk_1`: `dongHoId` → `dongho.dongHoId`
- `FK taichinhchi_ibfk_3`: `nguoiNhapId` → `nguoidung.nguoiDungId`

---

### 11. `taichinhthu` — Thu nhập tài chính

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `thuId` | INT | NOT NULL | — | **PK** (composite) |
| `dongHoId` | VARCHAR(50) | NOT NULL | — | **PK** (composite) + **FK** → `dongho.dongHoId` |
| `hoTenNguoiDong` | VARCHAR(255) | YES | NULL | Họ tên người đóng |
| `ngayDong` | DATE | YES | NULL | Ngày đóng |
| `soTien` | DECIMAL(18,2) | YES | NULL | Số tiền |
| `phuongThucThanhToan` | VARCHAR(100) | YES | NULL | Phương thức thanh toán |
| `noiDung` | TEXT | YES | NULL | Nội dung thu |
| `ghiChu` | TEXT | YES | NULL | Ghi chú |
| `nguoiNhapId` | VARCHAR(50) | YES | NULL | **FK** → `nguoidung.nguoiDungId` |
| `ngayTao` | DATETIME | YES | NULL | Ngày tạo |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(100) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: (`thuId`, `dongHoId`)
- `FK taichinhthu_ibfk_1`: `dongHoId` → `dongho.dongHoId`
- `FK taichinhthu_ibfk_3`: `nguoiNhapId` → `nguoidung.nguoiDungId`

---

### 12. `tailieu` — Tài liệu / Gia phả

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `taiLieuId` | VARCHAR(50) | NOT NULL | — | **PK** |
| `dongHoId` | VARCHAR(50) | YES | NULL | FK → `dongho.dongHoId` (index) |
| `tenTaiLieu` | VARCHAR(255) | NOT NULL | — | Tên tài liệu |
| `duongDan` | VARCHAR(255) | YES | NULL | Đường dẫn file |
| `moTa` | TEXT | YES | NULL | Mô tả |
| `loaiTaiLieu` | VARCHAR(100) | YES | NULL | Loại: Gia phả, Sắc phong, Hình ảnh... |
| `namSangTac` | INT | YES | NULL | Năm sáng tác |
| `tacGia` | VARCHAR(255) | YES | NULL | Tác giả |
| `nguonGoc` | VARCHAR(255) | YES | NULL | Nguồn gốc |
| `ghiChu` | TEXT | YES | NULL | Ghi chú |
| `ngayTaiLen` | DATE | YES | NULL | Ngày tải lên |
| `active_flag` | TINYINT | YES | 1 | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: `taiLieuId`
- `INDEX idx_tailieu_dongho`: `dongHoId`

---

### 13. `thanhvien` — Thành viên dòng họ

| Cột | Kiểu dữ liệu | Null | Mặc định | Ghi chú |
|-----|-------------|------|----------|---------|
| `thanhVienId` | INT | NOT NULL | — | **PK** (composite) |
| `dongHoId` | VARCHAR(50) | NOT NULL | — | **PK** (composite) + **FK** → `dongho.dongHoId` |
| `hoTen` | VARCHAR(255) | YES | NULL | Họ tên |
| `gioiTinh` | TINYINT | YES | 0 | 0=Nữ, 1=Nam |
| `ngaySinh` | DATE | YES | NULL | Ngày sinh |
| `ngayMat` | DATE | YES | NULL | Ngày mất |
| `noiSinh` | VARCHAR(255) | YES | NULL | Nơi sinh |
| `noiMat` | VARCHAR(255) | YES | NULL | Nơi mất |
| `ngheNghiep` | VARCHAR(255) | YES | NULL | Nghề nghiệp |
| `trinhDoHocVan` | VARCHAR(255) | YES | NULL | Trình độ học vấn |
| `soDienThoai` | VARCHAR(11) | YES | NULL | Số điện thoại |
| `diaChiHienTai` | VARCHAR(255) | YES | NULL | Địa chỉ hiện tại |
| `tieuSu` | TEXT | YES | NULL | Tiểu sử |
| `anhChanDung` | VARCHAR(255) | YES | NULL | Ảnh chân dung (đường dẫn) |
| `doiThuoc` | INT | YES | NULL | Đời thuộc (thế hệ) |
| `chaId` | INT | YES | NULL | **FK** → `thanhvien.thanhVienId` (cha) |
| `meId` | INT | YES | NULL | **FK** → `thanhvien.thanhVienId` (mẹ) |
| `voId` | INT | YES | NULL | ID vợ |
| `chongId` | INT | YES | NULL | ID chồng |
| `ngayTao` | DATETIME | YES | NULL | Ngày tạo |
| `active_flag` | TINYINT | YES | NULL | Trạng thái |
| `nguoiTaoId` | VARCHAR(50) | YES | NULL | Người tạo |
| `lu_updated` | DATETIME | YES | NULL | Thời gian cập nhật |
| `lu_user_id` | VARCHAR(50) | YES | NULL | Người cập nhật |

**Khóa:**
- `PRIMARY KEY`: (`dongHoId`, `thanhVienId`)
- `FK fk_thanhvien_cha`: (`dongHoId`, `chaId`) → `thanhvien`(`dongHoId`, `thanhVienId`) ON DELETE RESTRICT
- `FK fk_thanhvien_me`: (`dongHoId`, `meId`) → `thanhvien`(`dongHoId`, `thanhVienId`) ON DELETE RESTRICT
- `FK thanhvien_ibfk_1`: `dongHoId` → `dongho.dongHoId` ON DELETE CASCADE

---

### 14. `thaotac` — Danh mục thao tác

> ⚠️ Bảng này được tham chiếu bởi `role_chucnang` nhưng định nghĩa cấu trúc không có trong dump (có thể đã tồn tại trước khi dump).  
> Dựa vào dữ liệu tham chiếu, bảng có cấu trúc dự kiến như sau:

| Cột | Kiểu dữ liệu | Null | Ghi chú |
|-----|-------------|------|---------|
| `thaoTacId` | VARCHAR(50) | NOT NULL | **PK** (VD: TT001, TT002...) |
| `thaoTacCode` | VARCHAR(50) | YES | Mã thao tác: VIEW, CREATE, UPDATE, DELETE |
| `tenThaoTac` | VARCHAR(100) | YES | Tên thao tác |
| `active_flag` | TINYINT | YES | Trạng thái |

---

## Sơ đồ quan hệ (ERD tóm tắt)

```
dongho
  ├── nguoidung         (dongHoId → dongho)
  │     └── role        (roleId → role)
  ├── sukien            (dongHoId → dongho)
  │     └── loaisukien  (loaiSuKien → loaisukien)
  ├── thanhvien         (dongHoId → dongho, self-ref: chaId/meId)
  │     └── quanhe      (thanhVien1Id/2Id → thanhvien)
  │           └── loaiquanhe
  ├── taichinhchi       (dongHoId → dongho)
  ├── taichinhthu       (dongHoId → dongho)
  └── tailieu           (dongHoId → dongho)

role
  └── role_chucnang     (roleId → role)
        ├── chucnang    (chucNangId → chucnang)
        └── thaotac     (thaoTacId → thaotac)
```

---

## Ghi chú chung

| Trường | Ý nghĩa |
|--------|---------|
| `active_flag` | `1` = hoạt động, `0` = vô hiệu hóa (xóa mềm) |
| `lu_updated` | Last updated — thời điểm cập nhật cuối |
| `lu_user_id` | Last updated user — người thực hiện cập nhật cuối |
| `nguoiTaoId` | Người tạo bản ghi |
| `ngayTao` | Thời điểm tạo bản ghi |
