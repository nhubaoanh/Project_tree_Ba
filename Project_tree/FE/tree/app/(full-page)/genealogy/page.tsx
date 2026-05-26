"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/ui/HeaderSub";
import { MyFamilyTree } from "@/components/ui/tree";
import { ViewMode } from "@/types/familytree";
import { Users, MessageCircle, Copy, Download, Heart, MapPin, Phone, Mail } from "lucide-react";
import TinTucPage from "../news/page";
import PhaKyPage from "../pen/page";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMembersByDongHo } from "@/service/member.service";
import { ITreeNode } from "@/types/tree";
import { buildTree } from "@/utils/treeUtils";
import SuKienPage from "../events/page";
import storage from "@/utils/storage";
import { AIChatBox } from "@/components/shared/AIChatBox";

// Loading component
function GenealogyLoading() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#ede5b7] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      <p className="mt-4 text-[#8b5e3c]">Đang tải...</p>
    </div>
  );
}

// Donation Page Component
function DonationPage() {
  const [copied, setCopied] = useState("");

  const bankInfo = {
    bankName: "Ngân hàng Ngoại Thương Việt Nam",
    bankCode: "970431",
    accountName: "NHU BAO ANH",
    accountNumber: "0377666627",
    accountShort: "0377666627",
    swiftCode: "VIETVSSVXXX",
    description: "Quỹ gia đình - Quỹ từ thiện gia phả",
    totalRaised: "45,500,000",
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const downloadQRCode = async () => {
    try {
      const bankCode = bankInfo.bankCode;
      const accountNumber = bankInfo.accountNumber;

      const qrUrl = `https://api.vietqr.io/image/${bankCode}-${accountNumber.replace(
        /\s/g,
        ""
      )}-print.png?addInfo=${encodeURIComponent(
        bankInfo.description
      )}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = "qr-code-donation.png";
      link.click();
    } catch (error) {
      console.error("Error downloading QR:", error);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-[#ede5b7] via-[#f5efc8] to-[#ede5b7] p-4 md:p-8 will-change-auto">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-in-left {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        .animate-in-right {
          animation: slideInRight 0.4s ease-out forwards;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart size={40} className="text-[#b91c1c] animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-[#5d4037]">
              Quỹ Gia Đình
            </h1>
            <Heart size={40} className="text-[#b91c1c] animate-pulse" />
          </div>
          <p className="text-lg text-[#8b5e3c]">
            Đóng góp vào quỹ gia đình để hỗ trợ các hoạt động gia phả
          </p>
          <p className="text-sm text-[#d4af37] mt-2">
            💰 Tổng quỹ hiện tại: <span className="font-bold text-lg">{bankInfo.totalRaised} đ</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div 
            className="flex flex-col items-center justify-center animate-in-left"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl mb-6 hover:shadow-3xl transition-shadow duration-300 will-change-transform">
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-4 border-[#d4af37]">
                <img
                  src={`https://api.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber.replace(
                    /\s/g,
                    ""
                  )}-print.png?addInfo=${encodeURIComponent(
                    bankInfo.description
                  )}&accountName=${encodeURIComponent(bankInfo.accountName)}`}
                  alt="QR Code"
                  className="w-64 h-64 mx-auto"
                  onError={(e) => {
                    e.currentTarget.src = "/qr-code.svg";
                  }}
                />
              </div>
              <p className="text-center text-gray-600 text-sm mt-4">
                Quét mã QR bằng ứng dụng ngân hàng để chuyển tiền
              </p>
            </div>

            <button
              onClick={downloadQRCode}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold will-change-transform active:scale-95"
            >
              <Download size={20} />
              Tải QR Code
            </button>
          </div>

          {/* Bank Info Section */}
          <div 
            className="space-y-6 animate-in-right"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Card 1: Bank Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 will-change-transform">
              <h3 className="text-2xl font-bold text-[#5d4037] mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-[#b91c1c]" />
                Thông Tin Ngân Hàng
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#ede5b7] to-[#f5efc8] rounded-lg">
                  <span className="text-gray-600 font-semibold">Ngân Hàng:</span>
                  <span className="text-[#5d4037] font-bold">{bankInfo.bankName}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white border border-[#d4af37] rounded-lg">
                  <span className="text-gray-600 font-semibold">Mã Ngân Hàng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#5d4037]">
                      {bankInfo.bankCode}
                    </span>
                    <button
                      onClick={() => handleCopy(bankInfo.bankCode, "bankCode")}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-90 will-change-transform"
                    >
                      <Copy
                        size={16}
                        className={
                          copied === "bankCode"
                            ? "text-green-500"
                            : "text-[#b91c1c]"
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Account Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 will-change-transform">
              <h3 className="text-2xl font-bold text-[#5d4037] mb-6 flex items-center gap-2">
                <Phone size={24} className="text-[#b91c1c]" />
                Thông Tin Tài Khoản
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#ede5b7] to-[#f5efc8] rounded-lg">
                  <span className="text-gray-600 font-semibold">Chủ Tài Khoản:</span>
                  <span className="text-[#5d4037] font-bold uppercase">
                    {bankInfo.accountName}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                  <span className="text-gray-600 font-semibold">Số Tài Khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-green-700">
                      {bankInfo.accountShort}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(bankInfo.accountNumber, "account")
                      }
                      className="p-2 hover:bg-white rounded-lg transition-colors active:scale-90 will-change-transform"
                    >
                      <Copy
                        size={18}
                        className={
                          copied === "account"
                            ? "text-green-500"
                            : "text-green-600"
                        }
                      />
                    </button>
                  </div>
                </div>
                {copied === "account" && (
                  <p className="text-xs text-green-600 text-right">
                    ✓ Đã sao chép số tài khoản
                  </p>
                )}

                <div className="flex justify-between items-center p-3 bg-white border border-[#d4af37] rounded-lg">
                  <span className="text-gray-600 font-semibold">SWIFT Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#5d4037]">
                      {bankInfo.swiftCode}
                    </span>
                    <button
                      onClick={() => handleCopy(bankInfo.swiftCode, "swift")}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-90 will-change-transform"
                    >
                      <Copy
                        size={16}
                        className={
                          copied === "swift"
                            ? "text-green-500"
                            : "text-[#b91c1c]"
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Transfer Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 will-change-transform">
              <h3 className="text-2xl font-bold text-[#5d4037] mb-6 flex items-center gap-2">
                <Mail size={24} className="text-[#b91c1c]" />
                Nội Dung Chuyển Khoản
              </h3>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <p className="font-semibold text-blue-900 text-center text-lg">
                  {bankInfo.description}
                </p>
                <button
                  onClick={() =>
                    handleCopy(bankInfo.description, "description")
                  }
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 active:scale-95 will-change-transform"
                >
                  <Copy size={18} />
                  {copied === "description"
                    ? "Đã sao chép"
                    : "Sao chép nội dung"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div 
          className="mt-12 bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#b91c1c] animate-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <h3 className="text-2xl font-bold text-[#5d4037] mb-4 flex items-center gap-2">
            <Heart size={28} className="text-[#b91c1c]" />
            Lưu Ý Quan Trọng
          </h3>
          <ul className="space-y-3 text-[#8b5e3c]">
            <li className="flex items-start gap-3">
              <span className="text-[#b91c1c] font-bold mt-1">✓</span>
              <span>
                <strong>Quỹ gia đình</strong> được sử dụng để hỗ trợ các hoạt
                động gia phả, tổ chức sự kiện gia đình và phục vụ các thành viên
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#b91c1c] font-bold mt-1">✓</span>
              <span>
                <strong>Mọi khoản đóng góp</strong> đều được ghi nhận và công
                khai trên trang quản lý quỹ
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#b91c1c] font-bold mt-1">✓</span>
              <span>
                <strong>Quét mã QR</strong> hoặc chuyển khoản thủ công đều được
                chấp nhận
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#b91c1c] font-bold mt-1">✓</span>
              <span>
                Vui lòng <strong>ghi rõ tên</strong> trong nội dung chuyển khoản
                để dễ xác nhận
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#b91c1c] font-bold mt-1">✓</span>
              <span>
                Mọi thắc mắc về quỹ, vui lòng liên hệ với{" "}
                <strong>Thủ Đồ gia tộc</strong>
              </span>
            </li>
          </ul>
        </div>

        {/* Progress Bar */}
        <div 
          className="mt-12 bg-white rounded-2xl shadow-lg p-8 animate-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <h3 className="text-2xl font-bold text-[#5d4037] mb-6">
            Tiến Độ Quỹ Năm Nay
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#8b5e3c] font-semibold">
                  Mục tiêu: 100,000,000 đ
                </span>
                <span className="text-[#b91c1c] font-bold">45.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "45.5%" }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-[#8b5e3c] text-right">
              Đã quyên góp: {bankInfo.totalRaised} đ / 100,000,000 đ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function GenealogyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.PHA_KY);
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Lấy dongHoId từ URL
  const urlDongHoId = searchParams.get("dongHoId");
  const [selectedDongHoId, setSelectedDongHoId] = useState<string>("");
  
  // State để tránh hydration mismatch - chỉ set sau khi mount
  const [userDongHoId, setUserDongHoId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // Đọc user từ localStorage sau khi mount (client-side only)
  useEffect(() => {
    const user = storage.getUser();
    setUserDongHoId(user?.dongHoId);
    setMounted(true);
  }, []);

  // Set initial dongHoId - luôn dùng dongHoId của user
  useEffect(() => {
    if (!mounted) return;
    
    // Lấy từ URL hoặc từ user
    if (urlDongHoId) {
      setSelectedDongHoId(urlDongHoId);
    } else if (userDongHoId) {
      setSelectedDongHoId(userDongHoId);
    }
  }, [urlDongHoId, userDongHoId, mounted]);

  // Fetch members theo dongHoId đã chọn
  const membersQuery = useQuery({
    queryKey: ["member-tree", selectedDongHoId],
    queryFn: () => getMembersByDongHo(selectedDongHoId),
    placeholderData: keepPreviousData,
    enabled: !!selectedDongHoId,
  });

  // Đảm bảo data luôn là array và clean
  const rawData = membersQuery?.data?.data;
  const data = Array.isArray(rawData) ? rawData.filter(member => {
    // Lọc ra những member có dữ liệu hợp lệ
    if (!member || typeof member !== 'object') return false;
    if (!member.thanhVienId || typeof member.thanhVienId !== 'number' || Number.isNaN(member.thanhVienId)) return false;
    return true;
  }) : [];

  const treeData = useMemo<ITreeNode[]>(() => {
    if (!data || data.length === 0) return [];
    
    try {
      const result = buildTree(data);
      console.log('Tree data built successfully:', result.length, 'nodes');
      return result;
    } catch (error) {
      console.error('Error building tree:', error);
      console.error('Raw data:', data);
      return [];
    }
  }, [data]);

  // Không cần xử lý chọn dòng họ nữa

  // Handle toggle AI chat
  const handleToggleAIChat = () => {
    setShowAIChat(!showAIChat);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-stone-100 font-dancing overflow-hidden">
      {/* HEADER */}
      <div className="flex-none z-50 shadow-md relative">
        <Header activeView={activeView} onNavigate={setActiveView} />
      </div>

      {/* MAIN */}
      <main className="flex-1 relative w-full bg-stone-50 bg-[#ede5b7]">
        {/* CONTENT */}
        <div className="absolute inset-0 w-full h-full z-10 bg-[#ede5b7]">

          {activeView === ViewMode.PHA_KY && (
            <div className="w-full h-full overflow-y-auto p-4 md:p-8">
              <PhaKyPage />
            </div>
          )}
          {activeView === ViewMode.DIAGRAM && (
            <div className="w-full h-full overflow-hidden">
              {!selectedDongHoId ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8b5e3c]">
                  <Users size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">
                    Vui lòng chọn dòng họ để xem cây gia phả
                  </p>
                </div>
              ) : membersQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-[#8b5e3c]">Đang tải cây gia phả...</div>
                </div>
              ) : treeData.length > 0 ? (
                <MyFamilyTree 
                  data={treeData} 
                  dongHoId={selectedDongHoId}
                  queryClient={queryClient}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#8b5e3c]">
                  <Users size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">Dòng họ này chưa có thành viên nào</p>
                  <p className="text-sm mt-2">
                    Hãy thêm thành viên từ trang quản lý
                  </p>
                </div>
              )}
            </div>
          )}

          {activeView === ViewMode.NEWS && (
            <div className="w-full h-full overflow-y-auto mt-10">
              <TinTucPage />
            </div>
          )}

          {activeView === ViewMode.EVENT && (
            <div className="w-full h-full overflow-y-auto mt-10">
              <SuKienPage />
            </div>
          )}

          {activeView === ViewMode.Walet && (
            <DonationPage />
          )}
        </div>

        {/* Floating AI Chat Button */}
        {!showAIChat && (
          <button
            onClick={handleToggleAIChat}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group"
            title="Hỏi đáp AI về gia phả"
          >
            <MessageCircle size={28} className="group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </button>
        )}

        {/* AI Chat Box */}
        {showAIChat && selectedDongHoId && (
          <AIChatBox 
            onClose={() => setShowAIChat(false)} 
            dongHoId={selectedDongHoId}
          />
        )}
      </main>
    </div>
  );
}

// Main export with Suspense wrapper
export default function GenealogyPage() {
  return (
    <Suspense fallback={<GenealogyLoading />}>
      <GenealogyContent />
    </Suspense>
  );
}
