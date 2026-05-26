"use client";

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, ChevronDown, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchEvent } from "@/service/event.service";
import { IsearchEvent } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import storage from "@/utils/storage";
import { IEvent } from "@/types/event";

export const SuKienPage: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [dongHoId, setDongHoId] = useState<string>("");

  // Lấy dongHoId từ user đã đăng nhập
  useEffect(() => {
    const user = storage.getUser();
    if (user?.dongHoId) {
      setDongHoId(user.dongHoId);
    }
  }, []);

  const searchParams: IsearchEvent = {
    pageIndex: 1,
    pageSize: 100,
    dongHoId: dongHoId,
  };

  const eventQuery = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => searchEvent(searchParams),
    enabled: !!dongHoId,
  });

  // Sắp xếp sự kiện: Sắp diễn ra lên đầu (gần nhất trước), sau đó đến đã kết thúc (mới nhất trước)
  const sortedEvents = React.useMemo(
    () => {
      const events = (eventQuery.data?.data || []) as IEvent[];
      const now = new Date();
      
      return [...events].sort((a, b) => {
        // Parse ngày giờ đúng cách
        const dateA = new Date(a.ngayDienRa);
        const [hoursA, minutesA] = (a.gioDienRa || "00:00:00").split(":").map(Number);
        dateA.setHours(hoursA, minutesA, 0, 0);
        
        const dateB = new Date(b.ngayDienRa);
        const [hoursB, minutesB] = (b.gioDienRa || "00:00:00").split(":").map(Number);
        dateB.setHours(hoursB, minutesB, 0, 0);
        
        const nowTime = now.getTime();
        const isAUpcoming = dateA.getTime() >= nowTime;
        const isBUpcoming = dateB.getTime() >= nowTime;
        
        // Sự kiện sắp diễn ra lên đầu
        if (isAUpcoming && !isBUpcoming) return -1;
        if (!isAUpcoming && isBUpcoming) return 1;
        
        // Cùng trạng thái thì sắp xếp theo thời gian
        if (isAUpcoming) {
          return dateA.getTime() - dateB.getTime(); // Sắp diễn ra: gần nhất lên đầu
        } else {
          return dateB.getTime() - dateA.getTime(); // Đã kết thúc: mới nhất lên đầu
        }
      });
    },
    [eventQuery.data?.data]
  );

  // Chỉ hiển thị số lượng sự kiện theo visibleCount
  const displayedEvents = sortedEvents.slice(0, visibleCount);

  // Hàm tải thêm sự kiện
  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, sortedEvents.length));
  };

  // Hàm cuộn lên đầu trang và thu lại về 3 sự kiện
  const scrollToTop = () => {
    setVisibleCount(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Kiểm tra sự kiện đã kết thúc hay chưa (dựa vào ngày và giờ diễn ra)
  const isEventCompleted = (event: IEvent) => {
    const eventDate = new Date(event.ngayDienRa);
    const [hours, minutes] = (event.gioDienRa || "00:00:00").split(":").map(Number);
    eventDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    return eventDate.getTime() < now.getTime();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tiêu đề trang */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#b91c1c] mb-2">
          Bảng Tin Dòng Họ
        </h1>
        <p className="text-[#8b5e3c] mb-6">
          Cập nhật thông tin mới nhất về dòng họ
        </p>
      </div>

      {/* Danh sách sự kiện */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!dongHoId ? (
          // Hiển thị khi chưa có dongHoId
          <div className="col-span-full text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Chưa xác định dòng họ</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vui lòng đăng nhập để xem sự kiện
            </p>
          </div>
        ) : eventQuery.isLoading ? (
          // Hiển thị skeleton khi đang tải
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden transition-all hover:shadow-lg">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </Card>
            ))
        ) : displayedEvents.length > 0 ? (
          // Hiển thị danh sách sự kiện
          displayedEvents.map((item) => (
            <Card
              key={item.suKienId}
              className="relative overflow-hidden group aspect-[2/3] min-h-[500px] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-[#d4af37]"
            >
              {/* Hình nền với opacity cao hơn */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/images/backgrouNotifi.png"
                  alt="Background"
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Nội dung */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                {/* Header với badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-2">
                    {item.uuTien === 0 && (
                      <Badge className="bg-[#d4af37] text-white w-fit shadow-md animate-pulse">
                        <span className="mr-1">⭐</span> Đã ghim
                      </Badge>
                    )}
                    {/* Badge trạng thái sự kiện */}
                    {isEventCompleted(item) ? (
                      <Badge className="bg-gray-500 text-white w-fit shadow-md">
                        ✓ Đã kết thúc
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white w-fit shadow-md animate-pulse">
                        ⏰ Sắp diễn ra
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Nội dung sự kiện */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#5d4037] font-serif italic leading-tight mb-6 group-hover:text-[#b91c1c] transition-colors">
                    {item.tenSuKien}
                  </h3>

                  {/* Thời gian và ngày tháng */}
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md border border-[#d4af37]/30">
                    <div className="flex items-center justify-center gap-2 text-sm text-[#5d4037] font-bold mb-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(item.ngayDienRa).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-[#b91c1c]">
                      {item.gioDienRa?.substring(0, 5) || "Chưa cập nhật"}
                    </div>
                  </div>

                  {/* Đường kẻ trang trí */}
                  <div className="my-4 flex justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#c9a961]" />
                      <div className="w-2 h-2 bg-[#c9a961] rotate-45" />
                      <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#c9a961]" />
                    </div>
                  </div>

                  {/* Mô tả */}
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed max-w-xs mx-auto mb-6 bg-white/40 backdrop-blur-sm rounded-lg p-3">
                    {item.moTa || "Không có mô tả"}
                  </p>

                  {/* Địa điểm */}
                  <div className="flex items-center justify-center gap-2 text-sm text-[#5d4037] bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                    <MapPin size={16} className="text-[#b91c1c]" />
                    <span className="font-medium">{item.diaDiem || "Chưa cập nhật địa điểm"}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-[#8b5e3c] italic">Người tạo</p>
                  <p className="text-sm font-bold text-[#5d4037] italic">
                    {item.full_name || "Không rõ"}
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Hiển thị khi không có sự kiện
          <div className="col-span-full text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Chưa có sự kiện nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Hãy quay lại sau để xem các sự kiện mới nhất
            </p>
          </div>
        )}
      </div>

      {/* Nút Xem thêm / Thu lại */}
      <div className="mt-12 text-center">
        {visibleCount < sortedEvents.length ? (
          // Nút Xem thêm khi còn sự kiện
          <Button onClick={loadMore} className="px-8 py-6 text-base">
            Xem thêm 3 sự kiện
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        ) : sortedEvents.length > 3 ? (
          // Nút Thu lại khi đã xem hết sự kiện
          <Button
            variant="outline"
            onClick={scrollToTop}
            className="px-6 py-4 text-base"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Thu lại và quay về đầu
          </Button>
        ) : null}

        {/* Hiển thị số lượng sự kiện - với background để không bị che */}
        {sortedEvents.length > 0 && (
          <div className="relative z-20 mt-4">
            <p className="inline-block px-4 py-2 text-sm text-muted-foreground bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
              Đang hiển thị {Math.min(visibleCount, sortedEvents.length)} trong tổng số{" "}
              {sortedEvents.length} sự kiện
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuKienPage;