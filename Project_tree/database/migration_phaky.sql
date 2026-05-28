-- ================================================================
-- MIGRATION: Tạo bảng PhaKy và các stored procedures
-- Bảng lưu thông tin phả ký của mỗi dòng họ gồm 6 mục chính:
--   1. Lược sử (thời gian, sự kiện)
--   2. Bút tích (họ tên, nội dung)
--   3. Vị tổ đầu tiên (ảnh, tiểu sử)
--   4. Từ đường (địa chỉ, link Google Maps)
--   5. Tổ quán (địa chỉ, link Google Maps)
--   6. Truyền thống (hình ảnh, nội dung)
-- Chạy script này trên MySQL database
-- ================================================================

-- ----------------------------------------------------------------
-- STEP 1: Tạo bảng PhaKy
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PhaKy (
    phaKyId         VARCHAR(50)     NOT NULL PRIMARY KEY,
    dongHoId        VARCHAR(50)     NOT NULL                        COMMENT 'FK -> DongHo',

    -- Lược sử: mảng JSON [{thoiGian, suKien}]
    luocSu          JSON            NULL                            COMMENT 'Lược sử dòng họ: [{thoiGian, suKien}]',

    -- Bút tích: mảng JSON [{hoTen, noiDung}]
    butTich         JSON            NULL                            COMMENT 'Bút tích: [{hoTen, noiDung}]',

    -- Vị tổ đầu tiên
    viToAnh         VARCHAR(1000)   NULL                            COMMENT 'URL ảnh vị tổ đầu tiên',
    viToBiography   TEXT            NULL                            COMMENT 'Tiểu sử vị tổ đầu tiên',
    viToHoTen       VARCHAR(255)    NULL                            COMMENT 'Họ tên vị tổ đầu tiên',

    -- Từ đường
    tuDuongDiaChi   VARCHAR(500)    NULL                            COMMENT 'Địa chỉ từ đường',
    tuDuongLinkMap  VARCHAR(1000)   NULL                            COMMENT 'Link Google Maps từ đường',

    -- Tổ quán
    toQuanDiaChi    VARCHAR(500)    NULL                            COMMENT 'Địa chỉ tổ quán',
    toQuanLinkMap   VARCHAR(1000)   NULL                            COMMENT 'Link Google Maps tổ quán',

    -- Truyền thống: mảng JSON [{hinhAnh, noiDung}]
    truyenThong     JSON            NULL                            COMMENT 'Truyền thống: [{hinhAnh, noiDung}]',

    -- Cột phụ
    nguoiTaoId      VARCHAR(50)     NULL,
    active_flag     INT             NOT NULL DEFAULT 1,
    lu_updated      DATETIME        NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lu_user_id      VARCHAR(50)     NULL,

    INDEX idx_phaky_dongho (dongHoId),
    INDEX idx_phaky_active (active_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phả ký dòng họ';


-- ----------------------------------------------------------------
-- STEP 2: Procedure InsertPhaKy
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS InsertPhaKy;

DELIMITER $$
CREATE PROCEDURE `InsertPhaKy`(
    IN  p_phaKyId           VARCHAR(50),
    IN  p_dongHoId          VARCHAR(50),
    IN  p_luocSu            JSON,
    IN  p_butTich           JSON,
    IN  p_viToAnh           VARCHAR(1000),
    IN  p_viToBiography     TEXT,
    IN  p_viToHoTen         VARCHAR(255),
    IN  p_tuDuongDiaChi     VARCHAR(500),
    IN  p_tuDuongLinkMap    VARCHAR(1000),
    IN  p_toQuanDiaChi      VARCHAR(500),
    IN  p_toQuanLinkMap     VARCHAR(1000),
    IN  p_truyenThong       JSON,
    IN  p_nguoiTaoId        VARCHAR(50),
    OUT p_error_code        INT,
    OUT p_error_message     VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code    = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
    END;

    SET p_error_code    = 0;
    SET p_error_message = '';

    START TRANSACTION;
        INSERT INTO PhaKy (
            phaKyId, dongHoId, luocSu, butTich,
            viToAnh, viToBiography, viToHoTen,
            tuDuongDiaChi, tuDuongLinkMap,
            toQuanDiaChi,  toQuanLinkMap,
            truyenThong, nguoiTaoId,
            active_flag, lu_updated
        ) VALUES (
            p_phaKyId, p_dongHoId, p_luocSu, p_butTich,
            p_viToAnh, p_viToBiography, p_viToHoTen,
            p_tuDuongDiaChi, p_tuDuongLinkMap,
            p_toQuanDiaChi,  p_toQuanLinkMap,
            p_truyenThong, p_nguoiTaoId,
            1, NOW()
        );
    COMMIT;
END$$
DELIMITER ;


-- ----------------------------------------------------------------
-- STEP 3: Procedure UpdatePhaKy
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS UpdatePhaKy;

DELIMITER $$
CREATE PROCEDURE `UpdatePhaKy`(
    IN  p_phaKyId           VARCHAR(50),
    IN  p_dongHoId          VARCHAR(50),
    IN  p_luocSu            JSON,
    IN  p_butTich           JSON,
    IN  p_viToAnh           VARCHAR(1000),
    IN  p_viToBiography     TEXT,
    IN  p_viToHoTen         VARCHAR(255),
    IN  p_tuDuongDiaChi     VARCHAR(500),
    IN  p_tuDuongLinkMap    VARCHAR(1000),
    IN  p_toQuanDiaChi      VARCHAR(500),
    IN  p_toQuanLinkMap     VARCHAR(1000),
    IN  p_truyenThong       JSON,
    IN  p_lu_user_id        VARCHAR(50),
    OUT p_error_code        INT,
    OUT p_error_message     VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code    = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
    END;

    SET p_error_code    = 0;
    SET p_error_message = '';

    START TRANSACTION;
        UPDATE PhaKy
        SET
            luocSu          = p_luocSu,
            butTich         = p_butTich,
            viToAnh         = p_viToAnh,
            viToBiography   = p_viToBiography,
            viToHoTen       = p_viToHoTen,
            tuDuongDiaChi   = p_tuDuongDiaChi,
            tuDuongLinkMap  = p_tuDuongLinkMap,
            toQuanDiaChi    = p_toQuanDiaChi,
            toQuanLinkMap   = p_toQuanLinkMap,
            truyenThong     = p_truyenThong,
            lu_updated      = NOW(),
            lu_user_id      = p_lu_user_id
        WHERE phaKyId = p_phaKyId
          AND dongHoId = p_dongHoId;
    COMMIT;
END$$
DELIMITER ;


-- ----------------------------------------------------------------
-- STEP 4: Procedure DeletePhaKy (soft delete)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS DeletePhaKy;

DELIMITER $$
CREATE PROCEDURE `DeletePhaKy`(
    IN  p_phaKyId       VARCHAR(50),
    IN  p_lu_user_id    VARCHAR(50),
    OUT p_error_code    INT,
    OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code    = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
    END;

    SET p_error_code    = 0;
    SET p_error_message = '';

    START TRANSACTION;
        UPDATE PhaKy
        SET active_flag  = 0,
            lu_updated   = NOW(),
            lu_user_id   = p_lu_user_id
        WHERE phaKyId = p_phaKyId;
    COMMIT;
END$$
DELIMITER ;


-- ----------------------------------------------------------------
-- STEP 5: Procedure GetPhaKyByDongHo
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetPhaKyByDongHo;

DELIMITER $$
CREATE PROCEDURE `GetPhaKyByDongHo`(
    IN  p_dongHoId      VARCHAR(50),
    OUT p_error_code    INT,
    OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code    = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
    END;

    SET p_error_code    = 0;
    SET p_error_message = '';

    SELECT
        pk.phaKyId,
        pk.dongHoId,
        pk.luocSu,
        pk.butTich,
        pk.viToAnh,
        pk.viToBiography,
        pk.viToHoTen,
        pk.tuDuongDiaChi,
        pk.tuDuongLinkMap,
        pk.toQuanDiaChi,
        pk.toQuanLinkMap,
        pk.truyenThong,
        pk.nguoiTaoId,
        pk.active_flag,
        pk.lu_updated,
        pk.lu_user_id,
        dh.tenDongHo
    FROM PhaKy pk
    LEFT JOIN DongHo dh ON pk.dongHoId COLLATE utf8mb4_0900_ai_ci = dh.dongHoId
    WHERE pk.dongHoId = p_dongHoId
      AND pk.active_flag = 1
    LIMIT 1;
END$$
DELIMITER ;


-- ----------------------------------------------------------------
-- STEP 6: Procedure SearchPhaKy (có phân trang cho admin)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS SearchPhaKy;

DELIMITER $$
CREATE PROCEDURE `SearchPhaKy`(
    IN  p_pageIndex         INT,
    IN  p_pageSize          INT,
    IN  p_search_content    VARCHAR(500),
    IN  p_dongHoId          VARCHAR(50),
    OUT p_error_code        INT,
    OUT p_error_message     VARCHAR(500)
)
BEGIN
    DECLARE p_total_row INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code    = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
    END;

    SET p_error_code    = 0;
    SET p_error_message = '';

    DROP TEMPORARY TABLE IF EXISTS PhaKyResults;

    CREATE TEMPORARY TABLE PhaKyResults AS
    SELECT
        (@row_number := @row_number + 1) AS RowNumber,
        pk.phaKyId,
        pk.dongHoId,
        pk.viToHoTen,
        pk.viToAnh,
        pk.tuDuongDiaChi,
        pk.toQuanDiaChi,
        pk.lu_updated,
        dh.tenDongHo
    FROM PhaKy pk
    LEFT JOIN DongHo dh ON pk.dongHoId COLLATE utf8mb4_0900_ai_ci = dh.dongHoId
    CROSS JOIN (SELECT @row_number := 0) r
    WHERE pk.active_flag = 1
      AND (p_dongHoId IS NULL OR p_dongHoId = '' OR pk.dongHoId = p_dongHoId)
      AND (
            p_search_content IS NULL
            OR p_search_content = ''
            OR LOWER(CONCAT(
                COALESCE(dh.tenDongHo,     ''),
                COALESCE(pk.viToHoTen,     ''),
                COALESCE(pk.tuDuongDiaChi, ''),
                COALESCE(pk.toQuanDiaChi,  '')
            )) LIKE CONCAT('%', LOWER(TRIM(p_search_content)), '%')
      )
    ORDER BY pk.lu_updated DESC;

    SELECT COUNT(*) INTO p_total_row FROM PhaKyResults;

    IF p_pageSize = 0 THEN
        SELECT *, p_total_row AS RecordCount FROM PhaKyResults;
    ELSE
        SELECT *, p_total_row AS RecordCount
        FROM PhaKyResults
        WHERE RowNumber BETWEEN ((p_pageIndex - 1) * p_pageSize) + 1
                             AND (p_pageIndex * p_pageSize);
    END IF;

    DROP TEMPORARY TABLE IF EXISTS PhaKyResults;
END$$
DELIMITER ;

-- ================================================================
-- XONG.
-- Kiểm tra bảng: SHOW COLUMNS FROM PhaKy;
-- Kiểm tra procedures: SHOW PROCEDURE STATUS WHERE Db = DATABASE();
-- ================================================================
