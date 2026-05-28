-- ================================================================
-- MIGRATION: Sửa lỗi p_moTa quá ngắn + thêm trường anhUrl
-- Chạy script này trên MySQL database
-- ================================================================

-- STEP 1: Thêm cột anhUrl vào bảng sukien
-- ----------------------------------------------------------------
ALTER TABLE sukien
    ADD COLUMN IF NOT EXISTS anhUrl VARCHAR(500) NULL COMMENT 'URL ảnh sự kiện';


-- STEP 2: Recreate UpdateEvent
--   - Sửa p_moTa VARCHAR(20) → TEXT  (nguyên nhân lỗi ER_DATA_TOO_LONG)
--   - Sửa p_tenSuKien VARCHAR(50) → VARCHAR(255)
--   - Thêm tham số p_anhUrl VARCHAR(500)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS UpdateEvent;

DELIMITER $$
CREATE PROCEDURE `UpdateEvent`(
   IN p_suKienId    VARCHAR(50),
   IN p_dongHoId    VARCHAR(50),
   IN p_tenSuKien   VARCHAR(255),
   IN p_ngayDienRa  DATE,
   IN p_gioDienRa   TIME,
   IN p_diaDiem     VARCHAR(255),
   IN p_moTa        TEXT,
   IN p_lapLai      INT,
   IN p_loaiSuKien  INT,
   IN p_uuTien      INT,
   IN p_lu_user_id  VARCHAR(100),
   IN p_anhUrl      VARCHAR(500),
   OUT p_error_code INT,
   OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
         GET DIAGNOSTICS CONDITION 1 p_error_code = RETURNED_SQLSTATE, p_error_message = MESSAGE_TEXT;
         ROLLBACK;
    END;

    SET p_error_code = 0;
    SET p_error_message = '';

    START TRANSACTION;
        UPDATE SuKien
        SET
            dongHoId   = p_dongHoId,
            tenSuKien  = p_tenSuKien,
            ngayDienRa = p_ngayDienRa,
            gioDienRa  = p_gioDienRa,
            diaDiem    = p_diaDiem,
            moTa       = p_moTa,
            lapLai     = p_lapLai,
            lu_updated = NOW(),
            loaiSuKien = p_loaiSuKien,
            uuTien     = p_uuTien,
            lu_user_id = p_lu_user_id,
            anhUrl     = p_anhUrl
        WHERE suKienId = p_suKienId;
    COMMIT;
END$$
DELIMITER ;


-- STEP 3: Recreate InsertEvent
--   - Sửa p_moTa VARCHAR(1000) → TEXT
--   - Sửa p_tenSuKien VARCHAR(50) → VARCHAR(255)
--   - Thêm tham số p_anhUrl VARCHAR(500)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS InsertEvent;

DELIMITER $$
CREATE PROCEDURE `InsertEvent`(
   IN p_suKienId    VARCHAR(50),
   IN p_dongHoId    VARCHAR(50),
   IN p_tenSuKien   VARCHAR(255),
   IN p_ngayDienRa  DATE,
   IN p_gioDienRa   TIME,
   IN p_diaDiem     VARCHAR(255),
   IN p_moTa        TEXT,
   IN p_lapLai      INT,
   IN p_nguoiTaoId  VARCHAR(50),
   IN p_loaiSuKien  INT,
   IN p_uuTien      INT,
   IN p_anhUrl      VARCHAR(500),
   OUT p_error_code INT,
   OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
         GET DIAGNOSTICS CONDITION 1 p_error_code = RETURNED_SQLSTATE, p_error_message = MESSAGE_TEXT;
         ROLLBACK;
    END;

    SET p_error_code = 0;
    SET p_error_message = '';

    START TRANSACTION;
        INSERT INTO SuKien(
            suKienId,   dongHoId,    tenSuKien,   ngayDienRa, gioDienRa,
            diaDiem,    moTa,        lapLai,      active_flag, nguoiTaoId,
            lu_updated, loaiSuKien,  uuTien,      anhUrl
        )
        VALUES (
            p_suKienId, p_dongHoId,  p_tenSuKien, p_ngayDienRa, p_gioDienRa,
            p_diaDiem,  p_moTa,      p_lapLai,    1,            p_nguoiTaoId,
            NOW(),      p_loaiSuKien, p_uuTien,   p_anhUrl
        );
    COMMIT;
END$$
DELIMITER ;


-- STEP 4: Recreate SearchEvent (thêm sk.anhUrl vào SELECT)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS SearchEvent;

DELIMITER $$
CREATE PROCEDURE `SearchEvent`(
    IN p_pageIndex       INT,
    IN p_pageSize        INT,
    IN p_search_content  VARCHAR(500),
    IN p_dongHoId        VARCHAR(50),
    OUT p_error_code     INT,
    OUT p_error_message  VARCHAR(500)
)
BEGIN
    DECLARE p_total_row INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_code = RETURNED_SQLSTATE,
            p_error_message = MESSAGE_TEXT;
    END;

    SET p_error_code = 0;
    SET p_error_message = '';

    -- Có phân trang
    IF p_pageSize <> 0 THEN

        DROP TEMPORARY TABLE IF EXISTS Results;

        CREATE TEMPORARY TABLE Results AS
        SELECT
            (@row_number := @row_number + 1) AS RowNumber,
            sk.suKienId,
            sk.dongHoId,
            sk.tenSuKien,
            sk.ngayDienRa,
            sk.gioDienRa,
            sk.diaDiem,
            sk.moTa,
            sk.lapLai,
            sk.nguoiTaoId,
            up.full_name,
            sk.loaiSuKien,
            sk.lu_user_id,
            lsk.tenLoaiSuKien,
            sk.uuTien,
            sk.anhUrl
        FROM SuKien sk
        LEFT JOIN LoaiSuKien lsk ON sk.loaiSuKien = lsk.loaiSuKien
        LEFT JOIN user_profile up ON sk.nguoiTaoId = up.userId
        LEFT JOIN NguoiDung nd ON sk.nguoiTaoId = nd.nguoiDungId
        CROSS JOIN (SELECT @row_number := 0) r
        WHERE sk.active_flag = 1
          AND (p_dongHoId IS NULL OR p_dongHoId = '' OR sk.dongHoId = p_dongHoId)
          AND (
                p_search_content IS NULL
                OR p_search_content = ''
                OR LOWER(CONCAT(
                    COALESCE(sk.tenSuKien, ''),
                    COALESCE(sk.ngayDienRa, ''),
                    COALESCE(lsk.tenLoaiSuKien, ''),
                    COALESCE(sk.gioDienRa, ''),
                    COALESCE(sk.diaDiem, ''),
                    COALESCE(sk.moTa, '')
                )) LIKE CONCAT('%', LOWER(TRIM(p_search_content)), '%')
          )
        ORDER BY sk.ngayDienRa DESC;

        SELECT COUNT(*) INTO p_total_row FROM Results;

        SELECT *, p_total_row AS RecordCount
        FROM Results
        WHERE RowNumber BETWEEN ((p_pageIndex - 1) * p_pageSize) + 1
                             AND (p_pageIndex * p_pageSize);

        DROP TEMPORARY TABLE Results;

    -- Không phân trang (lấy hết)
    ELSE

        DROP TEMPORARY TABLE IF EXISTS Results;

        CREATE TEMPORARY TABLE Results AS
        SELECT
            (@row_number := @row_number + 1) AS RowNumber,
            sk.suKienId,
            sk.dongHoId,
            sk.tenSuKien,
            sk.ngayDienRa,
            sk.gioDienRa,
            sk.diaDiem,
            sk.moTa,
            sk.lapLai,
            sk.nguoiTaoId,
            nd.hoTen,
            sk.loaiSuKien,
            sk.lu_user_id,
            lsk.tenLoaiSuKien,
            sk.uuTien,
            sk.anhUrl
        FROM SuKien sk
        INNER JOIN LoaiSuKien lsk ON sk.loaiSuKien = lsk.loaiSuKien
        INNER JOIN NguoiDung nd ON sk.nguoiTaoId = nd.nguoiDungId
        CROSS JOIN (SELECT @row_number := 0) r
        WHERE sk.active_flag = 1
          AND (p_dongHoId IS NULL OR p_dongHoId = '' OR sk.dongHoId = p_dongHoId)
          AND (
                p_search_content IS NULL
                OR p_search_content = ''
                OR LOWER(CONCAT(
                    COALESCE(sk.tenSuKien, ''),
                    COALESCE(sk.ngayDienRa, ''),
                    COALESCE(lsk.tenLoaiSuKien, ''),
                    COALESCE(sk.gioDienRa, ''),
                    COALESCE(sk.diaDiem, ''),
                    COALESCE(sk.moTa, '')
                )) LIKE CONCAT('%', LOWER(TRIM(p_search_content)), '%')
          )
        ORDER BY sk.ngayDienRa DESC;

        SELECT COUNT(*) INTO p_total_row FROM Results;

        SELECT *, p_total_row AS RecordCount FROM Results;

        DROP TEMPORARY TABLE Results;

    END IF;

END$$
DELIMITER ;

-- ================================================================
-- XONG. Kiểm tra lại:
--   SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
--   FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_NAME = 'sukien' AND COLUMN_NAME = 'anhUrl';
-- ================================================================
