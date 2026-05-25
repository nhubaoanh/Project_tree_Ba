/**
 * Model cho Bank Transaction - Giao dịch chuyển khoản
 */

export interface BankTransaction {
  status?: string;
  bankTransactionId: string;          // UUID
  dongHoId: string;                   // ID dòng họ
  nguoiDungId: string;                // ID user
  soTien: number;                     // Số tiền chuyển khoản
  phuongThucThanhToan: string;        // momo, vnpay, bank_transfer (tên provider)
  noiDungChuyenKhoan: string;         // username_server_code
  maGiaoDichNganHang: string;         // Transaction ID từ bank (unique)
  trangThai: string;                  // pending, completed, failed, verified
  soTaiKhoanChuyen?: string;           // Số tài khoản người chuyển
  tenTaiKhoanChuyen?: string;          // Tên người chuyển
  ngayChuyenKhoan?: Date;              // Ngày chuyển khoản
  ngayXacNhan?: Date | null;           // Ngày xác nhận giao dịch
  webhookData?: string;                // JSON raw data từ webhook Momo/VNPay
  ghiChu?: string | null;              // Ghi chú bổ sung
  soLanThapTai?: number;               // Số lần nạp lại (0 = lần đầu)
  thanhToanId?: string | null;         // Liên kết tới bảng thanh_toan (nếu là nạp tiền gói)
  ngayTao?: Date;                      // Ngày tạo record
  luUserId?: string;                   // User tạo record
  luUpdated?: Date | null;             // Ngày cập nhật
  activeFlag?: number;                 // 1 = active, 0 = inactive
}

export interface TransactionContent {
  username: string;
  serverCode: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface MomoWebhookPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  resultMessage: string;
  responseTime: number;
  payType: string;
  extraData: string;
  signature: string;
  momoUser?: string;
}

export interface VnpayWebhookPayload {
  vnp_TransactionStatus: string;
  vnp_Amount: string;
  vnp_OrderInfo: string;
  vnp_TxnRef: string;
  vnp_TransactionNo: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_ResponseCode: string;
  vnp_ResponseId?: string;
  vnp_SecureHash: string;
  vnp_SecureHashType?: string;
}
