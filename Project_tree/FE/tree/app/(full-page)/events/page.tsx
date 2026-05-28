"use client";

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, ChevronDown, ArrowUp, Star, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchEvent } from "@/service/event.service";
import { IsearchEvent, IEvent } from "@/types/event";
import { Skeleton } from "@/components/ui/skeleton";
import storage from "@/utils/storage";
import { DecoFrame } from "@/components/ui/DecoFrame";

// ── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; sectionClass: string }> = {
  TIN_VUI:  { label: "Tin Vui",   sectionClass: "text-rose-700 border-rose-400" },
  TIN_BUON: { label: "Tin Buồn",  sectionClass: "text-slate-600 border-slate-400" },
  SU_KIEN:  { label: "Sự Kiện",   sectionClass: "text-amber-700 border-amber-400" },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] ?? { label: type, sectionClass: "text-[#b91c1c] border-[#b91c1c]" };

const formatDateLong = (d: string | Date) =>
  new Date(d).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatDateShort = (d: string | Date) =>
  new Date(d).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel = ({ type }: { type: string }) => {
  const tc = getTypeConfig(type);
  return (
    <span
      className={`text-[11px] font-bold uppercase tracking-[0.15em] border-b pb-0.5 pr-3 mb-2 inline-block ${tc.sectionClass}`}
    >
      {tc.label}
    </span>
  );
};

