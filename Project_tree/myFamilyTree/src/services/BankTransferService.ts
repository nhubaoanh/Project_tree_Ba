import { injectable } from "tsyringe";
import { BankTransactionRepository } from "../repositories/BankTransactionRepository";
import { BankTransaction, TransactionContent, MomoWebhookPayload, VnpayWebhookPayload } from "../models/BankTransaction";
import { Database } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

@injectable()
export class BankTransferService {
  constructor(
    private bankTransactionRepository: BankTransactionRepository,
    private db: Database
  ) {}

  parseTransactionContent(content: string): TransactionContent {
    try {
      const cleanContent = content.trim().toUpperCase();
      const pattern = /^([A-Z0-9_]+)_([A-Z0-9_]+)$/;
      const match = cleanContent.match(pattern);
      if (!match) {
        return { username: "", serverCode: "", isValid: false, errorMessage: "Format không đúng. Vui lòng nhập: USERNAME_SERVERCODE" };
      }
      return { username: match[1], serverCode: match[2], isValid: true };
    } catch (error) {
      return { username: "", serverCode: "", isValid: false, errorMessage: "Lỗi khi parse nội dung chuyển khoản" };
    }
  }

  async findUserByUsername(username: string): Promise<any> {
    const query = `SELECT nguoiDungId, tenDayDu, tenTaiKhoan, dongHoId FROM nguoidung WHERE (tenTaiKhoan = ? OR tenDayDu = ?) AND active_flag = 1 LIMIT 1`;
    const [rows] = await this.db.query(query, [username, username]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async findServerCode(maServer: string): Promise<any> {
    const query = `SELECT * FROM server_code WHERE maServer = ? AND isActive = 1 AND active_flag = 1 LIMIT 1`;
    const [rows] = await this.db.query(query, [maServer]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async processMomoWebhook(payload: MomoWebhookPayload): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const isValidSignature = this.verifyMomoSignature(payload);
      if (!isValidSignature) return { success: false, message: "Chữ ký không hợp lệ" };
      if (payload.resultCode !== 0) return { success: false, message: `Giao dịch thất bại: ${payload.resultMessage}` };
      const parsedContent = this.parseTransactionContent(payload.orderInfo);
      if (!parsedContent.isValid) return { success: false, message: parsedContent.errorMessage || "Format chuyển khoản không hợp lệ" };
      const user = await this.findUserByUsername(parsedContent.username);
      if (!user) return { success: false, message: "Không tìm thấy user tương ứng" };
      const serverCode = await this.findServerCode(parsedContent.serverCode);
      if (!serverCode) return { success: false, message: "Server code không tồn tại" };
      const existingTrans = await this.bankTransactionRepository.getBankTransactionByMaGiaoDich(payload.transId);
      if (existingTrans) return { success: false, message: "Giao dịch này đã được xử lý" };

      const bankTransaction = await this.bankTransactionRepository.createBankTransaction({
        dongHoId: user.dongHoId,
        nguoiDungId: user.nguoiDungId,
        soTien: payload.amount,
        phuongThucThanhToan: "momo",
        noiDungChuyenKhoan: payload.orderInfo,
        maGiaoDichNganHang: payload.transId,
        trangThai: "verified",
        tenTaiKhoanChuyen: payload.momoUser,
        ngayChuyenKhoan: new Date(),
        webhookData: JSON.stringify(payload),
        luUserId: "MOMO_WEBHOOK"
      });

      await this.updateFamilyFund(user.dongHoId, payload.amount, "nap_tien", bankTransaction.bankTransactionId);
      await this.createTaiChinhThuRecord(user.dongHoId, user.nguoiDungId, payload.amount, "momo", `Nạp quỹ qua Momo - ${payload.orderInfo}`, bankTransaction.bankTransactionId);

      return { success: true, message: "Nạp quỹ thành công", transactionId: bankTransaction.bankTransactionId };
    } catch (error: any) {
      console.error("Error processing Momo webhook:", error);
      return { success: false, message: `Lỗi xử lý: ${error.message}` };
    }
  }

  async processVnpayWebhook(payload: VnpayWebhookPayload): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const isValidSignature = this.verifyVnpaySignature(payload);
      if (!isValidSignature) return { success: false, message: "Chữ ký không hợp lệ" };
      if (payload.vnp_ResponseCode !== "00" || payload.vnp_TransactionStatus !== "00") return { success: false, message: `Giao dịch thất bại: ${payload.vnp_ResponseCode}` };
      const parsedContent = this.parseTransactionContent(payload.vnp_OrderInfo);
      if (!parsedContent.isValid) return { success: false, message: parsedContent.errorMessage || "Format chuyển khoản không hợp lệ" };
      const user = await this.findUserByUsername(parsedContent.username);
      if (!user) return { success: false, message: "Không tìm thấy user tương ứng" };
      const serverCode = await this.findServerCode(parsedContent.serverCode);
      if (!serverCode) return { success: false, message: "Server code không tồn tại" };
      const existingTrans = await this.bankTransactionRepository.getBankTransactionByMaGiaoDich(payload.vnp_TransactionNo);
      if (existingTrans) return { success: false, message: "Giao dịch này đã được xử lý" };
      const soTien = parseInt(payload.vnp_Amount) / 100;
      const bankTransaction = await this.bankTransactionRepository.createBankTransaction({
        dongHoId: user.dongHoId,
        nguoiDungId: user.nguoiDungId,
        soTien: soTien,
        phuongThucThanhToan: "vnpay",
        noiDungChuyenKhoan: payload.vnp_OrderInfo,
        maGiaoDichNganHang: payload.vnp_TransactionNo,
        trangThai: "verified",
        ngayChuyenKhoan: new Date(),
        webhookData: JSON.stringify(payload),
        luUserId: "VNPAY_WEBHOOK"
      });

      await this.updateFamilyFund(user.dongHoId, soTien, "nap_tien", bankTransaction.bankTransactionId);
      await this.createTaiChinhThuRecord(user.dongHoId, user.nguoiDungId, soTien, "vnpay", `Nạp quỹ qua VnPay - ${payload.vnp_OrderInfo}`, bankTransaction.bankTransactionId);

      return { success: true, message: "Nạp quỹ thành công", transactionId: bankTransaction.bankTransactionId };
    } catch (error: any) {
      console.error("Error processing VnPay webhook:", error);
      return { success: false, message: `Lỗi xử lý: ${error.message}` };
    }
  }

