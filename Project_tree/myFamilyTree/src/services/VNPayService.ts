import crypto from 'crypto';
import { config } from '../config/config';

export class VNPayService {
  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_ReturnUrl: string;

  constructor() {
    this.vnp_TmnCode = config.bankTransfer?.vnpay?.merchantCode || '';
    this.vnp_HashSecret = config.bankTransfer?.vnpay?.hashSecret || '';
    this.vnp_Url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = config.bankTransfer?.vnpay?.returnUrl || '';
  }

  createPaymentUrl(orderInfo: string, amount: number, orderId: string, ipAddr: string, returnUrlOverride?: string): string {
    const vnp_Params: Record<string, string | number> = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'billpayment';
    vnp_Params['vnp_Amount'] = amount * 100;

    let returnUrl = returnUrlOverride || this.vnp_ReturnUrl;
    try {
      const urlObj = new URL(returnUrl);
      returnUrl = urlObj.toString();
    } catch (e) {}

    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = this.getCurrentDateTime();

    const sortedParams = this.sortObject(vnp_Params);
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const urlParams = new URLSearchParams();
    for (const key of Object.keys(sortedParams)) {
      urlParams.append(key, sortedParams[key]);
    }
    urlParams.append('vnp_SecureHashType', 'SHA512');
    urlParams.append('vnp_SecureHash', signed);

    const paymentUrl = `${this.vnp_Url}?${urlParams.toString()}`;
    return paymentUrl;
  }

  verifyReturnUrl(vnp_Params: Record<string, any>): boolean {
    const secureHash = vnp_Params['vnp_SecureHash'];
    const filteredParams = { ...vnp_Params };
    delete filteredParams['vnp_SecureHash'];
    delete filteredParams['vnp_SecureHashType'];
    const sortedParams = this.sortObject(filteredParams);
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    return secureHash === signed;
  }

  parseOrderInfo(orderInfo: string): { username: string; serverCode: string } | null {
    const parts = orderInfo.split('_');
    if (parts.length === 2) return { username: parts[0], serverCode: parts[1] };
    return null;
  }

  getTransactionReference(txnRef: string): string {
    return txnRef || '';
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const keys = Object.keys(obj).sort();
    const sorted: Record<string, string> = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      sorted[key] = String(obj[key]);
    }
    return sorted;
  }
}

export default new VNPayService();
