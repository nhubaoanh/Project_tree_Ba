import { Request, Response } from "express";
import { injectable } from "tsyringe";
import axios from "axios";
import * as crypto from "crypto";
import { config } from "../config/config";
import { BankTransferService } from "../services/BankTransferService";
import { BankTransactionRepository } from "../repositories/BankTransactionRepository";
import { VNPayService } from "../services/VNPayService";

@injectable()
export class BankTransferController {
  config: any;
  constructor(
    private bankTransferService: BankTransferService,
    private bankTransactionRepository: BankTransactionRepository,
    private vnpayService: VNPayService
  ) { this.config = config; }

  async handleMomoWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const result = await this.bankTransferService.processMomoWebhook(payload);
      await this.bankTransferService.logWebhookRequest("momo", payload, result, result.success ? "completed" : "failed", result.success ? undefined : result.message);
      if (result.success) {
        res.status(200).json({ resultCode: 0, message: "Success", transactionId: result.transactionId });
      } else {
        res.status(200).json({ resultCode: 1, message: result.message });
      }
    } catch (error: any) {
      console.error("Momo webhook error:", error);
      res.status(500).json({ resultCode: 99, message: "Internal error" });
    }
  }

  async handleVnpayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const result = await this.bankTransferService.processVnpayWebhook(payload);
      await this.bankTransferService.logWebhookRequest("vnpay", payload, result, result.success ? "completed" : "failed", result.success ? undefined : result.message);
      res.status(200).json({ RspCode: result.success ? "00" : "01", Message: result.message, TransactionId: result.transactionId });
    } catch (error: any) {
      console.error("VnPay webhook error:", error);
      res.status(500).json({ RspCode: "99", Message: "Internal error" });
    }
  }

  async getBankTransactionsByDongHo(req: Request, res: Response): Promise<void> {
    try {
      const { dongHoId } = req.params;
      const { pageIndex = 1, pageSize = 10, trangThai } = req.query;
      const result = await this.bankTransactionRepository.getBankTransactionsByDongHo(dongHoId, parseInt(pageIndex as string), parseInt(pageSize as string), trangThai as string);
      res.status(200).json({ success: true, data: result.data, pagination: { pageIndex, pageSize, total: result.total, totalPages: Math.ceil(result.total / parseInt(pageSize as string)) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBankTransactionsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { nguoiDungId } = req.params;
      const { pageIndex = 1, pageSize = 10 } = req.query;
      const result = await this.bankTransactionRepository.getBankTransactionsByUser(nguoiDungId, parseInt(pageIndex as string), parseInt(pageSize as string));
      res.status(200).json({ success: true, data: result.data, pagination: { pageIndex, pageSize, total: result.total, totalPages: Math.ceil(result.total / parseInt(pageSize as string)) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBankTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await this.bankTransactionRepository.getBankTransactionById(id);
      if (!transaction) { res.status(404).json({ success: false, message: "Giao dịch không tồn tại" }); return; }
      res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { bankTransactionId } = req.body;
      const transaction = await this.bankTransactionRepository.getBankTransactionById(bankTransactionId);
      if (!transaction) { res.status(404).json({ success: false, message: "Giao dịch không tồn tại" }); return; }
      if (transaction.trangThai === "completed") { res.status(400).json({ success: false, message: "Giao dịch đã được xác nhận trước đó" }); return; }
      await this.bankTransactionRepository.updateBankTransactionStatus(bankTransactionId, "completed", new Date());
      res.status(200).json({ success: true, message: "Xác nhận giao dịch thành công" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { dongHoId } = req.query;
      const transactions = await this.bankTransactionRepository.getPendingTransactions(dongHoId as string);
      res.status(200).json({ success: true, data: transactions, total: transactions.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchBankTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, pageIndex = 1, pageSize = 10 } = req.query;
      if (!keyword) { res.status(400).json({ success: false, message: "Vui lòng nhập từ khóa tìm kiếm" }); return; }
      const result = await this.bankTransactionRepository.searchBankTransactions(keyword as string, parseInt(pageIndex as string), parseInt(pageSize as string));
      res.status(200).json({ success: true, data: result.data, pagination: { pageIndex, pageSize, total: result.total, totalPages: Math.ceil(result.total / parseInt(pageSize as string)) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createManualTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { dongHoId, nguoiDungId, soTien, phuongThucThanhToan, noiDungChuyenKhoan, maGiaoDichNganHang, tenTaiKhoanChuyen } = req.body;
      if (!dongHoId || !nguoiDungId || !soTien || !phuongThucThanhToan) { res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" }); return; }
      const transaction = await this.bankTransactionRepository.createBankTransaction({ dongHoId, nguoiDungId, soTien, phuongThucThanhToan, noiDungChuyenKhoan: noiDungChuyenKhoan || "", maGiaoDichNganHang: maGiaoDichNganHang || `MANUAL_${Date.now()}`, trangThai: "pending", tenTaiKhoanChuyen: tenTaiKhoanChuyen || "", luUserId: req.body.luUserId || "ADMIN" });
      res.status(201).json({ success: true, message: "Tạo giao dịch thành công", data: transaction });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async initiateFundClosure(req: Request, res: Response): Promise<void> {
    try {
      const { amount, paymentMethod, dongHoId, nguoiDungId } = req.body;
      if (!amount || !paymentMethod || !dongHoId || !nguoiDungId) { res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" }); return; }
      if (amount <= 0 || !Number.isInteger(amount)) { res.status(400).json({ success: false, message: "Số tiền phải là số nguyên dương" }); return; }
      const validMethods = ["bank-transfer", "momo", "vnpay"];
      if (!validMethods.includes(paymentMethod)) { res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" }); return; }

      const reference = `QUITUI_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const transaction = await this.bankTransactionRepository.createBankTransaction({ dongHoId, nguoiDungId, soTien: amount, phuongThucThanhToan: paymentMethod, noiDungChuyenKhoan: "Đóng quỹ dòng họ", maGiaoDichNganHang: reference, trangThai: "pending", tenTaiKhoanChuyen: "", luUserId: nguoiDungId });

      let redirectUrl = "";
      switch (paymentMethod) {
        case "momo":
          redirectUrl = await this.generateMomoPaymentUrl(amount, reference, dongHoId);
          break;
        case "vnpay":
          redirectUrl = this.generateVnpayPaymentUrl(amount, reference, transaction.bankTransactionId, dongHoId, req);
          break;
        case "bank-transfer":
          redirectUrl = `/bank-transfer-info?reference=${reference}&amount=${amount}`;
          break;
      }

      res.status(200).json({ success: true, message: "Khởi tạo giao dịch thành công", data: { transactionId: transaction.bankTransactionId, reference, amount, paymentMethod, redirectUrl } });
    } catch (error: any) {
      console.error("Fund closure error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  private async generateMomoPaymentUrl(amount: number, reference: string, dongHoId: string): Promise<string> {
    const momoConfig = config.bankTransfer?.momo || {};
    if (!momoConfig.partnerCode || !momoConfig.accessKey || !momoConfig.secretKey) throw new Error("Momo configuration chưa được cấu hình đầy đủ");
    const requestId = `${reference}-${Date.now()}`;
    const orderId = `${reference}-${Date.now()}`;
    const orderInfo = `Đóng quỹ dòng họ ${dongHoId}`;
    const redirectUrl = process.env.MOMO_RETURN_URL || `${process.env.BASE_URL}/bank-transfer-callback?type=momo&reference=${reference}`;
    const ipnUrl = momoConfig.webhookUrl;
    const extraData = "";
    const requestType = "payWithMethod";
    const partnerName = momoConfig.partnerName || "Test";
    const storeId = momoConfig.storeId || "MomoTestStore";
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");
    const payload = { partnerCode: momoConfig.partnerCode, accessKey: momoConfig.accessKey, partnerName, storeId, requestId, amount: amount.toString(), orderId, orderInfo, redirectUrl, ipnUrl, lang: "vi", requestType, autoCapture: true, extraData, orderGroupId: "", signature };
    try {
      const response = await axios.post(momoConfig.momoUrl, payload, { headers: { "Content-Type": "application/json" }, timeout: 15000 });
      if (response.data && response.data.errorCode === 0 && response.data.payUrl) return response.data.payUrl;
      throw new Error(`Momo API error: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      if (error.response) throw new Error(`Momo request failed (status ${error.response.status}): ${JSON.stringify(error.response.data)}`);
      throw new Error(`Momo request failed: ${error.message || "Unknown error"}`);
    }
  }

  private generateVnpayPaymentUrl(amount: number, reference: string, bankTransactionId: string, dongHoId: string, req?: Request): string {
    const orderInfo = `FAMTREE_${dongHoId}__${bankTransactionId}`;
    const ipAddr = this.getClientIpAddr(req) || '127.0.0.1';
    const ipv4Addr = ipAddr.includes(':') ? '127.0.0.1' : ipAddr;
    const frontendReturnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?bankTransactionId=${bankTransactionId}`;
    return this.vnpayService.createPaymentUrl(orderInfo, amount, reference, ipv4Addr, frontendReturnUrl);
  }

  async handleVnpayReturn(req: Request, res: Response): Promise<void> {
    try {
      const vnp_OrderInfo = req.query.vnp_OrderInfo as string;
      let bankTransactionId = (req.query.bankTransactionId as string) || '';
      if (!bankTransactionId && vnp_OrderInfo && vnp_OrderInfo.includes('__')) {
        const parts = vnp_OrderInfo.split('__');
        bankTransactionId = parts[parts.length - 1];
      }
      const vnpQueryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) { if (key.startsWith('vnp_')) vnpQueryParams.append(key, value as string); }
      const vnpQueryString = vnpQueryParams.toString();
      const frontendUrl = this.config.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = bankTransactionId ? `${frontendUrl}/payment-success?bankTransactionId=${bankTransactionId}&${vnpQueryString}` : `${frontendUrl}/payment-success?${vnpQueryString}`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('[VNPay] Return callback error:', error);
      res.status(500).json({ success: false, message: "Lỗi xử lý callback từ VNPay: " + error.message });
    }
  }

  async verifyVnpayReturn(req: Request, res: Response): Promise<void> {
    try {
      const { vnp_Params, bankTransactionId: requestBankTransactionId } = req.body;
      if (!vnp_Params || typeof vnp_Params !== 'object') { res.status(400).json({ success: false, message: "Thiếu thông tin VNPAY" }); return; }
      
      const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
      const vnp_Amount = vnp_Params['vnp_Amount'];
      const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
      let bankTransactionId = typeof requestBankTransactionId === 'string' ? requestBankTransactionId : '';
      if (!bankTransactionId && typeof vnp_Params['vnp_OrderInfo'] === 'string') {
        const parsedBankTransactionId = this.extractBankTransactionIdFromOrderInfo(vnp_Params['vnp_OrderInfo']);
        if (parsedBankTransactionId) {
          bankTransactionId = parsedBankTransactionId;
        }
      }

      let transaction = bankTransactionId ? await this.bankTransactionRepository.getBankTransactionById(bankTransactionId) : null;
      if (!transaction && typeof vnp_Params['vnp_TxnRef'] === 'string') {
        transaction = await this.bankTransactionRepository.getBankTransactionByMaGiaoDich(vnp_Params['vnp_TxnRef']);
        if (transaction) {
          bankTransactionId = transaction.bankTransactionId;
        }
      }
      if (!transaction) {
        res.status(404).json({ success: false, message: `Giao dịch không tồn tại trong hệ thống ss. Mã: ${bankTransactionId || 'unknown'}` });
        return;
      }

      if (vnp_ResponseCode === '00') {
        await this.bankTransactionRepository.updateBankTransactionStatus(transaction.bankTransactionId, "verified", new Date());
        await this.bankTransferService.logWebhookRequest("vnpay", vnp_Params, { success: true, message: "Giao dịch được xác nhận từ VNPay", transactionId: transaction.bankTransactionId, vnpayTransactionNo: vnp_TransactionNo }, "verified", undefined);
        res.status(200).json({ success: true, message: "Giao dịch được xác nhận thành công", data: { transactionId: transaction.bankTransactionId, amount: parseInt(vnp_Amount as string) / 100, vnpayTransactionNo: vnp_TransactionNo, transactionDetails: transaction } });
      } else {
        const errorMessage = this.getVNPayErrorMessage(vnp_ResponseCode);
        await this.bankTransferService.logWebhookRequest("vnpay", vnp_Params, { success: false, message: errorMessage, transactionId: bankTransactionId }, "failed", errorMessage);
        res.status(200).json({ success: false, message: `Giao dịch không thành công: ${errorMessage}`, data: { errorCode: vnp_ResponseCode, errorMessage } });
      }
    } catch (error: any) {
      console.error('[VNPay] Frontend verification error:', error);
      res.status(500).json({ success: false, message: "Lỗi xử lý callback từ VNPay: " + error.message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.body;
      if (!transactionId) { res.status(400).json({ success: false, message: "Thiếu mã giao dịch" }); return; }
      const transaction = await this.bankTransactionRepository.getBankTransactionById(transactionId);
      if (!transaction) { res.status(404).json({ success: false, message: "Giao dịch không tồn tại" }); return; }
      if (transaction.status === 'verified') { res.status(200).json({ success: true, message: "Giao dịch đã được xác nhận trước đó", data: transaction }); return; }
      res.status(200).json({ success: true, message: "Xác nhận giao dịch thành công", data: transaction });
    } catch (error: any) {
      console.error('[Verify Payment] Error:', error);
      res.status(500).json({ success: false, message: "Lỗi xác nhận thanh toán: " + error.message });
    }
  }

  private getVNPayErrorMessage(responseCode: string): string { const errorMessages: Record<string, string> = { '00': 'Giao dịch thành công', '01': 'Giao dịch bị từ chối', '02': 'Merchant closed' }; return errorMessages[responseCode] || `Mã lỗi: ${responseCode}`; }

  private extractBankTransactionIdFromOrderInfo(orderInfo?: string): string | null {
    if (!orderInfo) return null;
    const parts = orderInfo.split('__');
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  private getClientIpAddr(req?: Request): string | undefined { if (!req) return '127.0.0.1'; const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || (req.headers['cf-connecting-ip'] as string) || (req.headers['x-client-ip'] as string) || req.ip || req.socket?.remoteAddress || '127.0.0.1'; return ip; }
}

export default BankTransferController;