  private async updateFamilyFund(dongHoId: string, soTien: number, loaiGiaoDich: string, bankTransactionId: string): Promise<void> {
    let quyDongHoId = uuidv4();
    const checkQuery = `SELECT quyDongHoId, tongQuy FROM quy_dong_ho WHERE dongHoId = ?`;
    const [quyRows] = await this.db.query(checkQuery, [dongHoId]);
    let tongQuyCu = 0;
    if (quyRows && quyRows.length > 0) {
      quyDongHoId = quyRows[0].quyDongHoId;
      tongQuyCu = quyRows[0].tongQuy || 0;
    } else {
      const insertQueyQuery = `INSERT INTO quy_dong_ho (quyDongHoId, dongHoId, tongQuy, lu_user_id, ngayTao, active_flag) VALUES (?, ?, ?, 'SYSTEM', ?, 1)`;
      await this.db.query(insertQueyQuery, [quyDongHoId, dongHoId, soTien, new Date()]);
    }

    let tongQuyMoi = tongQuyCu + soTien;
    const updateQuery = `UPDATE quy_dong_ho SET tongQuy = ?, tongQuySoThap = tongQuySoThap + ?, lu_updated = ? WHERE quyDongHoId = ?`;
    await this.db.query(updateQuery, [tongQuyMoi, soTien, new Date(), quyDongHoId]);

    const lichSuQuyId = uuidv4();
    const insertLichSuQuery = `INSERT INTO lich_su_quy (lichSuQuyId, quyDongHoId, loaiGiaoDich, soTien, bankTransactionId, noiDung, tongSauGiaoDich, lu_user_id, ngayTao, active_flag) VALUES (?, ?, ?, ?, ?, ?, ?, 'SYSTEM', ?, 1)`;
    await this.db.query(insertLichSuQuery, [lichSuQuyId, quyDongHoId, loaiGiaoDich, soTien, bankTransactionId, `Nạp quỹ tự động từ bank transfer`, tongQuyMoi, new Date()]);
  }

  private async createTaiChinhThuRecord(dongHoId: string, nguoiDungId: string, soTien: number, phuongThucThanhToan: string, noiDung: string, bankTransactionId: string): Promise<void> {
    const taiChinhThuId = uuidv4();
    const query = `INSERT INTO tai_chinh_thu (taiChinhThuId, dongHoId, nguoiDungId, bankTransactionId, soTien, phuongThucThanhToan, noiDung, danhMucId, ngayThang, ngayTao, lu_user_id, active_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM', 1)`;
    await this.db.query(query, [taiChinhThuId, dongHoId, nguoiDungId, bankTransactionId, soTien, phuongThucThanhToan, noiDung, 1, new Date(), new Date()]);
  }

  private verifyMomoSignature(payload: MomoWebhookPayload): boolean {
    try {
      return true;
    } catch (error) {
      return false;
    }
  }

  private verifyVnpaySignature(payload: VnpayWebhookPayload): boolean {
    try {
      return true;
    } catch (error) {
      return false;
    }
  }

  async logWebhookRequest(phuongThucThanhToan: string, requestData: any, responseData: any, trangThaiXuLy: string, errorMessage?: string): Promise<void> {
    const webhookLogId = uuidv4();
    const query = `INSERT INTO webhook_log (webhookLogId, phuongThucThanhToan, maGiaoDich, trangThaiXuLy, errorMessage, requestData, responseData, ngayTao, luUserId, activeFlag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM', 1)`;
    const maGiaoDich = requestData.transId || requestData.vnp_TransactionNo || null;
    await this.db.query(query, [webhookLogId, phuongThucThanhToan, maGiaoDich, trangThaiXuLy, errorMessage || null, JSON.stringify(requestData), JSON.stringify(responseData), new Date()]);
  }
}
