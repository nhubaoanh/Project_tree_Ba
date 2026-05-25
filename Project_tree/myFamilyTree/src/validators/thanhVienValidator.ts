/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         THANH VIEN VALIDATORS                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Validators cho các route liên quan đến thành viên gia phả                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { ValidationChain, body } from "express-validator";
import {
  stringLength,
  optionalStringLength,
  optionalEnum,
  optionalDate,
  optionalId,
  idParam,
  paginationRules,
} from "./commonRules";

// ============================================================================
// CREATE THANH VIEN VALIDATOR
// ============================================================================
/**
 * Validate dữ liệu tạo thành viên mới
 *
 * Fields:
 * - hoTen: Bắt buộc, 2-100 ký tự
 * - gioiTinh: Tùy chọn (0, 1, 2 hoặc "Nam", "Nữ", "Khác")
 * - ngaySinh: Tùy chọn, format YYYY-MM-DD
 * - ngayMat: Tùy chọn, format YYYY-MM-DD
 * - dongHoId: Tùy chọn, số nguyên dương
 * - chaId: Tùy chọn, số nguyên dương
 * - meId: Tùy chọn, số nguyên dương
 */
export const createThanhVienRules: ValidationChain[] = [
  stringLength("hoTen", "Họ tên", 2, 100),
  // gioiTinh bắt buộc
  body("gioiTinh")
    .notEmpty()
    .withMessage("Giới tính không được để trống")
    .custom((value) => {
      const validValues = [0, 1, 2, "0", "1", "2", "Nam", "Nữ", "Khác"];
      if (!validValues.includes(value)) {
        throw new Error("Giới tính không hợp lệ");
      }
      return true;
    }),
  // dongHoId là UUID string, không phải số
  optionalStringLength("dongHoId", "Dòng họ ID", 50),
  // Tất cả các trường khác đều optional
  optionalDate("ngaySinh", "Ngày sinh"),
  optionalDate("ngayMat", "Ngày mất"),
  optionalStringLength("noiSinh", "Nơi sinh", 255),
  optionalStringLength("noiMat", "Nơi mất", 255),
  optionalStringLength("ngheNghiep", "Nghề nghiệp", 255),
  optionalStringLength("trinhDoHocVan", "Trình độ học vấn", 255),
  optionalStringLength("diaChiHienTai", "Địa chỉ hiện tại", 255),
  optionalStringLength("tieuSu", "Tiểu sử", 5000),
  optionalStringLength("anhChanDung", "Ảnh chân dung", 255),
  optionalId("chaId", "Cha ID"),
  optionalId("meId", "Mẹ ID"),
  optionalId("voId", "Vợ ID"),
  optionalId("chongId", "Chồng ID"),
  body("doiThuoc")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Đời thứ phải là số nguyên dương"),
];

// ============================================================================
// UPDATE THANH VIEN VALIDATOR
// ============================================================================
/**
 * Validate dữ liệu cập nhật thành viên
 *
 * Fields:
 * - id (param): Bắt buộc, số nguyên dương
 * - hoTen: Tùy chọn, 2-100 ký tự
 * - gioiTinh: Tùy chọn (0, 1, 2 hoặc "Nam", "Nữ", "Khác")
 * - ngaySinh: Tùy chọn
 */
export const updateThanhVienRules: ValidationChain[] = [
  idParam("id"),
  optionalStringLength("hoTen", "Họ tên", 100),
  // gioiTinh có thể là số (0, 1, 2) hoặc string
  body("gioiTinh")
    .optional({ values: "falsy" })
    .custom((value) => {
      // Chấp nhận số 0, 1, 2 hoặc string "Nam", "Nữ", "Khác"
      const validValues = [0, 1, 2, "0", "1", "2", "Nam", "Nữ", "Khác"];
      if (!validValues.includes(value)) {
        throw new Error("Giới tính không hợp lệ");
      }
      return true;
    }),
  optionalDate("ngaySinh", "Ngày sinh"),
  optionalDate("ngayMat", "Ngày mất"),
];

// ============================================================================
// ID PARAM VALIDATOR
// ============================================================================
/**
 * Validate ID trong URL params
 */
export const idParamRules: ValidationChain[] = [idParam("id")];

// ============================================================================
// SEARCH THANH VIEN VALIDATOR
// ============================================================================
/**
 * Validate dữ liệu tìm kiếm thành viên
 */
export const searchThanhVienRules: ValidationChain[] = [
  optionalStringLength("keyword", "Từ khóa", 100),
  optionalStringLength("search_content", "Nội dung tìm kiếm", 100),
  optionalStringLength("dongHoId", "Dòng họ ID", 50),
  ...paginationRules,
];

export const saveCoordinatesRules: ValidationChain[] = [
  body("dongHoId")
    .notEmpty()
    .withMessage("Dòng họ ID không được để trống"),
  body("coordinates")
    .isArray({ min: 1 })
    .withMessage("coordinates phải là một mảng chứa ít nhất một phần tử"),
  body("coordinates.*.thanhVienId")
    .isInt({ min: 1 })
    .withMessage("thanhVienId phải là số nguyên dương"),
  body("coordinates.*.toaDoX")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("toaDoX phải là một số"),
  body("coordinates.*.toaDoY")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("toaDoY phải là một số"),
];

export const saveEdgeCoordinatesRules: ValidationChain[] = [
  body("dongHoId")
    .notEmpty()
    .withMessage("Dòng họ ID không được để trống"),
  body("edgeCoordinates")
    .isArray({ min: 1 })
    .withMessage("edgeCoordinates phải là một mảng chứa ít nhất một phần tử"),
  body("edgeCoordinates.*.edgeId")
    .notEmpty()
    .withMessage("edgeId không được để trống"),
  body("edgeCoordinates.*.bendX")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("bendX phải là một số"),
  body("edgeCoordinates.*.bendY")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("bendY phải là một số"),
  body("edgeCoordinates.*.dx")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("dx phải là một số"),
  body("edgeCoordinates.*.dy")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("dy phải là một số"),
  body("edgeCoordinates.*.cp1x")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("cp1x phải là một số"),
  body("edgeCoordinates.*.cp1y")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("cp1y phải là một số"),
  body("edgeCoordinates.*.cp2x")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("cp2x phải là một số"),
  body("edgeCoordinates.*.cp2y")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("cp2y phải là một số"),
];
