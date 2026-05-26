import React, { useState } from "react";
import { X, Copy, Download } from "lucide-react";
import Image from "next/image";

interface FundCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundCollectionModal: React.FC<FundCollectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const bankInfo = {
    bankName: "Vietcombank", // Thay đổi theo ngân hàng của bạn
    accountName: "Gia Đình", // Tên chủ tài khoản
    accountNumber: "1234567890", // Số tài khoản
    description: "Quỹ gia đình - Đóng góp cho hoạt động gia phả", // Mô tả
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    // Placeholder - thay bằng QR code thực tế
    const link = document.createElement("a");
    link.href = "/qr-code.svg"; // Đường dẫn tới QR code
    link.download = "qr-code-donation.svg";
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#5d4037]">Đóng Quỹ Gia Đình</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-gray-100 p-6 rounded-xl mb-4">
            <Image
              src="/qr-code.svg"
              alt="QR Code"
              width={200}
              height={200}
              className="w-48 h-48"
            />
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">
            Quét mã QR để thực hiện chuyển khoản
          </p>
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download size={18} />
            Tải mã QR
          </button>
        </div>

        {/* Bank Transfer Info Section */}
        <div className="bg-gradient-to-br from-[#ede5b7] to-[#f5efc8] p-6 rounded-xl">
          <h3 className="text-lg font-bold text-[#5d4037] mb-4">
            Thông Tin Chuyển Khoản
          </h3>

          <div className="space-y-4">
            {/* Bank Name */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Ngân Hàng</p>
              <p className="font-semibold text-[#5d4037]">{bankInfo.bankName}</p>
            </div>

            {/* Account Name */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Chủ Tài Khoản</p>
              <p className="font-semibold text-[#5d4037]">{bankInfo.accountName}</p>
            </div>

            {/* Account Number */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Số Tài Khoản</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-bold text-[#5d4037] text-lg">
                  {bankInfo.accountNumber}
                </p>
                <button
                  onClick={handleCopyAccount}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Sao chép số tài khoản"
                >
                  <Copy size={18} className="text-[#b91c1c]" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-1">✓ Đã sao chép</p>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Nội Dung Chuyển Khoản</p>
              <p className="font-semibold text-[#5d4037] text-sm">
                {bankInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Quỹ gia đình được sử dụng để hỗ trợ các hoạt động gia phả, tổ chức sự kiện gia đình và phục vụ các thành viên.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