const PinnedBadge = () => (
  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-[#d4af37] mb-2">
    <Star size={11} fill="currentColor" />
    Tin ghim
  </div>
);

const Dateline = ({ event, short = false }: { event: IEvent; short?: boolean }) => (
  <div
    className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-[#c9a961]/40 py-1.5 my-3 ${
      short ? "text-[11px]" : "text-sm"
    } text-[#5d4037]`}
  >
    <span className="flex items-center gap-1.5">
      <Calendar size={short ? 11 : 13} />
      {short ? formatDateShort(event.ngayDienRa) : formatDateLong(event.ngayDienRa)}
      {event.gioDienRa && ` — ${event.gioDienRa.substring(0, 5)}`}
    </span>
    {event.diaDiem && (
      <span className="flex items-center gap-1.5">
        <MapPin size={short ? 11 : 13} />
        {event.diaDiem}
      </span>
    )}
  </div>
);

const Byline = ({ name, small = false }: { name: string; small?: boolean }) => (
  <p
    className={`${small ? "text-[11px]" : "text-sm"} text-[#8b5e3c] italic mt-auto pt-3 border-t border-[#c9a961]/30`}
  >
    Bởi: <span className="font-semibold not-italic">{name || "Không rõ"}</span>
  </p>
);

// ── Event public detail modal ─────────────────────────────────────────────────

const EventPublicDetailModal = ({
  event,
  onClose,
}: {
  event: IEvent;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[20] w-7 h-7 flex items-center justify-center border border-[#c9a961] text-[#5d4037] bg-[#f7f3e3] hover:bg-[#5d4037] hover:text-[#ede5b7] transition-colors"
          aria-label="Đóng"
        >
          <X size={14} />
        </button>
        <DecoFrame className="bg-[#f7f3e3]">
          {event.anhUrl && (
            <div className="overflow-hidden" style={{ maxHeight: "260px" }}>
              <img
                src={event.anhUrl}
                alt={event.tenSuKien}
                className="w-full object-cover"
                style={{ maxHeight: "260px" }}
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />
            </div>
          )}
          <div className="p-6 md:p-8 flex flex-col">
            {event.uuTien === 0 && <PinnedBadge />}
            <SectionLabel type={event.tenLoaiSuKien} />
            <h2 className="text-2xl md:text-3xl font-bold text-[#5d4037] leading-tight mt-2 italic">
              {event.tenSuKien}
            </h2>
            <Dateline event={event} />
            <p className="text-base text-[#5d4037] leading-relaxed whitespace-pre-wrap">
              {event.moTa || "Không có mô tả"}
            </p>
            <Byline name={event.full_name} />
          </div>
        </DecoFrame>
      </div>
    </div>
  );
};

// ── Featured article (large, 2/3 width) ──────────────────────────────────────

const FeaturedArticle = ({ event, onClick }: { event: IEvent; onClick: () => void }) => (
  <article className="flex flex-col flex-1 bg-[#f7f3e3] p-3 cursor-pointer" onClick={onClick}>
    {event.anhUrl && (
      <div className="overflow-hidden" style={{ maxHeight: "220px" }}>
        <img
          src={event.anhUrl}
          alt={event.tenSuKien}
          className="w-full object-cover"
          style={{ maxHeight: "220px" }}
          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
        />
      </div>
    )}
    <div className="p-6 md:p-8 flex flex-col flex-1">
      {event.uuTien === 0 && <PinnedBadge />}
      <SectionLabel type={event.tenLoaiSuKien} />
      <h2 className="text-3xl md:text-4xl font-bold text-[#5d4037] leading-tight mt-1 italic">
        {event.tenSuKien}
      </h2>
      <Dateline event={event} />
      <p className="text-base text-[#5d4037] leading-relaxed whitespace-pre-wrap flex-1">
        {event.moTa || "Không có mô tả"}
      </p>
      <Byline name={event.full_name} />
    </div>
  </article>
);

// ── Small article card ────────────────────────────────────────────────────────

const SmallArticle = ({ event, onClick }: { event: IEvent; onClick: () => void }) => (
  <article className="p-4 md:p-5 flex flex-col flex-1 bg-[#f7f3e3] cursor-pointer" onClick={onClick}>
    {event.uuTien === 0 && <PinnedBadge />}
    <SectionLabel type={event.tenLoaiSuKien} />
    <h3 className="text-lg font-bold text-[#5d4037] leading-snug mt-1 italic">
      {event.tenSuKien}
    </h3>
    <Dateline event={event} short />
    <p className="text-sm text-[#5d4037] leading-relaxed line-clamp-4 flex-1">
      {event.moTa || "Không có mô tả"}
    </p>
    <Byline name={event.full_name} small />
  </article>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

const NewsLoadingSkeleton = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#c9a961]/50">
      <div className="md:col-span-2 border-b border-r border-[#c9a961]/50 p-8 space-y-4">
        <Skeleton className="h-3 w-20 bg-[#c9a961]/30" />
        <Skeleton className="h-9 w-full bg-[#c9a961]/30" />
        <Skeleton className="h-9 w-4/5 bg-[#c9a961]/30" />
        <Skeleton className="h-4 w-full bg-[#c9a961]/30" />
        <Skeleton className="h-4 w-5/6 bg-[#c9a961]/30" />
        <Skeleton className="h-4 w-3/4 bg-[#c9a961]/30" />
      </div>
      <div className="flex flex-col">
        {[0, 1].map((i) => (
          <div key={i} className="border-b border-r border-[#c9a961]/50 p-5 flex-1 space-y-3">
            <Skeleton className="h-3 w-14 bg-[#c9a961]/30" />
            <Skeleton className="h-5 w-full bg-[#c9a961]/30" />
            <Skeleton className="h-5 w-3/4 bg-[#c9a961]/30" />
            <Skeleton className="h-3 w-2/3 bg-[#c9a961]/30" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ title, desc }: { title: string; desc: string }) => (
  <div className="text-center py-20 border border-[#c9a961]/40 bg-[#f7f3e3]">
    <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-[#d4af37] text-[#d4af37] mb-4">
      <Calendar size={30} />
    </div>
    <h3 className="text-xl font-bold text-[#5d4037]">{title}</h3>
    <p className="mt-2 text-sm text-[#8b5e3c]">{desc}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 7;

export const SuKienPage: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [dongHoId, setDongHoId] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  useEffect(() => {
    const user = storage.getUser();
    if (user?.dongHoId) setDongHoId(user.dongHoId);
  }, []);

  const searchParams: IsearchEvent = { pageIndex: 1, pageSize: 100, dongHoId };

  const eventQuery = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => searchEvent(searchParams),
    enabled: !!dongHoId,
  });

  const allEvents = (eventQuery.data?.data || []) as IEvent[];

  const eventTypes = React.useMemo(() => {
    const types = new Set(allEvents.map((e) => e.tenLoaiSuKien));
    return Array.from(types);
  }, [allEvents]);

  const sortedEvents = React.useMemo(
    () =>
      [...allEvents]
        .filter((e) => selectedType === "ALL" || e.tenLoaiSuKien === selectedType)
        .sort(
          (a, b) =>
            new Date(String(b.ngayDienRa) + "T" + b.gioDienRa).getTime() -
            new Date(String(a.ngayDienRa) + "T" + a.gioDienRa).getTime()
        ),
    [allEvents, selectedType]
  );

  const displayedEvents = sortedEvents.slice(0, visibleCount);
  const [featuredEvent, ...rest] = displayedEvents;
  const sideEvents = rest.slice(0, 2);
  const laterEvents = rest.slice(2);

  const loadMore = () => setVisibleCount((p) => Math.min(p + 3, sortedEvents.length));
  const scrollToTop = () => {
    setVisibleCount(INITIAL_VISIBLE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const getCount = (type: string) =>
    type === "ALL"
      ? allEvents.length
      : allEvents.filter((e) => e.tenLoaiSuKien === type).length;

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-[#ede5b7]">
      {/* ── Masthead ── */}
      <div className="border-b-[1px] border-[#5d4037] pt-6 pb-4 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="text-center">
          {/* Red rule + label */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-[2px] bg-[#b91c1c]" />
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#b91c1c] whitespace-nowrap">
              Dòng Họ Việt Nam
            </span>
            <div className="flex-1 h-[2px] bg-[#b91c1c]" />
          </div>

          {/* Main title */}
          <h1 className="text-5xl md:text-6xl font-bold text-[#b91c1c] tracking-tight leading-none mb-2">
            Bảng Tin Dòng Họ
          </h1>

          {/* Sub-rule + tagline */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[#5d4037]" />
            <span className="text-xs text-[#5d4037] tracking-wider whitespace-nowrap">
              Cập nhật thông tin mới nhất về dòng họ
            </span>
            <div className="flex-1 h-px bg-[#5d4037]" />
          </div>

          {/* Date line */}
          <p className="text-xs uppercase tracking-widest text-[#8b5e3c]">{todayStr}</p>
        </div>
      </div>

      {/* ── Category tabs ── */}
      {dongHoId && eventTypes.length > 0 && (
        <div className="border-b-1 border-[#5d4037] bg-[#ede5b7]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 flex items-center">
            {(["ALL", ...eventTypes] as string[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setVisibleCount(INITIAL_VISIBLE);
                }}
                className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-[3px] -mb-[2px] ${
                  selectedType === type
                    ? "border-[#b91c1c] text-[#b91c1c] bg-[#ede5b7]"
                    : "border-transparent text-[#5d4037] hover:text-[#b91c1c]"
                }`}
              >
                {type === "ALL" ? "Tất cả" : getTypeConfig(type).label}
                <span className="ml-1.5 text-xs font-normal opacity-60">
                  ({getCount(type)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {!dongHoId ? (
          <EmptyState
            title="Chưa xác định dòng họ"
            desc="Vui lòng đăng nhập để xem sự kiện"
          />
        ) : eventQuery.isLoading ? (
          <NewsLoadingSkeleton />
        ) : sortedEvents.length === 0 ? (
          <EmptyState
            title="Chưa có sự kiện nào"
            desc="Hãy quay lại sau để xem các sự kiện mới nhất"
          />
        ) : (
          <>
            {/* Top section: featured (2/3) + 2 side articles (1/3) */}
            {featuredEvent && (
              <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#c9a961]/60 mb-6">
                <div className="md:col-span-2 border-b border-r border-[#c9a961]/60 flex flex-col">
                  <DecoFrame className="flex-1">
                    <FeaturedArticle event={featuredEvent} onClick={() => setSelectedEvent(featuredEvent)} />
                  </DecoFrame>
                </div>
                <div className="flex flex-col">
                  {sideEvents.length > 0 ? (
                    sideEvents.map((event) => (
                      <div
                        key={event.suKienId}
                        className="border-b border-r border-[#c9a961]/60 flex-1 flex flex-col"
                      >
                        <DecoFrame className="flex-1">
                          <SmallArticle event={event} onClick={() => setSelectedEvent(event)} />
                        </DecoFrame>
                      </div>
                    ))
                  ) : (
                    <div className="border-b border-r border-[#c9a961]/60 flex-1 bg-[#ede5b7]" />
                  )}
                </div>
              </div>
            )}

            {/* Section divider */}
            {laterEvents.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-[#c9a961]/60" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b5e3c] whitespace-nowrap">
                    Các sự kiện khác
                  </span>
                  <div className="flex-1 h-px bg-[#c9a961]/60" />
                </div>

                {/* 3-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#c9a961]/60">
                  {laterEvents.map((event) => (
                    <div
                      key={event.suKienId}
                      className="border-b border-r border-[#c9a961]/60 flex flex-col"
                    >
                      <DecoFrame className="flex-1">
                        <SmallArticle event={event} onClick={() => setSelectedEvent(event)} />
                      </DecoFrame>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Load more / collapse ── */}
        {sortedEvents.length > 0 && (
          <div className="mt-10 text-center space-y-3">
            {visibleCount < sortedEvents.length ? (
              <button
                onClick={loadMore}
                className="px-10 py-2.5 border-2 border-[#5d4037] text-sm font-bold uppercase tracking-widest text-[#5d4037] hover:bg-[#5d4037] hover:text-[#ede5b7] transition-colors"
              >
                Xem thêm <ChevronDown className="inline ml-1" size={14} />
              </button>
            ) : sortedEvents.length > INITIAL_VISIBLE ? (
              <button
                onClick={scrollToTop}
                className="px-8 py-2.5 border border-[#8b5e3c] text-sm font-semibold text-[#8b5e3c] hover:bg-[#8b5e3c] hover:text-[#ede5b7] transition-colors"
              >
                <ArrowUp className="inline mr-1.5" size={14} />
                Thu lại và quay về đầu
              </button>
            ) : null}
            <p className="text-xs text-[#8b5e3c] tracking-wide">
              Đang hiển thị {Math.min(visibleCount, sortedEvents.length)} /{" "}
              {sortedEvents.length} sự kiện
            </p>
          </div>
        )}
      </div>
      {selectedEvent && (
        <EventPublicDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default SuKienPage;
