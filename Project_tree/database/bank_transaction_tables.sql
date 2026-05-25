-- =====================================================
-- BANK TRANSACTION & TOP-UP SYSTEM - DATABASE SCHEMA
-- Hệ thống chuyển khoản tự động nạp quỹ dòng họ
-- =====================================================

-- 1. Bảng Mã Server - Định danh hệ thống
DROP TABLE IF EXISTS `server_code`;
CREATE TABLE `server_code` (
  `serverId` VARCHAR(50) PRIMARY KEY,
  `maServer` VARCHAR(50) NOT NULL UNIQUE COMMENT 'FAMTREE_2024, DONHO_001, etc',
  `tenServer` VARCHAR(100) NOT NULL,
  `moTa` TEXT,
  `stk` VARCHAR(50) NOT NULL COMMENT 'Số tài khoản nhận tiền',
  `tenNhanhang` VARCHAR(100) COMMENT 'VietcomBank, Agribank, etc',
  `maNhanhang` VARCHAR(10) COMMENT 'Mã ngân hàng (970, 970, etc)',
  `tenChuTaiKhoan` VARCHAR(100) NOT NULL COMMENT 'Tên chủ tài khoản',
  `chiNhanhNhanhang` VARCHAR(150) COMMENT 'Chi nhánh ngân hàng',
  `momoPhoneNumber` VARCHAR(20) COMMENT 'Số ĐT Momo (nếu dùng)',
  `momoPartnerCode` VARCHAR(50) COMMENT 'Momo partner code',
  `vnpayMerchantCode` VARCHAR(50) COMMENT 'VnPay merchant code',
  `webhookUrlMomo` VARCHAR(255) COMMENT 'Webhook URL cho Momo',
  `webhookUrlVnpay` VARCHAR(255) COMMENT 'Webhook URL cho VnPay',
  `webhookSecretMomo` VARCHAR(255) COMMENT 'Secret key Momo webhook',
  `webhookSecretVnpay` VARCHAR(255) COMMENT 'Secret key VnPay webhook',
  `isActive` TINYINT DEFAULT 1 COMMENT '1 = đang sử dụng, 0 = không',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50),
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  INDEX `idx_maserver` (`maServer`),
  INDEX `idx_stk` (`stk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Giao Dịch Ngân Hàng - Lưu trữ tất cả giao dịch chuyển khoản
DROP TABLE IF EXISTS `bank_transaction`;
CREATE TABLE `bank_transaction` (
  `bankTransactionId` VARCHAR(50) PRIMARY KEY,
  `dongHoId` VARCHAR(50) NOT NULL,
  `nguoiDungId` VARCHAR(50) NOT NULL,
  `soTien` DECIMAL(18,2) NOT NULL,
  `phuongThucThanhToan` VARCHAR(50) NOT NULL,
  `noiDungChuyenKhoan` VARCHAR(255) NOT NULL,
  `maGiaoDichNganHang` VARCHAR(100) NOT NULL UNIQUE,
  `trangThai` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `soTaiKhoanChuyen` VARCHAR(50),
  `tenTaiKhoanChuyen` VARCHAR(100),
  `ngayChuyenKhoan` DATETIME NOT NULL,
  `ngayXacNhan` DATETIME,
  `webhookData` LONGTEXT,
  `ghiChu` TEXT,
  `soLanThapTai` INT DEFAULT 0,
  `thanhToanId` VARCHAR(50),
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50),
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,

  INDEX `idx_dongho_trangthai` (`dongHoId`, `trangThai`),
  INDEX `idx_user_trangthai` (`nguoiDungId`, `trangThai`),
  INDEX `idx_magiaodich` (`maGiaoDichNganHang`),
  INDEX `idx_ngaychuyenkoan` (`ngayChuyenKhoan`),
  INDEX `idx_trangthai` (`trangThai`),

  CONSTRAINT `fk_bt_dongho`
    FOREIGN KEY (`dongHoId`) REFERENCES `dongho`(`dongHoId`) ON DELETE CASCADE,

  CONSTRAINT `fk_bt_user`
    FOREIGN KEY (`nguoiDungId`) REFERENCES `nguoidung`(`nguoiDungId`),

  CONSTRAINT `fk_bt_thanhtoan`
    FOREIGN KEY (`thanhToanId`) REFERENCES `thanh_toan`(`thanhToanId`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Cập nhật bảng tại_chính_thu để thêm trường liên kết bank transaction
ALTER TABLE `tai_chinh_thu` ADD COLUMN `bankTransactionId` VARCHAR(50) AFTER `nguoiDungId`;
ALTER TABLE `tai_chinh_thu` ADD FOREIGN KEY (`bankTransactionId`) REFERENCES `bank_transaction`(`bankTransactionId`);
ALTER TABLE `tai_chinh_thu` ADD INDEX `idx_banktrans` (`bankTransactionId`);

-- 4. Cập nhật bảng dang_ky_goi để thêm trường liên kết bank transaction
ALTER TABLE `dang_ky_goi` ADD COLUMN `bankTransactionId` VARCHAR(50) AFTER `tuDongGiaHan`;
ALTER TABLE `dang_ky_goi` ADD FOREIGN KEY (`bankTransactionId`) REFERENCES `bank_transaction`(`bankTransactionId`);
ALTER TABLE `dang_ky_goi` ADD INDEX `idx_banktrans_dangsub` (`bankTransactionId`);

-- 5. Bảng Log Webhook - Lưu trữ lịch sử webhook calls
DROP TABLE IF EXISTS `webhook_log`;
CREATE TABLE `webhook_log` (
  `webhookLogId` VARCHAR(50) PRIMARY KEY,
  `phuongThucThanhToan` VARCHAR(50) NOT NULL,
  `soTien` DECIMAL(18,2),
  `noiDungChuyenKhoan` VARCHAR(255),
  `maGiaoDich` VARCHAR(100),
  `trangThaiXuLy` VARCHAR(50) NOT NULL COMMENT 'received, processing, completed, failed',
  `errorMessage` TEXT,
  `ipAddress` VARCHAR(50),
  `userAgent` VARCHAR(255),
  `requestData` LONGTEXT COMMENT 'Raw request từ webhook',
  `responseData` LONGTEXT COMMENT 'Response gửi về',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `luUserId` VARCHAR(50),
  `luUpdated` DATETIME,
  `activeFlag` TINYINT DEFAULT 1,
  INDEX `idx_magiaodich` (`maGiaoDich`),
  INDEX `idx_phuongthuc` (`phuongThucThanhToan`),
  INDEX `idx_trangthai` (`trangThaiXuLy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Quỹ Dòng Họ - Tổng hợp tiền nạp cho từng dòng họ
DROP TABLE IF EXISTS `quy_dong_ho`;
CREATE TABLE `quy_dong_ho` (
  `quyDongHoId` VARCHAR(50) PRIMARY KEY,
  `dongHoId` VARCHAR(50) NOT NULL UNIQUE,
  `tongQuySoThap` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ số tiền nạp',
  `tongQuyTaiChieuSinhNhat` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu sinh nhật',
  `tongQuyTaiChieuThanhMuoi` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu thành mười',
  `tongQuyTaiChieuKhac` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu khác',
  `tongQuy` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ (tất cả)',
  `soQuyDonHienCo` INT DEFAULT 0 COMMENT 'Số người đã nạp tiền',
  `trangThaiQuy` VARCHAR(50) DEFAULT 'active' COMMENT 'active, inactive, suspended',
  `ghiChu` TEXT,
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50),
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  FOREIGN KEY (`dongHoId`) REFERENCES `dongho`(`dongHoId`) ON DELETE CASCADE,
  INDEX `idx_dongho` (`dongHoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Lịch sử Quỹ - Chi tiết từng giao dịch quỹ
DROP TABLE IF EXISTS `lich_su_quy`;
CREATE TABLE `lich_su_quy` (
  `lichSuQuyId` VARCHAR(50) PRIMARY KEY,
  `quyDongHoId` VARCHAR(50) NOT NULL,
  `loaiGiaoDich` VARCHAR(50) NOT NULL COMMENT 'nap_tien, chi_tieu_sinhhnhat, chi_tieu_thanhmoi, chi_tieu_khac, hoan_tien',
  `soTien` DECIMAL(18,2) NOT NULL,
  `nguoiThucHien` VARCHAR(50) COMMENT 'User thực hiện giao dịch',
  `bankTransactionId` VARCHAR(50) COMMENT 'Liên kết bank transaction (nếu là nạp tiền)',
  `noiDung` VARCHAR(255),
  `ghiChu` TEXT,
  `solancong` INT COMMENT 'Số lần cộng/trừ',
  `tongSauGiaoDich` DECIMAL(18,2) COMMENT 'Tổng quỹ sau giao dịch',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50),
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  FOREIGN KEY (`quyDongHoId`) REFERENCES `quy_dong_ho`(`quyDongHoId`) ON DELETE CASCADE,
  FOREIGN KEY (`bankTransactionId`) REFERENCES `bank_transaction`(`bankTransactionId`),
  INDEX `idx_quy` (`quyDongHoId`),
  INDEX `idx_loaigtd` (`loaiGiaoDich`),
  INDEX `idx_ngay` (`ngayTao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Thêm cột phục vụ match user - username
ALTER TABLE `nguoidung` ADD COLUMN `tenTaiKhoan` VARCHAR(100) UNIQUE AFTER `tenDayDu`;
ALTER TABLE `nguoidung` ADD INDEX `idx_tentaikoan` (`tenTaiKhoan`);
