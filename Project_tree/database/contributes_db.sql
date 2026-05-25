-- =====================================================
-- BANK TRANSACTION & TOP-UP SYSTEM - DATABASE SCHEMA
-- Hệ thống chuyển khoản tự động nạp quỹ dòng họ
-- =====================================================

-- 1. Bảng Mã Server - Định danh hệ thống
DROP TABLE IF EXISTS `server_code`;
CREATE TABLE `server_code` (
  `serverId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  `maServer` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'FAMTREE_2024, DONHO_001, etc',
  `tenServer` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `moTa` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `stk` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Số tài khoản nhận tiền',
  `tenNhanhang` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'VietcomBank, Agribank, etc',
  `maNhanhang` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Mã ngân hàng (970, 970, etc)',
  `tenChuTaiKhoan` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên chủ tài khoản',
  `chiNhanhNhanhang` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Chi nhánh ngân hàng',
  `momoPhoneNumber` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Số ĐT Momo (nếu dùng)',
  `momoPartnerCode` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Momo partner code',
  `vnpayMerchantCode` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'VnPay merchant code',
  `webhookUrlMomo` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Webhook URL cho Momo',
  `webhookUrlVnpay` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Webhook URL cho VnPay',
  `webhookSecretMomo` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Secret key Momo webhook',
  `webhookSecretVnpay` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Secret key VnPay webhook',
  `isActive` TINYINT DEFAULT 1 COMMENT '1 = đang sử dụng, 0 = không',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  INDEX `idx_maserver` (`maServer`),
  INDEX `idx_stk` (`stk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Giao Dịch Ngân Hàng - Lưu trữ tất cả giao dịch chuyển khoản
DROP TABLE IF EXISTS `bank_transaction`;
CREATE TABLE `bank_transaction` (
  `bankTransactionId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dongHoId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID dòng họ',
  `nguoiDungId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID user được nạp tiền',
  `soTien` DECIMAL(18,2) NOT NULL COMMENT 'Số tiền chuyển khoản (VNĐ)',
  `phuongThucThanhToan` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'momo, vnpay, bank_transfer',
  `noiDungChuyenKhoan` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'username_servercode (format nội dung)',
  `maGiaoDichNganHang` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'Transaction ID từ bank',
  `trangThai` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'pending, verified, completed, failed',
  `soTaiKhoanChuyen` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Số tài khoản người chuyển',
  `tenTaiKhoanChuyen` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Tên người chuyển',
  `ngayChuyenKhoan` DATETIME NOT NULL COMMENT 'Ngày chuyển khoản',
  `ngayXacNhan` DATETIME COMMENT 'Ngày xác nhận giao dịch',
  `webhookData` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Raw JSON data từ webhook',
  `ghiChu` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú bổ sung',
  `soLanThapTai` INT DEFAULT 0 COMMENT 'Số lần nạp lại (0 = lần đầu)',
  `thanhToanId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Liên kết tới bảng thanh_toan (nếu là nạp gói)',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  PRIMARY KEY (`bankTransactionId`),
  INDEX `idx_dongho_trangthai` (`dongHoId`, `trangThai`),
  INDEX `idx_user_trangthai` (`nguoiDungId`, `trangThai`),
  INDEX `idx_magiaodich` (`maGiaoDichNganHang`),
  INDEX `idx_ngaychuyenkoan` (`ngayChuyenKhoan`),
  INDEX `idx_trangthai` (`trangThai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm foreign keys sau khi tạo bảng
ALTER TABLE `bank_transaction` ADD CONSTRAINT `fk_bank_transaction_dongho` FOREIGN KEY (`dongHoId`) REFERENCES `dongho`(`dongHoId`) ON DELETE CASCADE;
ALTER TABLE `bank_transaction` ADD CONSTRAINT `fk_bank_transaction_nguoidung` FOREIGN KEY (`nguoiDungId`) REFERENCES `nguoidung`(`nguoiDungId`);
ALTER TABLE `bank_transaction` ADD CONSTRAINT `fk_bank_transaction_thanhtoan` FOREIGN KEY (`thanhToanId`) REFERENCES `thanh_toan`(`thanhToanId`);

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
  `webhookLogId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  `phuongThucThanhToan` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `soTien` DECIMAL(18,2),
  `noiDungChuyenKhoan` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `maGiaoDich` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trangThaiXuLy` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'received, processing, completed, failed',
  `errorMessage` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ipAddress` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `userAgent` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `requestData` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Raw request từ webhook',
  `responseData` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Response gửi về',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `luUserId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `luUpdated` DATETIME,
  `activeFlag` TINYINT DEFAULT 1,
  INDEX `idx_magiaodich` (`maGiaoDich`),
  INDEX `idx_phuongthuc` (`phuongThucThanhToan`),
  INDEX `idx_trangthai` (`trangThaiXuLy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Quỹ Dòng Họ - Tổng hợp tiền nạp cho từng dòng họ
DROP TABLE IF EXISTS `quy_dong_ho`;
CREATE TABLE `quy_dong_ho` (
  `quyDongHoId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  `dongHoId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `tongQuySoThap` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ số tiền nạp',
  `tongQuyTaiChieuSinhNhat` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu sinh nhật',
  `tongQuyTaiChieuThanhMuoi` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu thành muoi',
  `tongQuyTaiChieuKhac` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ từ chi tiêu khác',
  `tongQuy` DECIMAL(18,2) DEFAULT 0 COMMENT 'Tổng quỹ (tất cả)',
  `soQuyDonHienCo` INT DEFAULT 0 COMMENT 'Số người đã nạp tiền',
  `trangThaiQuy` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT 'active, inactive, suspended',
  `ghiChu` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  INDEX `idx_dongho` (`dongHoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm foreign key cho quy_dong_ho
ALTER TABLE `quy_dong_ho` ADD CONSTRAINT `fk_quy_dong_ho_dongho` FOREIGN KEY (`dongHoId`) REFERENCES `dongho`(`dongHoId`) ON DELETE CASCADE;

-- 7. Bảng Lịch Sử Quỹ - Chi tiết từng giao dịch quỹ
DROP TABLE IF EXISTS `lich_su_quy`;
CREATE TABLE `lich_su_quy` (
  `lichSuQuyId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
  `quyDongHoId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `loaiGiaoDich` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nap_tien, chi_tieu_sinhnhat, chi_tieu_thanhmoi, chi_tieu_khac, hoan_tien',
  `soTien` DECIMAL(18,2) NOT NULL,
  `nguoiThucHien` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'User thực hiện giao dịch',
  `bankTransactionId` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Liên kết bank transaction (nếu là nạp tiền)',
  `noiDung` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ghiChu` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `solancong` INT COMMENT 'Số lần cộng/trừ',
  `tongSauGiaoDich` DECIMAL(18,2) COMMENT 'Tổng quỹ sau giao dịch',
  `ngayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu_user_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lu_updated` DATETIME,
  `active_flag` TINYINT DEFAULT 1,
  INDEX `idx_quy` (`quyDongHoId`),
  INDEX `idx_loaigtd` (`loaiGiaoDich`),
  INDEX `idx_ngay` (`ngayTao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm foreign keys cho lich_su_quy
ALTER TABLE `lich_su_quy` ADD CONSTRAINT `fk_lich_su_quy_quy_dong_ho` FOREIGN KEY (`quyDongHoId`) REFERENCES `quy_dong_ho`(`quyDongHoId`) ON DELETE CASCADE;
ALTER TABLE `lich_su_quy` ADD CONSTRAINT `fk_lich_su_quy_bank_transaction` FOREIGN KEY (`bankTransactionId`) REFERENCES `bank_transaction`(`bankTransactionId`);

-- 8. Thêm cột phục vụ match user - username
ALTER TABLE `nguoidung` ADD COLUMN `tenTaiKhoan` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE AFTER `tenDayDu`;
ALTER TABLE `nguoidung` ADD INDEX `idx_tentaikoan` (`tenTaiKhoan`);