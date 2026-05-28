"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPhaKyByDongHo, ILuocSuItem, IButTichItem, ITruyenThongItem } from "@/service/phaky.service";
import storage from "@/utils/storage";
import { MapPin } from "lucide-react";

const parseJson = <T,>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try { return JSON.parse(val) as T[]; } catch { return []; }
};

/* ── thin decorative rule ─────────────────────────────────── */
const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-0 my-8">
    <div className="flex-1 border-t-2 border-[#1a1a1a]" />
    <span className="mx-4 text-[10px] font-black tracking-[0.35em] uppercase text-[#8b0000] whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 border-t-2 border-[#1a1a1a]" />
  </div>
);

export default function PhaKyPage() {
  const [dongHoId, setDongHoId] = useState("");

  useEffect(() => {
    const user = storage.getUser();
    if (user?.dongHoId) setDongHoId(user.dongHoId);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["phaky-public", dongHoId],
    queryFn: () => getPhaKyByDongHo(dongHoId),
    enabled: !!dongHoId,
  });

  const phaKy = data?.data || null;
  const luocSu  = parseJson<ILuocSuItem>(phaKy?.luocSu);
  const butTich = parseJson<IButTichItem>(phaKy?.butTich);
  const truyenThong = parseJson<ITruyenThongItem>(phaKy?.truyenThong);

  /* ── loading ──────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="flex justify-center py-24">
      <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── empty state ──────────────────────────────────────────── */
  if (!phaKy) return (
    <div className="min-h-screen bg-[#faf8f0] flex items-center justify-center">
      <div className="text-center">
        <div className="border-t-2 border-b-2 border-[#1a1a1a] py-8 px-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8b5e3c] mb-3">Phả Ký Dòng Họ</p>
          <p className="font-serif text-2xl text-[#1a1a1a] italic">Chưa có phả ký</p>
          <p className="text-xs text-stone-400 mt-2">Vui lòng liên hệ quản trị viên để thêm thông tin.</p>
        </div>
      </div>
    </div>
  );

  const hasTuDuong  = phaKy.tuDuongDiaChi  || phaKy.tuDuongLinkMap  || phaKy.tuDuongAnh  || phaKy.tuDuongIframe;
  const hasToQuan   = phaKy.toQuanDiaChi   || phaKy.toQuanLinkMap   || phaKy.toQuanAnh   || phaKy.toQuanIframe;
  const hasViTo     = phaKy.viToAnh || phaKy.viToBiography || phaKy.viToHoTen;

  return (
    <div className="min-h-screen bg-[#faf8f0] font-serif text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-10">

        {/* ══════════════════════════════════════════════
            MASTHEAD
        ══════════════════════════════════════════════ */}
        <header className="mb-8">
          <div className="border-t-[4px] border-[#1a1a1a] pt-3">
            <div className="border-t border-[#1a1a1a] pt-5 pb-4 text-center">
              <p className="text-[9px] tracking-[0.5em] uppercase text-[#8b5e3c] mb-3 font-sans">
                Phả Ký Dòng Họ · Lịch Sử Vinh Quang
              </p>
              <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-black text-[#1a1a1a] tracking-[-0.02em] leading-[0.9] uppercase">
                {phaKy.tenDongHo || "Dòng Họ"}
              </h1>
              <div className="flex items-center justify-center gap-5 mt-5 text-[9px] tracking-[0.3em] text-stone-400 uppercase font-sans">
                <span>Ký Ức Tổ Tiên</span>
                <span className="text-[#d4af37] text-sm">◆</span>
                <span>Truyền Thống Ngàn Đời</span>
                <span className="text-[#d4af37] text-sm">◆</span>
                <span>Bút Tích Tiền Nhân</span>
              </div>
            </div>
            <div className="border-t border-[#1a1a1a]" />
          </div>
          <div className="border-b-[3px] border-[#1a1a1a]" />
        </header>

        {/* ══════════════════════════════════════════════
            VỊ TỔ ĐẦU TIÊN — lead article với float + drop cap
        ══════════════════════════════════════════════ */}
        {hasViTo && (
          <section className="mb-12">
            <SectionRule label="Vị Tổ Đầu Tiên" />

            {phaKy.viToHoTen && (
              <h2 className="font-serif text-3xl md:text-4xl font-black text-center text-[#1a1a1a] leading-tight mb-8">
                {phaKy.viToHoTen}
              </h2>
            )}

            {/* float image + drop-cap bio trong cùng 1 div để text ôm quanh ảnh */}
            <div>
              {phaKy.viToAnh && (
                <figure className="float-left mr-7 mb-3 w-36 sm:w-44 md:w-52 clear-left">
                  <div className="border-[5px] border-double border-[#8b5e3c] p-2 bg-[#fdf6e3] shadow-2xl">
                    <img
                      src={phaKy.viToAnh}
                      alt={phaKy.viToHoTen || "Vị tổ đầu tiên"}
                      className="w-full h-auto object-cover grayscale-[10%] sepia-[20%]"
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                  {phaKy.viToHoTen && (
                    <figcaption className="text-center text-[10px] italic text-[#5d4037] mt-2 tracking-wide leading-snug">
                      {phaKy.viToHoTen}
                    </figcaption>
                  )}
                </figure>
              )}

              {phaKy.viToBiography && (
                <p
                  className="text-[15px] leading-[1.95] text-justify text-[#1a1a1a] whitespace-pre-line
                    first-letter:float-left
                    first-letter:text-[5.5rem]
                    first-letter:leading-[0.78]
                    first-letter:font-bold
                    first-letter:text-[#8b0000]
                    first-letter:mr-[6px]
                    first-letter:mt-[6px]"
                >
                  {phaKy.viToBiography}
                </p>
              )}
              <div className="clear-both" />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            LƯỢC SỬ — dateline + story columns
        ══════════════════════════════════════════════ */}
        {luocSu.length > 0 && (
          <section className="mb-12">
            <SectionRule label="Lược Sử Dòng Họ" />
            <div className="divide-y divide-[#d4af37]/25">
              {luocSu.map((item, idx) => (
                <article key={idx} className="py-7">
                  {/* dateline */}
                  <p className="text-[10px] font-black tracking-[0.35em] text-[#8b0000] uppercase mb-1">
                    {item.thoiGian}
                  </p>
                  <div className="w-10 border-t border-[#d4af37] mb-4" />

                  {/* body: ảnh float-left + chữ ôm quanh + drop cap */}
                  <div>
                    {(item as any).hinhAnh && (
                      <img
                        src={(item as any).hinhAnh}
                        alt={item.thoiGian}
                        className="float-left mr-6 mb-2 w-36 md:w-44 h-36 md:h-44 object-cover border border-[#d4af37]/40 shadow-md"
                        onError={e => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <p
                      className="text-[15px] leading-[1.95] text-[#1a1a1a] text-justify
                        first-letter:float-left
                        first-letter:text-[5.5rem]
                        first-letter:leading-[0.78]
                        first-letter:font-bold
                        first-letter:text-[#8b0000]
                        first-letter:mr-[6px]
                        first-letter:mt-[4px]"
                    >
                      {item.suKien}
                    </p>
                    <div className="clear-both" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            BÚT TÍCH — pull-quote style
        ══════════════════════════════════════════════ */}
        {butTich.length > 0 && (
          <section className="mb-12">
            <SectionRule label="Bút Tích Tiền Nhân" />
            <div className="space-y-8">
              {butTich.map((item, idx) => (
                <blockquote key={idx} className={`flex gap-5 items-start ${idx % 2 === 1 ? "flex-row-reverse" : ""}`}>
                  {/* avatar / portrait */}
                  <div className="flex-shrink-0 text-center w-20 sm:w-24">
                    {(item as any).hinhAnh ? (
                      <div className="border-[3px] border-double border-[#8b5e3c] p-1 bg-[#fdf6e3] shadow">
                        <img
                          src={(item as any).hinhAnh}
                          alt={item.hoTen}
                          className="w-full h-24 object-cover grayscale-[10%] sepia-[15%]"
                          onError={e => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    ) : (
                      <div className="border-[3px] border-double border-[#8b5e3c] p-1 bg-[#fdf6e3] shadow w-full h-24 flex items-center justify-center">
                        <span className="text-4xl text-[#8b5e3c]/40 font-black font-serif">
                          {item.hoTen.charAt(0)}
                        </span>
                      </div>
                    )}
                    <p className="text-[10px] font-black tracking-wide text-[#5d4037] mt-2 uppercase leading-snug">
                      {item.hoTen}
                    </p>
                  </div>

                  {/* quote body */}
                  <div className="flex-1 border-l-4 border-[#d4af37] pl-5 py-1">
                    <span className="block font-serif text-5xl text-[#d4af37] leading-none mb-1 -ml-1">"</span>
                    <p className="text-[15px] leading-[1.85] italic text-[#2d2d2d] whitespace-pre-line">
                      {item.noiDung}
                    </p>
                    <span className="block font-serif text-5xl text-[#d4af37] leading-none text-right mt-1 -mr-1">"</span>
                  </div>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            TỪ ĐƯỜNG & TỔ QUÁN — info left · iframe right
        ══════════════════════════════════════════════ */}
        {(hasTuDuong || hasToQuan) && (
          <section className="mb-12">
            <SectionRule label="Từ Đường · Tổ Quán" />
            <div className="space-y-10">

              {hasTuDuong && (
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase text-[#8b0000] border-b border-[#1a1a1a] pb-1 mb-4">
                    Từ Đường
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-stretch">
                    {/* left: photo + address */}
                    <div className="md:w-2/5 flex-shrink-0 flex flex-col gap-3">
                      {phaKy.tuDuongAnh && (
                        <figure>
                          <div className="border border-[#d4af37]/40 shadow-lg overflow-hidden">
                            <img
                              src={phaKy.tuDuongAnh}
                              alt="Từ đường"
                              className="w-full h-44 object-cover grayscale-[5%] sepia-[10%]"
                              onError={e => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                          <figcaption className="text-[10px] italic text-stone-400 mt-1 text-center tracking-wide">
                            Từ Đường Dòng Họ
                          </figcaption>
                        </figure>
                      )}
                      {phaKy.tuDuongDiaChi && (
                        <p className="text-sm text-[#2d2d2d] leading-relaxed flex items-start gap-2">
                          <MapPin size={13} className="text-[#8b0000] mt-1 flex-shrink-0" />
                          {phaKy.tuDuongDiaChi}
                        </p>
                      )}
                    </div>
                    {/* right: google maps iframe */}
                    {phaKy.tuDuongIframe && (
                      <div className="flex-1 min-h-[280px]">
                        <iframe
                          src={phaKy.tuDuongIframe}
                          className="w-full h-full min-h-[280px] border border-[#d4af37]/40 shadow-lg"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Bản đồ từ đường"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasToQuan && (
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase text-[#8b0000] border-b border-[#1a1a1a] pb-1 mb-4">
                    Tổ Quán
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-stretch">
                    {/* left: photo + address */}
                    <div className="md:w-2/5 flex-shrink-0 flex flex-col gap-3">
                      {phaKy.toQuanAnh && (
                        <figure>
                          <div className="border border-[#d4af37]/40 shadow-lg overflow-hidden">
                            <img
                              src={phaKy.toQuanAnh}
                              alt="Tổ quán"
                              className="w-full h-44 object-cover grayscale-[5%] sepia-[10%]"
                              onError={e => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                          <figcaption className="text-[10px] italic text-stone-400 mt-1 text-center tracking-wide">
                            Tổ Quán Dòng Họ
                          </figcaption>
                        </figure>
                      )}
                      {phaKy.toQuanDiaChi && (
                        <p className="text-sm text-[#2d2d2d] leading-relaxed flex items-start gap-2">
                          <MapPin size={13} className="text-[#8b0000] mt-1 flex-shrink-0" />
                          {phaKy.toQuanDiaChi}
                        </p>
                      )}
                    </div>
                    {/* right: google maps iframe */}
                    {phaKy.toQuanIframe && (
                      <div className="flex-1 min-h-[280px]">
                        <iframe
                          src={phaKy.toQuanIframe}
                          className="w-full h-full min-h-[280px] border border-[#d4af37]/40 shadow-lg"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Bản đồ tổ quán"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            TRUYỀN THỐNG — magazine alternating layout
        ══════════════════════════════════════════════ */}
        {truyenThong.length > 0 && (
          <section className="mb-12">
            <SectionRule label="Truyền Thống Dòng Họ" />
            <div className="space-y-10">
              {truyenThong.map((item, idx) => {
                const even = idx % 2 === 0;
                return (
                  <div key={idx} className={`flex flex-col md:flex-row gap-7 items-start ${even ? "" : "md:flex-row-reverse"}`}>
                    {item.hinhAnh && (
                      <div className="md:w-2/5 flex-shrink-0">
                        <div className="border border-[#d4af37]/40 shadow-lg overflow-hidden">
                          <img
                            src={item.hinhAnh}
                            alt={`Truyền thống ${idx + 1}`}
                            className="w-full h-52 object-cover grayscale-[5%] sepia-[10%]"
                            onError={e => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      </div>
                    )}
                    <div className={`flex-1 ${!item.hinhAnh ? "md:col-span-2" : ""} ${even && item.hinhAnh ? "md:border-l md:border-[#d4af37]/30 md:pl-7" : ""} ${!even && item.hinhAnh ? "md:border-r md:border-[#d4af37]/30 md:pr-7" : ""}`}>
                      <p className="text-[15px] leading-[1.9] text-[#1a1a1a] whitespace-pre-line text-justify">
                        {item.noiDung}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            COLOPHON
        ══════════════════════════════════════════════ */}
        <footer className="mt-16 border-t-2 border-[#1a1a1a] pt-4 text-center">
          <p className="text-[9px] tracking-[0.5em] uppercase text-stone-400 font-sans">
            Phả Ký Dòng Họ {phaKy.tenDongHo || ""} · Lưu truyền muôn đời
          </p>
          <div className="flex justify-center mt-3 gap-2 text-[#d4af37]">
            <span className="text-sm">◆</span>
            <span className="text-lg">◈</span>
            <span className="text-sm">◆</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
