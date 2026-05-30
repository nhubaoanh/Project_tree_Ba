"use client";
import React, { useEffect } from "react";
import { X, Check, Loader2, Wallet } from "lucide-react";
import { useToast } from "@/service/useToas";
import { useFormValidation } from "@/lib/useFormValidation";
import { FormRules } from "@/lib/validator";

interface PaymentMethod {
  value: "bank-transfer" | "momo" | "vnpay";
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
  const { showError } = useToast();

  const { values, handleChange, handleBlur, validateAll, setValue, getError } =
    useFormValidation({
      initialValues: {
        amount: "",
        paymentMethod: "vnpay",
      },
      rules,
    });

  useEffect(() => {
    if (isOpen) {
      setValue("amount", "");
      setValue("paymentMethod", "vnpay");
    }
  }, [isOpen, setValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showError("Vui lòng kiểm tra lại thông tin!");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#fffdf5] w-full max-w-2xl rounded-lg shadow-2xl border border-[#d4af37] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#b91c1c] text-yellow-400 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2">
            <Wallet size={24} /> Đóng Quỹ
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form
          id="paymentForm"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#8b5e3c] uppercase">
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
                className={`w-full p-3 pl-8 bg-white border rounded focus:outline-none text-[#333] font-semibold ${
                  getError("amount")
                    ? "border-red-500 bg-red-50"
                    : "border-[#d4af37]/50 focus:border-[#d4af37]"
                }`}
              />
            </div>
            {getError("amount") && (
              <p className="text-red-500 text-sm">{getError("amount")}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8b5e3c] uppercase">
              Chọn phương thức thanh toán{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start p-4 border rounded cursor-pointer transition-all ${
                    values.paymentMethod === method.value
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
                    className="mt-0.5 w-4 h-4 accent-[#b91c1c] cursor-pointer"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-bold text-[#5d4037]">{method.label}</p>
                    <p className="text-sm text-[#8b5e3c]">
                      {method.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {getError("paymentMethod") && (
              <p className="text-red-500 text-sm">
                {getError("paymentMethod")}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-bold">ℹ️ Lưu ý:</span> Khi bạn nhấp "Tiếp
              tục", bạn sẽ được chuyển đến cổng thanh toán. Vui lòng hoàn thành
              giao dịch để cập nhật quỹ.
            </p>
          </div>
        </form>

        <div className="p-4 bg-[#fdf6e3] border-t border-[#d4af37]/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 text-[#5d4037] font-bold hover:text-[#b91c1c] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="paymentForm"
            disabled={isLoading}
            className="px-6 py-2 bg-[#b91c1c] text-white font-bold rounded hover:bg-[#991b1b] flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
};
