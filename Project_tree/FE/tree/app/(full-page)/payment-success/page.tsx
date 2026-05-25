"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/service/useToas";
import storage from "@/utils/storage";

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  vnpayTransactionNo?: string;
  errorCode?: string;
  errorMessage?: string;
  transactionDetails?: any;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const bankTransactionId = searchParams.get("bankTransactionId");

  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [hasVerified, setHasVerified] = useState(false);

  const vnpParams = React.useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("vnp_")) {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  useEffect(() => {
    if (hasVerified) return;

    const verifyPayment = async () => {
      try {
        if (Object.keys(vnpParams).length === 0) {
          setPaymentResult({ success: false, errorMessage: "Không có thông tin thanh toán từ VNPay" });
          showError("Không có thông tin thanh toán từ VNPay");
          return;
        }

        if (!bankTransactionId) {
          setPaymentResult({ success: false, errorMessage: "Không tìm thấy mã giao dịch" });
          showError("Không tìm thấy mã giao dịch");
          return;
        }

        const token = storage.getToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
        const response = await fetch(
          `${apiBaseUrl}/api-core/bank-transfer/verify-vnpay-return`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ vnp_Params: vnpParams, bankTransactionId }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          const paymentData = data.data;
          setPaymentResult({
            success: true,
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            vnpayTransactionNo: paymentData.vnpayTransactionNo,
            transactionDetails: paymentData.transactionDetails,
          });
          showSuccess("Thanh toán đã được xác nhận, đơn hàng thành công.");
        } else {
          setPaymentResult({
            success: false,
            errorCode: data.data?.errorCode || vnpParams.vnp_ResponseCode || undefined,
            errorMessage: data.message || data.data?.errorMessage || "Xác nhận thanh toán thất bại",
          });
          showError(data.message || data.data?.errorMessage || "Xác nhận thanh toán thất bại");
        }
      } catch (error: any) {
        setPaymentResult({ success: false, errorMessage: error?.message || "Lỗi kết nối khi xác nhận thanh toán" });
        showError(error?.message || "Lỗi kết nối khi xác nhận thanh toán");
      } finally {
        setLoading(false);
        setHasVerified(true);
      }
    };

    verifyPayment();
  }, [vnpParams, bankTransactionId, hasVerified, showError, showSuccess]);

  const handleBack = () => router.push("/genealogy");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5e0] flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white shadow-xl border border-[#d4af37]/20 p-10 text-center w-full max-w-lg">
          <Loader2 className="mx-auto mb-4 text-[#b91c1c] animate-spin" size={48} />
          <h1 className="text-2xl font-bold text-[#5d4037] mb-2">Đang xác nhận thanh toán</h1>
          <p className="text-[#8b5e3c]">Vui lòng chờ trong giây lát, hệ thống đang xác thực giao dịch với VNPay.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5e0] py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-white border border-[#d4af37]/20 shadow-xl p-8">
          {paymentResult?.success ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-green-700">
                <CheckCircle size={40} className="text-green-600" />
                <div>
                  <h1 className="text-3xl font-bold">Thanh toán thành công</h1>
                  <p className="text-sm text-[#6b7280]">Giao dịch VNPay đã được xác nhận.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {paymentResult.transactionId && (
                  <div className="rounded-2xl bg-[#f3f9f7] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#15803d]">Mã giao dịch</p>
                    <p className="mt-2 font-semibold text-[#065f46]">{paymentResult.transactionId}</p>
                  </div>
                )}
                {paymentResult.vnpayTransactionNo && (
                  <div className="rounded-2xl bg-[#f3f9f7] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#15803d]">Mã VNPay</p>
                    <p className="mt-2 font-semibold text-[#065f46]">{paymentResult.vnpayTransactionNo}</p>
                  </div>
                )}
                {paymentResult.amount !== undefined && (
                  <div className="rounded-2xl bg-[#eff6ff] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#2563eb]">Số tiền</p>
                    <p className="mt-2 font-semibold text-[#1d4ed8]">{paymentResult.amount.toLocaleString("vi-VN")} VNĐ</p>
                  </div>
                )}
                {paymentResult.transactionDetails?.status && (
                  <div className="rounded-2xl bg-[#fff7ed] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c2410c]">Trạng thái</p>
                    <p className="mt-2 font-semibold text-[#9a3412]">{paymentResult.transactionDetails.status}</p>
                  </div>
                )}
              </div>

              {paymentResult.transactionDetails && (
                <div className="rounded-3xl border border-[#d4af37]/20 bg-[#fdf7e7] p-5">
                  <h2 className="text-lg font-bold text-[#5d4037] mb-3">Chi tiết đơn hàng</h2>
                  <div className="space-y-3 text-sm text-[#4b5563]">
                    <p>
                      <span className="font-semibold">Thời gian:</span>{" "}
                      {paymentResult.transactionDetails.createdAt
                        ? new Date(paymentResult.transactionDetails.createdAt).toLocaleString("vi-VN")
                        : "Không xác định"}
                    </p>
                    {paymentResult.transactionDetails.verifiedAt && (
                      <p>
                        <span className="font-semibold">Xác nhận lúc:</span>{" "}
                        {new Date(paymentResult.transactionDetails.verifiedAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Nội dung:</span>{" "}
                      {paymentResult.transactionDetails.noiDungChuyenKhoan || "Đóng quỹ"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-red-700">
                <XCircle size={40} className="text-red-600" />
                <div>
                  <h1 className="text-3xl font-bold">Thanh toán thất bại</h1>
                  <p className="text-sm text-[#6b7280]">VNPay không thể xác nhận giao dịch.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">Lý do:</p>
                <p>{paymentResult?.errorMessage || "Không xác định"}</p>
                {paymentResult?.errorCode && <p className="mt-2">Mã lỗi: {paymentResult.errorCode}</p>}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-full bg-[#b91c1c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#991b1b]"
            >
              <ArrowLeft className="mr-2" size={18} />
              Về trang gia phả
            </button>
            {paymentResult?.success && (
              <button
                onClick={() => router.push("/genealogy")}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-white px-6 py-3 text-sm font-semibold text-[#5d4037] transition hover:bg-[#fff8dc]"
              >
                Xem tiếp đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
