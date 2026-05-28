-- ================================================================
-- MIGRATION: Thêm menu "Quản lý Phả Ký" vào sidebar admin
-- Chạy file này trên MySQL để phả ký xuất hiện trên sidebar
-- ================================================================

-- STEP 1: Thêm chức năng vào bảng chucnang
INSERT IGNORE INTO `chucnang`
    (`chucNangId`, `chucNangCode`, `tenChucNang`, `moTa`, `parentId`, `icon`, `duongDan`, `thuTu`, `active_flag`)
VALUES
    ('CN011', 'PHAKY', 'Quản lý Phả Ký', 'Quản lý phả ký dòng họ', NULL, '/icon/document.png', '/manage-phaky', 6, 1);


-- STEP 2: Cấp quyền VIEW + CREATE + EDIT + DELETE cho role thủ đồ
INSERT IGNORE INTO `role_chucnang` (`roleId`, `chucNangId`, `thaoTacId`, `dongHoId`, `active_flag`, `lu_updated`)
VALUES
    ('0437a931-cf5e-11f0-8020-a8934a9bae74', 'CN011', 'TT001', NULL, 1, NOW()),
    ('0437a931-cf5e-11f0-8020-a8934a9bae74', 'CN011', 'TT002', NULL, 1, NOW()),
    ('0437a931-cf5e-11f0-8020-a8934a9bae74', 'CN011', 'TT003', NULL, 1, NOW()),
    ('0437a931-cf5e-11f0-8020-a8934a9bae74', 'CN011', 'TT004', NULL, 1, NOW());


-- ================================================================
-- KIỂM TRA SAU KHI CHẠY:
--   SELECT * FROM chucnang WHERE chucNangCode = 'PHAKY';
--   SELECT * FROM role_chucnang WHERE chucNangId = 'CN011';
-- Sau đó đăng xuất và đăng nhập lại để sidebar cập nhật.
-- ================================================================
