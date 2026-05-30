"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Wallet, Copy, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/service/useToas";
import { useFormValidation } from "@/lib/useFormValidation";
import { FormRules } from "@/lib/validator";
import storage from "@/utils/storage";

interface PaymentMethod {
  value: "vietqr" | "vnpay" | "momo" | "bank-transfer";
  label: string;
  description: string;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; paymentMethod: string }) => Promise<void>;
  isLoading?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    value: "vietqr",
    label: "Chuyển khoản qua mã QR (VietQR)",
    description: "Mã QR tự động kèm số tiền, quét bằng mọi app Ngân hàng để thanh toán nhanh",
  },
  {
    value: "vnpay",
    label: "VNPay",
    description: "Thanh toán qua cổng VNPay (thẻ ngân hàng, ví điện tử)",
  },
];

const rules: FormRules = {
  amount: {
    label: "Số tiền",
    rules: ["required", "number", "integer", "positive"],
  },
  paymentMethod: { label: "Phương thức thanh toán", rules: ["required"] },
};

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { showError, showSuccess } = useToast();
  const [mounted, setMounted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const { values, handleChange, handleBlur, validateAll, setValue, getError } =
    useFormValidation({
      initialValues: {
        amount: "",
        paymentMethod: "vietqr",
      },
      rules,
    });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setValue("amount", "");
      setValue("paymentMethod", "vietqr");
      setShowQR(false);
      setQrUrl("");
      setCopied(false);
    }
  }, [isOpen, setValue]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess("Đã sao chép thông tin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vietqr-dong-gop-${values.amount || "quy"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess("Đã tải ảnh mã QR xuống!");
    } catch (error) {
      console.error("Error downloading QR:", error);
      // Fallback
      window.open(qrUrl, "_blank");
    }
  };

  const handleQRCompleted = async () => {
    try {
      await onSubmit({
        amount: Number(values.amount) || 0,
        paymentMethod: "bank_transfer",
      });
      showSuccess("Giao dịch đóng góp đã được ghi nhận hệ thống!");
      onClose();
    } catch (error) {
      console.error("Error completing payment:", error);
      showError("Có lỗi xảy ra khi cập nhật giao dịch.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showError("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    if (values.paymentMethod === "vietqr") {
      const bankCode = "970431"; // Vietcombank
      const accountNumber = "0377666627";
      const accountName = "NHU BAO ANH";

      const user = storage.getUser();
      const userName = user?.full_name || "Thanh vien";

      // Unsigned tones converter for VietQR message
      const removeVietnameseTones = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D');
      };

      const cleanName = removeVietnameseTones(userName);
      const description = `Dong gop quy dong ho - ${cleanName}`;

      const generatedUrl = `https://api.vietqr.io/image/${bankCode}-${accountNumber}-print.png?amount=${values.amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

      setQrUrl(generatedUrl);
      setShowQR(true);
      return;
    }

    try {
      await onSubmit({
        amount: Number(values.amount) || 0,
        paymentMethod: values.paymentMethod as string,
      });
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      showError("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  if (!isOpen || !mounted) return null;

  // Render QR Code Screen
  if (showQR) {
    const user = storage.getUser();
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="bg-[#fffdf5] w-full max-w-lg rounded-2xl shadow-2xl border-2 border-[#d4af37] overflow-hidden flex flex-col max-h-[95vh] animate-in-up">
          {/* Header */}
          <div className="bg-[#b91c1c] text-yellow-400 px-6 py-4 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowQR(false)}
              className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-lg font-bold uppercase flex-1 flex items-center gap-2">
              <Wallet size={20} /> Thanh Toán VietQR
            </h3>
            <button
              onClick={onClose}
              className="hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* QR Display Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center space-y-6">
            <div className="text-center">
              <p className="text-xs font-semibold text-[#8b5e3c] uppercase tracking-wider">Số tiền đóng góp</p>
              <p className="text-3xl font-extrabold text-red-600 mt-1">
                {Number(values.amount).toLocaleString("vi-VN")} <span className="text-lg font-bold">VNĐ</span>
              </p>
            </div>

            {/* QR Card */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-yellow-600/30 flex flex-col items-center max-w-xs w-full transition-transform hover:scale-[1.02] duration-300">
              <div className="bg-gradient-to-br from-yellow-50 to-white p-3 rounded-lg border-2 border-[#d4af37] w-full">
                <img
                  src={qrUrl}
                  alt="VietQR Code"
                  className="w-full aspect-square rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/qr-code.svg";
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">
                Mở ứng dụng Ngân hàng của bạn và quét mã QR ở trên để thực hiện chuyển khoản tự động chính xác số tiền.
              </p>
            </div>

            {/* Bank Info Details */}
            <div className="w-full bg-[#fdf6e3] rounded-xl p-4 border border-[#d4af37]/30 space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#d4af37]/10">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-bold text-[#5d4037]">Vietcombank</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#d4af37]/10">
                <span className="text-gray-600">Số tài khoản:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-green-700">0377666627</span>
                  <button
                    onClick={() => handleCopy("0377666627")}
                    className="p-1 hover:bg-yellow-100 rounded text-[#b91c1c] active:scale-90 transition-transform"
                    title="Sao chép số tài khoản"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#d4af37]/10">
                <span className="text-gray-600">Chủ tài khoản:</span>
                <span className="font-bold uppercase text-[#5d4037]">NGUYEN VAN BAO</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-600">Nội dung chuyển khoản:</span>
                <div className="p-2 bg-white rounded border border-[#d4af37]/20 flex justify-between items-center">
                  <span className="font-medium text-[#8b5e3c] break-all pr-2 text-xs">
                    Dong gop quy dong ho - {user?.full_name || "Thanh vien"}
                  </span>
                  <button
                    onClick={() => handleCopy(`Dong gop quy dong ho - ${user?.full_name || "Thanh vien"}`)}
                    className="p-1 hover:bg-yellow-100 rounded text-[#b91c1c] flex-shrink-0 active:scale-90 transition-transform"
                    title="Sao chép nội dung"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-xs border border-blue-200 transition-colors shadow-sm"
              >
                <Download size={15} />
                Tải ảnh QR
              </button>
              <button
                onClick={() => window.open(qrUrl, "_blank")}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 rounded-lg font-semibold text-xs border border-yellow-200 transition-colors shadow-sm"
              >
                Mở link ảnh QR
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#fdf6e3] border-t border-[#d4af37]/30 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={() => setShowQR(false)}
              className="px-4 py-2 text-[#5d4037] font-semibold hover:text-[#b91c1c]"
            >
              Quay lại
            </button>
            <button
              onClick={handleQRCompleted}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center gap-2 shadow-md transition-colors"
            >
              <CheckCircle2 size={18} />
              Tôi đã chuyển khoản
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Render Form Screen using React Portal
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#fffdf5] w-full max-w-2xl rounded-xl shadow-2xl border border-[#d4af37] overflow-hidden flex flex-col max-h-[95vh] animate-in-up">
        <div className="bg-[#b91c1c] text-yellow-400 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2">
            <Wallet size={24} /> Đóng Quỹ Dòng Họ
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          id="paymentForm"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#8b5e3c] uppercase block">
              Số tiền đóng quỹ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#8b5e3c] font-bold">
                ₫
              </span>
              <input
                type="number"
                name="amount"
                value={values.amount || ""}
                onChange={(e) => setValue("amount", e.target.value)}
                onBlur={handleBlur}
                placeholder="Nhập số tiền (VNĐ)"
                min="1"
                step="1"
                className={`w-full p-3 pl-8 bg-white border rounded focus:outline-none text-[#333] font-semibold ${getError("amount")
                    ? "border-red-500 bg-red-50"
                    : "border-[#d4af37]/50 focus:border-[#d4af37]"
                  }`}
              />
            </div>
            {getError("amount") && (
              <p className="text-red-500 text-sm mt-1">{getError("amount")}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8b5e3c] uppercase block">
              Chọn phương thức thanh toán <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start p-4 border rounded cursor-pointer transition-all ${values.paymentMethod === method.value
                      ? "border-[#d4af37] bg-[#fdf6e3]"
                      : "border-[#d4af37]/30 bg-white hover:bg-[#fdf6e3]/50"
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={values.paymentMethod === method.value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="mt-1 w-4 h-4 accent-[#b91c1c] cursor-pointer flex-shrink-0"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-bold text-[#5d4037]">{method.label}</p>
                    <p className="text-xs text-[#8b5e3c] mt-0.5">
                      {method.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {getError("paymentMethod") && (
              <p className="text-red-500 text-sm mt-1">
                {getError("paymentMethod")}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">ℹ️ Lưu ý:</span> Phương thức VietQR sẽ tạo ảnh mã QR điền sẵn số tiền của bạn để quét thanh toán nhanh bằng ứng dụng ngân hàng. Phương thức VNPay sẽ dẫn tới cổng thanh toán trực tuyến.
            </p>
          </div>
        </form>

        <div className="p-4 bg-[#fdf6e3] border-t border-[#d4af37]/30 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 text-[#5d4037] font-bold hover:text-[#b91c1c] disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="paymentForm"
            disabled={isLoading}
            className="px-6 py-2 bg-[#b91c1c] text-white font-bold rounded hover:bg-[#991b1b] flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check size={18} />
                Lấy link thanh toán
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
