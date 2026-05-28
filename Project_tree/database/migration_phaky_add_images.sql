-- ================================================================
-- MIGRATION: Thêm cột ảnh cho Từ Đường và Tổ Quán trong bảng PhaKy
-- Chạy file này sau migration_phaky.sql
-- ================================================================

USE giaphaso_db;

ALTER TABLE PhaKy
  ADD COLUMN tuDuongAnh VARCHAR(1000) NULL COMMENT 'URL ảnh từ đường' AFTER tuDuongLinkMap,
  ADD COLUMN toQuanAnh  VARCHAR(1000) NULL COMMENT 'URL ảnh tổ quán'  AFTER toQuanLinkMap;

-- Kiểm tra: SHOW COLUMNS FROM PhaKy;
