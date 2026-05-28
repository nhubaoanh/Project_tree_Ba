"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { IPhaKy, ILuocSuItem, IButTichItem, ITruyenThongItem } from "@/service/phaky.service";

interface PhaKyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IPhaKy>) => void;
  initialData: IPhaKy | null;
  isLoading: boolean;
  dongHoId: string;
}

const emptyLuocSu = (): ILuocSuItem => ({ thoiGian: "", suKien: "", hinhAnh: "" });
const emptyButTich = (): IButTichItem => ({ hoTen: "", noiDung: "", hinhAnh: "" });
const emptyTruyenThong = (): ITruyenThongItem => ({ hinhAnh: "", noiDung: "" });

const parseJson = <T,>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try { return JSON.parse(val) as T[]; } catch { return []; }
};

export function PhaKyModal({ isOpen, onClose, onSubmit, initialData, isLoading, dongHoId }: PhaKyModalProps) {
  const [activeTab, setActiveTab] = useState<"luocsu" | "buttich" | "vito" | "tudong" | "toquan" | "truyenthong">("luocsu");

  const [luocSu, setLuocSu] = useState<ILuocSuItem[]>([emptyLuocSu()]);
  const [butTich, setButTich] = useState<IButTichItem[]>([emptyButTich()]);
  const [truyenThong, setTruyenThong] = useState<ITruyenThongItem[]>([emptyTruyenThong()]);
  const [viToAnh, setViToAnh] = useState("");
  const [viToBiography, setViToBiography] = useState("");
  const [viToHoTen, setViToHoTen] = useState("");
  const [tuDuongDiaChi, setTuDuongDiaChi] = useState("");
  const [tuDuongLinkMap, setTuDuongLinkMap] = useState("");
  const [tuDuongAnh, setTuDuongAnh] = useState("");
  const [tuDuongIframe, setTuDuongIframe] = useState("");
  const [toQuanDiaChi, setToQuanDiaChi] = useState("");
  const [toQuanLinkMap, setToQuanLinkMap] = useState("");
  const [toQuanAnh, setToQuanAnh] = useState("");
  const [toQuanIframe, setToQuanIframe] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("luocsu");
      if (initialData) {
        const ls = parseJson<ILuocSuItem>(initialData.luocSu as any);
        const bt = parseJson<IButTichItem>(initialData.butTich as any);
        const tt = parseJson<ITruyenThongItem>(initialData.truyenThong as any);
        setLuocSu(ls.length ? ls : [emptyLuocSu()]);
        setButTich(bt.length ? bt : [emptyButTich()]);
        setTruyenThong(tt.length ? tt : [emptyTruyenThong()]);
        setViToAnh(initialData.viToAnh || "");
        setViToBiography(initialData.viToBiography || "");
        setViToHoTen(initialData.viToHoTen || "");
        setTuDuongDiaChi(initialData.tuDuongDiaChi || "");
        setTuDuongLinkMap(initialData.tuDuongLinkMap || "");
        setTuDuongAnh(initialData.tuDuongAnh || "");
        setTuDuongIframe(initialData.tuDuongIframe || "");
        setToQuanDiaChi(initialData.toQuanDiaChi || "");
        setToQuanLinkMap(initialData.toQuanLinkMap || "");
        setToQuanAnh(initialData.toQuanAnh || "");
        setToQuanIframe(initialData.toQuanIframe || "");
      } else {
        setLuocSu([emptyLuocSu()]); setButTich([emptyButTich()]); setTruyenThong([emptyTruyenThong()]);
        setViToAnh(""); setViToBiography(""); setViToHoTen("");
        setTuDuongDiaChi(""); setTuDuongLinkMap(""); setTuDuongAnh(""); setTuDuongIframe("");
        setToQuanDiaChi(""); setToQuanLinkMap(""); setToQuanAnh(""); setToQuanIframe("");
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      dongHoId,
      luocSu: luocSu.filter(i => i.thoiGian || i.suKien),
      butTich: butTich.filter(i => i.hoTen || i.noiDung),
      viToAnh: viToAnh || undefined,
      viToBiography: viToBiography || undefined,
      viToHoTen: viToHoTen || undefined,
      tuDuongDiaChi: tuDuongDiaChi || undefined,
      tuDuongLinkMap: tuDuongLinkMap || undefined,
      tuDuongAnh: tuDuongAnh || undefined,
      tuDuongIframe: tuDuongIframe || undefined,
      toQuanDiaChi: toQuanDiaChi || undefined,
      toQuanLinkMap: toQuanLinkMap || undefined,
      toQuanAnh: toQuanAnh || undefined,
      toQuanIframe: toQuanIframe || undefined,
      truyenThong: truyenThong.filter(i => i.noiDung),
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { key: "luocsu",      label: "📜 Lược Sử" },
    { key: "buttich",     label: "✍️ Bút Tích" },
    { key: "vito",        label: "👴 Vị Tổ" },
    { key: "tudong",      label: "🏛️ Từ Đường" },
    { key: "toquan",      label: "🏡 Tổ Quán" },
    { key: "truyenthong", label: "🎎 Truyền Thống" },
  ] as const;

  const inputCls = "w-full px-3 py-2 bg-white border border-[#d4af37]/50 rounded shadow-inner focus:outline-none focus:border-[#b91c1c] text-sm";
  const labelCls = "block text-sm font-bold text-[#8b5e3c] mb-1";

  const ImgPreview = ({ src }: { src: string }) =>
    src ? <img src={src} alt="preview" className="mt-2 h-24 object-contain rounded border border-[#d4af37]/30" onError={e => (e.currentTarget.style.display = "none")} /> : null;

  const updateLuocSu = (idx: number, patch: Partial<ILuocSuItem>) =>
    setLuocSu(ls => ls.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const updateButTich = (idx: number, patch: Partial<IButTichItem>) =>
    setButTich(bt => bt.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const updateTruyenThong = (idx: number, patch: Partial<ITruyenThongItem>) =>
    setTruyenThong(tt => tt.map((x, i) => i === idx ? { ...x, ...patch } : x));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#fffdf5] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-[#d4af37] flex flex-col">

        {/* Header */}
        <div className="bg-[#b91c1c] text-yellow-400 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold tracking-wider">
            {initialData ? "Chỉnh sửa Phả Ký" : "Thêm Phả Ký mới"}
          </h3>
          <button onClick={onClose} className="hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#d4af37]/30 bg-[#fdf6e3] overflow-x-auto flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "text-[#b91c1c] border-b-2 border-[#b91c1c] bg-white"
                  : "text-[#8b5e3c] hover:text-[#b91c1c]"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* LƯỢC SỬ */}
          {activeTab === "luocsu" && (
            <div className="space-y-4">
              <p className="text-xs text-[#8b5e3c] italic">Thêm các mốc thời gian quan trọng trong lịch sử dòng họ</p>
              {luocSu.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#fdf6e3] rounded-lg border border-[#d4af37]/20 space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Thời gian</label>
                        <input className={inputCls} placeholder="VD: Thế kỷ XVIII" value={item.thoiGian}
                          onChange={e => updateLuocSu(idx, { thoiGian: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Sự kiện</label>
                        <textarea className={inputCls} rows={2} placeholder="Mô tả sự kiện..." value={item.suKien}
                          onChange={e => updateLuocSu(idx, { suKien: e.target.value })} />
                      </div>
                    </div>
                    <button type="button" onClick={() => setLuocSu(ls => ls.filter((_, i) => i !== idx))}
                      className="mt-6 p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div>
                    <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL hình ảnh (tùy chọn)</label>
                    <input className={inputCls} placeholder="https://..." value={item.hinhAnh || ""}
                      onChange={e => updateLuocSu(idx, { hinhAnh: e.target.value })} />
                    <ImgPreview src={item.hinhAnh || ""} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setLuocSu(ls => [...ls, emptyLuocSu()])}
                className="flex items-center gap-1 px-3 py-2 text-sm text-[#b91c1c] border border-[#b91c1c] rounded hover:bg-[#b91c1c] hover:text-white transition-colors">
                <Plus size={14} /> Thêm mốc lịch sử
              </button>
            </div>
          )}

          {/* BÚT TÍCH */}
          {activeTab === "buttich" && (
            <div className="space-y-4">
              <p className="text-xs text-[#8b5e3c] italic">Ghi lại lời của các thành viên trong họ để lại cho con cháu</p>
              {butTich.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#fdf6e3] rounded-lg border border-[#d4af37]/20 space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
                        <input className={inputCls} placeholder="Tên thành viên" value={item.hoTen}
                          onChange={e => updateButTich(idx, { hoTen: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Nội dung để lại cho con cháu</label>
                        <textarea className={inputCls} rows={3} placeholder="Lời nhắn nhủ..." value={item.noiDung}
                          onChange={e => updateButTich(idx, { noiDung: e.target.value })} />
                      </div>
                    </div>
                    <button type="button" onClick={() => setButTich(bt => bt.filter((_, i) => i !== idx))}
                      className="mt-6 p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div>
                    <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL hình ảnh (tùy chọn)</label>
                    <input className={inputCls} placeholder="https://..." value={item.hinhAnh || ""}
                      onChange={e => updateButTich(idx, { hinhAnh: e.target.value })} />
                    <ImgPreview src={item.hinhAnh || ""} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setButTich(bt => [...bt, emptyButTich()])}
                className="flex items-center gap-1 px-3 py-2 text-sm text-[#b91c1c] border border-[#b91c1c] rounded hover:bg-[#b91c1c] hover:text-white transition-colors">
                <Plus size={14} /> Thêm bút tích
              </button>
            </div>
          )}

          {/* VỊ TỔ ĐẦU TIÊN */}
          {activeTab === "vito" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Họ và tên vị tổ</label>
                <input className={inputCls} placeholder="VD: Nguyễn Công Trứ" value={viToHoTen}
                  onChange={e => setViToHoTen(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL ảnh vị tổ</label>
                <input className={inputCls} placeholder="https://..." value={viToAnh}
                  onChange={e => setViToAnh(e.target.value)} />
                <ImgPreview src={viToAnh} />
              </div>
              <div>
                <label className={labelCls}>Tiểu sử</label>
                <textarea className={inputCls} rows={8} placeholder="Tiểu sử vị tổ đầu tiên..." value={viToBiography}
                  onChange={e => setViToBiography(e.target.value)} />
              </div>
            </div>
          )}

          {/* TỪ ĐƯỜNG */}
          {activeTab === "tudong" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Địa chỉ từ đường</label>
                <input className={inputCls} placeholder="Số nhà, đường, xã/phường, huyện/quận, tỉnh/thành"
                  value={tuDuongDiaChi} onChange={e => setTuDuongDiaChi(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Link Google Maps (để mở)</label>
                <input className={inputCls} placeholder="https://maps.google.com/..."
                  value={tuDuongLinkMap} onChange={e => setTuDuongLinkMap(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Iframe Google Maps (để nhúng bản đồ)</label>
                <p className="text-[11px] text-[#8b5e3c] italic mb-1">
                  Vào Google Maps → tìm địa điểm → Share → Embed a map → Copy HTML → lấy phần <code className="bg-[#fdf6e3] px-1 rounded">src="..."</code> trong thẻ &lt;iframe&gt;
                </p>
                <input className={inputCls} placeholder="https://www.google.com/maps/embed?pb=..."
                  value={tuDuongIframe} onChange={e => setTuDuongIframe(e.target.value)} />
                {tuDuongIframe && (
                  <div className="mt-2 border border-[#d4af37]/30 rounded overflow-hidden h-32">
                    <iframe src={tuDuongIframe} className="w-full h-full" loading="lazy" title="Preview từ đường" />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL ảnh từ đường</label>
                <input className={inputCls} placeholder="https://..." value={tuDuongAnh}
                  onChange={e => setTuDuongAnh(e.target.value)} />
                <ImgPreview src={tuDuongAnh} />
              </div>
            </div>
          )}

          {/* TỔ QUÁN */}
          {activeTab === "toquan" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Địa chỉ tổ quán</label>
                <input className={inputCls} placeholder="Số nhà, đường, xã/phường, huyện/quận, tỉnh/thành"
                  value={toQuanDiaChi} onChange={e => setToQuanDiaChi(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Link Google Maps (để mở)</label>
                <input className={inputCls} placeholder="https://maps.google.com/..."
                  value={toQuanLinkMap} onChange={e => setToQuanLinkMap(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Iframe Google Maps (để nhúng bản đồ)</label>
                <p className="text-[11px] text-[#8b5e3c] italic mb-1">
                  Vào Google Maps → tìm địa điểm → Share → Embed a map → Copy HTML → lấy phần <code className="bg-[#fdf6e3] px-1 rounded">src="..."</code> trong thẻ &lt;iframe&gt;
                </p>
                <input className={inputCls} placeholder="https://www.google.com/maps/embed?pb=..."
                  value={toQuanIframe} onChange={e => setToQuanIframe(e.target.value)} />
                {toQuanIframe && (
                  <div className="mt-2 border border-[#d4af37]/30 rounded overflow-hidden h-32">
                    <iframe src={toQuanIframe} className="w-full h-full" loading="lazy" title="Preview tổ quán" />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL ảnh tổ quán</label>
                <input className={inputCls} placeholder="https://..." value={toQuanAnh}
                  onChange={e => setToQuanAnh(e.target.value)} />
                <ImgPreview src={toQuanAnh} />
              </div>
            </div>
          )}

          {/* TRUYỀN THỐNG */}
          {activeTab === "truyenthong" && (
            <div className="space-y-4">
              <p className="text-xs text-[#8b5e3c] italic">Ghi lại truyền thống, phong tục tập quán của dòng họ</p>
              {truyenThong.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-[#fdf6e3] rounded-lg border border-[#d4af37]/20">
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className={labelCls}><ImageIcon size={12} className="inline mr-1" />URL hình ảnh (tùy chọn)</label>
                      <input className={inputCls} placeholder="https://..." value={item.hinhAnh || ""}
                        onChange={e => updateTruyenThong(idx, { hinhAnh: e.target.value })} />
                      <ImgPreview src={item.hinhAnh || ""} />
                    </div>
                    <div>
                      <label className={labelCls}>Nội dung <span className="text-red-500">*</span></label>
                      <textarea className={inputCls} rows={3} placeholder="Mô tả truyền thống..." value={item.noiDung}
                        onChange={e => updateTruyenThong(idx, { noiDung: e.target.value })} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setTruyenThong(tt => tt.filter((_, i) => i !== idx))}
                    className="mt-6 p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setTruyenThong(tt => [...tt, emptyTruyenThong()])}
                className="flex items-center gap-1 px-3 py-2 text-sm text-[#b91c1c] border border-[#b91c1c] rounded hover:bg-[#b91c1c] hover:text-white transition-colors">
                <Plus size={14} /> Thêm truyền thống
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-[#fdf6e3] border-t border-[#d4af37]/30 flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 py-2 text-[#5d4037] font-bold hover:text-[#b91c1c] transition-colors text-sm">
            Đóng
          </button>
          <button type="submit" onClick={handleSubmit} disabled={isLoading}
            className="px-6 py-2 bg-[#b91c1c] text-white font-bold rounded shadow hover:bg-[#991b1b] disabled:opacity-50 flex items-center gap-2 transition-colors text-sm">
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {isLoading ? "Đang lưu..." : initialData ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
