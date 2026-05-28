-- ================================================================
-- MIGRATION: Thêm cột iframe embed Google Maps cho Từ Đường & Tổ Quán
-- Chạy sau migration_phaky_add_images.sql
-- ================================================================

USE giaphaso_db;

ALTER TABLE PhaKy
  ADD COLUMN tuDuongIframe VARCHAR(2000) NULL COMMENT 'Embed iframe src Google Maps cho Từ Đường' AFTER tuDuongAnh,
  ADD COLUMN toQuanIframe  VARCHAR(2000) NULL COMMENT 'Embed iframe src Google Maps cho Tổ Quán'  AFTER toQuanAnh;

-- Kiểm tra: SHOW COLUMNS FROM PhaKy;
