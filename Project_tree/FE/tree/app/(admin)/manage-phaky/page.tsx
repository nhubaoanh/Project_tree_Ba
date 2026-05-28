"use client";
import React, { useState } from "react";
import {
  ScrollText, Plus, Edit, Trash2, MapPin, User, Clock,
  Feather, Globe, Landmark, Home, CheckCircle,
} from "lucide-react";
import {
  IPhaKy, ILuocSuItem, IButTichItem, ITruyenThongItem,
  getPhaKyByDongHo, createPhaKy, updatePhaKy, deletePhaKy,
} from "@/service/phaky.service";
import { PhaKyModal } from "./components/PhaKyModal";
import { DeleteModal, PageLayout, PageLoading, ErrorState, NoFamilyTreeState } from "@/components/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import storage from "@/utils/storage";
import { useToast } from "@/service/useToas";

const parseJson = <T,>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try { return JSON.parse(val) as T[]; } catch { return []; }
};

export default function QuanLyPhaKyPage() {
  const user = storage.getUser();
  const dongHoId = user?.dongHoId || "";
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["phaky-admin", dongHoId],
    queryFn: () => getPhaKyByDongHo(dongHoId),
    enabled: !!dongHoId,
  });

  const phaKy: IPhaKy | null = data?.data || null;

  const createMutation = useMutation({
    mutationFn: (d: Partial<IPhaKy>) => createPhaKy(d as IPhaKy),
    onSuccess: () => {
      showSuccess("Tạo phả ký thành công!");
      queryClient.invalidateQueries({ queryKey: ["phaky-admin", dongHoId] });
      setIsModalOpen(false);
    },
    onError: (e: any) => showError(e.message || "Lỗi tạo phả ký"),
  });

  const updateMutation = useMutation({
    mutationFn: (d: Partial<IPhaKy>) => updatePhaKy(phaKy!.phaKyId!, d as IPhaKy),
    onSuccess: () => {
      showSuccess("Cập nhật phả ký thành công!");
      queryClient.invalidateQueries({ queryKey: ["phaky-admin", dongHoId] });
      setIsModalOpen(false);
    },
    onError: (e: any) => showError(e.message || "Lỗi cập nhật phả ký"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePhaKy(phaKy!.phaKyId!, user?.nguoiDungId || ""),
    onSuccess: () => {
      showSuccess("Đã xóa phả ký.");
      queryClient.invalidateQueries({ queryKey: ["phaky-admin", dongHoId] });
      setIsDeleteOpen(false);
    },
    onError: (e: any) => showError(e.message || "Lỗi xóa phả ký"),
  });

  const handleSave = (formData: Partial<IPhaKy>) => {
    if (phaKy) {
      updateMutation.mutate({ ...formData, dongHoId });
    } else {
      createMutation.mutate({ ...formData, dongHoId });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <PageLoading message="Đang tải phả ký..." />;
  if (error) return <ErrorState title="Lỗi" message="Không thể tải phả ký." onRetry={() => window.location.reload()} />;
  if (!dongHoId) return <NoFamilyTreeState />;

  const luocSu = parseJson<ILuocSuItem>(phaKy?.luocSu);
  const butTich = parseJson<IButTichItem>(phaKy?.butTich);
  const truyenThong = parseJson<ITruyenThongItem>(phaKy?.truyenThong);

  const pageActions = phaKy
    ? [
        {
          id: "edit",
          icon: Edit,
          label: "Chỉnh sửa",
          onClick: () => setIsModalOpen(true),
          variant: "primary" as const,
        },
        {
          id: "delete",
          icon: Trash2,
          label: "Xóa phả ký",
          onClick: () => setIsDeleteOpen(true),
          variant: "danger" as const,
        },
      ]
    : [
        {
          id: "create",
          icon: Plus,
          label: "Tạo Phả Ký",
          onClick: () => setIsModalOpen(true),
          variant: "primary" as const,
        },
      ];

  return (
    <PageLayout
      title="Quản lý Phả Ký"
      subtitle="Lịch sử và truyền thống dòng họ"
      icon={ScrollText}
      actions={pageActions}
    >
      {/* Chưa có phả ký */}
      {!phaKy && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ScrollText size={64} className="text-[#d4af37] mb-4 opacity-50" />
          <h3 className="text-2xl font-display text-[#8b5e3c] mb-2">Chưa có phả ký</h3>
          <p className="text-stone-500 mb-6 italic">Dòng họ chưa có phả ký. Bấm "Tạo Phả Ký" để bắt đầu.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#b91c1c] text-white rounded-lg shadow hover:bg-[#991b1b] transition-colors font-bold"
          >
            <Plus size={18} /> Tạo Phả Ký ngay
          </button>
        </div>
      )}

      {/* Đã có phả ký — hiển thị chi tiết */}
      {phaKy && (
        <div className="space-y-6">

          {/* Banner trạng thái */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-700 text-sm">Đã có phả ký</p>
              <p className="text-xs text-green-600">
                Cập nhật lần cuối: {phaKy.lu_updated ? new Date(phaKy.lu_updated).toLocaleDateString("vi-VN") : "—"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Vị tổ đầu tiên */}
            <div className="bg-white rounded-2xl border border-[#d4af37]/30 shadow-md p-5">
              <h3 className="font-display text-lg text-[#8b0000] mb-4 flex items-center gap-2">
                <User size={18} /> Vị Tổ Đầu Tiên
              </h3>
              <div className="flex gap-4 items-start">
                {phaKy.viToAnh && (
                  <img src={phaKy.viToAnh} alt="Vị tổ" className="w-20 h-20 object-cover rounded-lg border-2 border-[#d4af37]/40 flex-shrink-0" onError={e => e.currentTarget.style.display='none'} />
                )}
                <div>
                  <p className="font-bold text-[#5d4037]">{phaKy.viToHoTen || <span className="text-stone-400 italic">Chưa có</span>}</p>
                  {phaKy.viToBiography && (
                    <p className="text-sm text-stone-600 mt-1 line-clamp-3">{phaKy.viToBiography}</p>
                  )}
                  {!phaKy.viToAnh && !phaKy.viToHoTen && !phaKy.viToBiography && (
                    <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
                  )}
                </div>
              </div>
            </div>

            {/* Từ đường & Tổ quán */}
            <div className="bg-white rounded-2xl border border-[#d4af37]/30 shadow-md p-5 space-y-4">
              <div>
                <h3 className="font-display text-lg text-[#8b0000] mb-2 flex items-center gap-2">
                  <Landmark size={18} /> Từ Đường
                </h3>
                {(phaKy as any).tuDuongAnh && (
                  <img src={(phaKy as any).tuDuongAnh} alt="Từ đường" className="w-full h-32 object-cover rounded-lg border border-[#d4af37]/30 mb-2" onError={e => e.currentTarget.style.display='none'} />
                )}
                {phaKy.tuDuongDiaChi ? (
                  <p className="text-sm text-stone-600 flex items-start gap-1">
                    <MapPin size={13} className="text-[#8b0000] mt-0.5 flex-shrink-0" />
                    {phaKy.tuDuongDiaChi}
                  </p>
                ) : (
                  <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
                )}
              </div>
              <div className="border-t border-[#d4af37]/20 pt-4">
                <h3 className="font-display text-lg text-[#8b0000] mb-2 flex items-center gap-2">
                  <Home size={18} /> Tổ Quán
                </h3>
                {(phaKy as any).toQuanAnh && (
                  <img src={(phaKy as any).toQuanAnh} alt="Tổ quán" className="w-full h-32 object-cover rounded-lg border border-[#d4af37]/30 mb-2" onError={e => e.currentTarget.style.display='none'} />
                )}
                {phaKy.toQuanDiaChi ? (
                  <p className="text-sm text-stone-600 flex items-start gap-1">
                    <MapPin size={13} className="text-[#8b0000] mt-0.5 flex-shrink-0" />
                    {phaKy.toQuanDiaChi}
                  </p>
                ) : (
                  <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
                )}
              </div>
            </div>

            {/* Lược sử */}
            <div className="bg-white rounded-2xl border border-[#d4af37]/30 shadow-md p-5">
              <h3 className="font-display text-lg text-[#8b0000] mb-4 flex items-center gap-2">
                <Clock size={18} /> Lược Sử
                <span className="ml-auto text-xs text-stone-400 font-normal">{luocSu.length} mốc</span>
              </h3>
              {luocSu.length === 0 ? (
                <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {luocSu.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-sm items-start">
                      <span className="font-bold text-[#d4af37] whitespace-nowrap flex-shrink-0 pt-0.5">{item.thoiGian}</span>
                      <div className="flex-1">
                        <span className="text-stone-600 line-clamp-2">{item.suKien}</span>
                        {(item as any).hinhAnh && (
                          <img src={(item as any).hinhAnh} alt="" className="mt-1 h-16 object-cover rounded" onError={e => e.currentTarget.style.display='none'} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bút tích */}
            <div className="bg-white rounded-2xl border border-[#d4af37]/30 shadow-md p-5">
              <h3 className="font-display text-lg text-[#8b0000] mb-4 flex items-center gap-2">
                <Feather size={18} /> Bút Tích
                <span className="ml-auto text-xs text-stone-400 font-normal">{butTich.length} bút tích</span>
              </h3>
              {butTich.length === 0 ? (
                <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {butTich.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-[#d4af37]/50 pl-3 flex gap-3 items-start">
                      {(item as any).hinhAnh && (
                        <img src={(item as any).hinhAnh} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" onError={e => e.currentTarget.style.display='none'} />
                      )}
                      <div>
                        <p className="font-bold text-[#5d4037] text-sm">{item.hoTen}</p>
                        <p className="text-stone-600 text-xs italic line-clamp-2">"{item.noiDung}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Truyền thống */}
          <div className="bg-white rounded-2xl border border-[#d4af37]/30 shadow-md p-5">
            <h3 className="font-display text-lg text-[#8b0000] mb-4 flex items-center gap-2">
              <Globe size={18} /> Truyền Thống
              <span className="ml-auto text-xs text-stone-400 font-normal">{truyenThong.length} mục</span>
            </h3>
            {truyenThong.length === 0 ? (
              <p className="text-stone-400 italic text-sm">Chưa cập nhật</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {truyenThong.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-[#fdf6e3]/50 rounded-lg border border-[#d4af37]/20">
                    {item.hinhAnh && (
                      <img src={item.hinhAnh} alt="" className="w-16 h-16 object-cover rounded-md flex-shrink-0" onError={e => e.currentTarget.style.display='none'} />
                    )}
                    <p className="text-sm text-stone-600 line-clamp-3">{item.noiDung}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal chỉnh sửa / tạo mới */}
      {isModalOpen && (
        <PhaKyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          initialData={phaKy}
          isLoading={isSaving}
          dongHoId={dongHoId}
        />
      )}

      {/* Modal xóa */}
      {isDeleteOpen && (
        <DeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
          isLoading={deleteMutation.isPending}
          title="Xác nhận xóa phả ký"
          message="Bạn có chắc chắn muốn xóa toàn bộ phả ký của dòng họ? Hành động này không thể hoàn tác."
          items={phaKy ? [phaKy] : []}
        />
      )}
    </PageLayout>
  );
}
