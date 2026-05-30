"use client";
import React, { useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Plus,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getContributionsByDongHo } from "@/service/contribution.service";
import storage from "@/utils/storage";
import { useToast } from "@/service/useToas";
import { PaymentMethodModal } from "./components/PaymentMethodModal";
import { API_CORE, BASE_URL } from "@/constant/config";

interface BankTransaction {
  bankTransactionId: string;
  tenTaiKhoanChuyen?: string;
  ngayChuyenKhoan?: string;
  soTien: number;
  phuongThucThanhToan?: string;
  trangThai?: string;
  noiDungChuyenKhoan?: string;
  maGiaoDichNganHang?: string;
}

interface BankTransactionResponse {
  data: BankTransaction[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS = [
  { value: "verified", label: "Đã xác thực" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "failed", label: "Thất bại" },
];

const METHOD_OPTIONS = [
  { value: "", label: "Tất cả phương thức" },
  { value: "vnpay", label: "VNPay" },
  { value: "momo", label: "Momo" },
  { value: "bank_transfer", label: "Chuyển khoản" },
];

export default function ContributionsPage() {
  const user = storage.getUser();
  const dongHoId = user?.dongHoId;
  const { showError, showSuccess } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("verified");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: contributions, isLoading } = useQuery<
    BankTransactionResponse,
    Error
  >({
    queryKey: ["contributions", dongHoId, currentPage, pageSize, statusFilter],
    queryFn: () =>
      getContributionsByDongHo(
        dongHoId || "",
        currentPage,
        pageSize,
        statusFilter,
      ),
    enabled: !!dongHoId,
  });

  const transactions = Array.isArray(contributions?.data)
    ? contributions.data
    : [];

  const filteredTransactions = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return transactions.filter((item) => {
      if (methodFilter && item.phuongThucThanhToan !== methodFilter)
        return false;
      if (!lowerSearch) return true;
      return [
        item.tenTaiKhoanChuyen,
        item.noiDungChuyenKhoan,
        item.maGiaoDichNganHang,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerSearch));
    });
  }, [transactions, methodFilter, searchTerm]);

  const sortedContributions = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) => Number(b.soTien) - Number(a.soTien),
      ),
    [filteredTransactions],
  );

  const totalAmount = sortedContributions.reduce(
    (sum, item) => sum + Number(item.soTien),
    0,
  );
  const totalContributors = new Set(
    sortedContributions.map((item) => item.tenTaiKhoanChuyen || ""),
  ).size;
  const totalTransactions =
    contributions?.pagination?.total ?? transactions.length;
  const totalPages = contributions?.pagination?.totalPages ?? 1;

  const handleFundClosure = async (data: {
    amount: number;
    paymentMethod: string;
  }) => {
    setIsProcessingPayment(true);
    try {
      const token = storage.getToken();
      const response = await fetch(
        `${BASE_URL}/${API_CORE}/bank-transfer/initiate-fund-closure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            dongHoId,
            nguoiDungId: user?.nguoiDungId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Khởi tạo giao dịch thất bại");
      }

      const result = await response.json();
      if (result.data?.redirectUrl) {
        window.location.href = result.data.redirectUrl;
      } else {
        showSuccess(
          "Yêu cầu đóng quỹ đã được gửi. Vui lòng hoàn tất thanh toán.",
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      showError(error?.message || "Có lỗi khi khởi tạo thanh toán.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!dongHoId) {
    return (
      <div className="flex h-full items-center justify-center text-[#8b5e3c]">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Không xác định được dòng họ của bạn.
          </p>
          <p className="mt-2 text-sm">
            Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#8b5e3c]">Đang tải lịch sử đóng quỹ...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 pb-24">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#8b5e3c] mb-2">
          Lịch sử đóng quỹ
        </h1>
        <p className="text-[#8b5e3c]/80">
          Xem lại lịch sử đóng quỹ và tổng số tiền đã đóng cho dòng họ của bạn.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] items-end">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Tìm kiếm</span>
          <div className="mt-2 relative rounded-lg border border-gray-300 focus-within:border-[#8b5e3c]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên, nội dung, mã giao dịch..."
              className="w-full rounded-lg border-none bg-transparent py-2 pl-10 pr-4 text-sm text-gray-900 outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">
            Phương thức
          </span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#8b5e3c]"
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-gradient-to-r from-[#b91c1c] to-[#991b1b] rounded-lg p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Wallet className="text-yellow-300" /> Đóng Quỹ Dòng Họ
            </h2>
            <p className="text-red-100">
              Tham gia đóng góp cho quỹ phát triển chung của dòng họ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 text-sm font-bold text-[#8b5e3c] transition hover:bg-yellow-600"
          >
            <Plus size={18} /> Đóng Quỹ Ngay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">
                Tổng tiền trong trang
              </p>
              <p className="text-2xl font-bold text-green-800">
                {Number(totalAmount).toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-600">
                Số người trong trang
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {totalContributors}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-600">
                Tổng giao dịch
              </p>
              <p className="text-2xl font-bold text-purple-800">
                {totalTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">
                Người đóng
              </th>
              <th className="px-4 py-3 font-medium text-gray-700">Số tiền</th>
              <th className="px-4 py-3 font-medium text-gray-700">Ngày đóng</th>
              <th className="px-4 py-3 font-medium text-gray-700">
                Phương thức
              </th>
              <th className="px-4 py-3 font-medium text-gray-700">Nội dung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedContributions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Không tìm thấy giao dịch phù hợp.
                </td>
              </tr>
            ) : (
              sortedContributions.map((item) => (
                <tr key={item.bankTransactionId}>
                  <td className="px-4 py-3 text-gray-700">
                    {item.tenTaiKhoanChuyen || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {Number(item.soTien).toLocaleString("vi-VN")} VNĐ
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.ngayChuyenKhoan
                      ? new Date(item.ngayChuyenKhoan).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.phuongThucThanhToan || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.noiDungChuyenKhoan || item.maGiaoDichNganHang || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleFundClosure}
        isLoading={isProcessingPayment}
      />
    </div>
  );
}
