"use client";
import React, { useMemo, useState } from "react";
import {
  DollarSign, Users, TrendingUp, Search, Calendar,
  RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getContributionsByDongHo } from "@/service/contribution.service";
import storage from "@/utils/storage";
import { PageLayout, PageLoading, ErrorState, NoFamilyTreeState } from "@/components/shared";

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

const STATUS_OPTIONS = [
  { value: "verified",  label: "Đã xác thực" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending",   label: "Chờ xác nhận" },
  { value: "failed",    label: "Thất bại" },
];

const METHOD_OPTIONS = [
  { value: "",               label: "Tất cả phương thức" },
  { value: "vnpay",          label: "VNPay" },
  { value: "momo",           label: "Momo" },
  { value: "bank_transfer",  label: "Chuyển khoản" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  verified:  { label: "Đã xác thực",  className: "bg-green-100 text-green-800" },
  completed: { label: "Hoàn thành",   className: "bg-blue-100 text-blue-800" },
  pending:   { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
  failed:    { label: "Thất bại",     className: "bg-red-100 text-red-800" },
};

export default function QuanLyDongQuyPage() {
  const user = storage.getUser();
  const dongHoId = user?.dongHoId;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("verified");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: response, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-contributions", dongHoId, currentPage, pageSize, statusFilter],
    queryFn: () => getContributionsByDongHo(dongHoId || "", currentPage, pageSize, statusFilter),
    enabled: !!dongHoId,
  });

  const transactions: BankTransaction[] = Array.isArray(response?.data) ? response.data : [];
  const totalRecords = response?.pagination?.total ?? transactions.length;
  const totalPages   = response?.pagination?.totalPages ?? 1;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return transactions.filter((t) => {
      if (methodFilter && t.phuongThucThanhToan !== methodFilter) return false;
      if (!q) return true;
      return [t.tenTaiKhoanChuyen, t.noiDungChuyenKhoan, t.maGiaoDichNganHang]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [transactions, methodFilter, searchTerm]);

  const totalAmount      = filtered.reduce((s, t) => s + Number(t.soTien), 0);
  const uniqueContributors = new Set(filtered.map((t) => t.tenTaiKhoanChuyen || "")).size;

  const pageActions = useMemo(() => [
    {
      id: "refresh",
      icon: RefreshCw,
      label: isFetching ? "Đang tải..." : "Làm mới",
      onClick: () => refetch(),
      variant: "secondary" as const,
    },
  ], [isFetching, refetch]);

  if (isLoading) return <PageLoading message="Đang tải danh sách đóng quỹ..." />;
  if (!dongHoId)  return <NoFamilyTreeState />;
  if (error)      return (
    <ErrorState
      title="Lỗi tải dữ liệu"
      message="Không thể tải danh sách đóng quỹ. Vui lòng thử lại."
      onRetry={() => refetch()}
    />
  );

  return (
    <PageLayout
      title="Quản lý đóng quỹ"
      subtitle="Danh sách các giao dịch đóng quỹ trực tuyến của dòng họ"
      icon={DollarSign}
      actions={pageActions}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 border border-green-200 flex items-center gap-4">
          <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-600 font-medium">Tổng tiền (trang này)</p>
            <p className="text-2xl font-bold text-green-800">
              {Number(totalAmount).toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 flex items-center gap-4">
          <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-600 font-medium">Số người đóng</p>
            <p className="text-2xl font-bold text-blue-800">{uniqueContributors}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 flex items-center gap-4">
          <TrendingUp className="h-8 w-8 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-purple-600 font-medium">Tổng giao dịch</p>
            <p className="text-2xl font-bold text-purple-800">{totalRecords}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên, nội dung, mã giao dịch..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#b91c1c]"
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b91c1c]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Phương thức</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b91c1c]"
          >
            {METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">
            Danh sách giao dịch
            {isFetching && <span className="ml-2 text-xs text-gray-400 font-normal">Đang cập nhật...</span>}
          </h3>
          <span className="text-sm text-gray-500">
            Hiển thị {filtered.length} / {totalRecords} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">STT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Người đóng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày đóng</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Số tiền</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Phương thức</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nội dung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <DollarSign className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p>Không có giao dịch nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => {
                  const badge = STATUS_BADGE[t.trangThai || ""] || {
                    label: t.trangThai || "-",
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <tr key={t.bankTransactionId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{t.tenTaiKhoanChuyen || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          {t.ngayChuyenKhoan
                            ? new Date(t.ngayChuyenKhoan).toLocaleDateString("vi-VN")
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        {Number(t.soTien).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.phuongThucThanhToan || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {t.noiDungChuyenKhoan || t.maGiaoDichNganHang || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / trang</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded border border-gray-300 bg-white p-1.5 text-gray-600 disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded border border-gray-300 bg-white p-1.5 text-gray-600 disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
