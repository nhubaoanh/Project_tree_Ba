"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTinTucById, ITinTuc } from "@/service/tintuc.service";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<ITinTuc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (params.id) {
        try {
          const response = await getTinTucById(params.id as string);
          if (response.success) {
            setNews(response.data);
          }
        } catch (error) {
          console.error("Error fetching news:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchNews();
  }, [params.id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e3]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf6e3] p-4">
        <p className="text-xl text-stone-600 mb-4">Không tìm thấy tin tức</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-[#b91c1c] text-white rounded-lg hover:bg-[#991b1b] transition-colors"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6e3]">
      {/* Header với nút quay lại */}
      <div className="sticky top-0 z-10 bg-[#b91c1c] shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Quay lại</span>
          </button>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Ảnh đại diện */}
        {news.anhDaiDien && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#d4af37]">
            <img
              src={news.anhDaiDien}
              alt={news.tieuDe}
              className="w-full h-auto max-h-[500px] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/xumvay.jpg';
              }}
            />
          </div>
        )}

        {/* Tiêu đề */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#8b0000] mb-6 leading-tight">
          {news.tieuDe}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8b5e3c] mb-8 pb-6 border-b-2 border-[#d4af37]/30">
          {news.ngayDang && (
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(news.ngayDang)}</span>
            </div>
          )}
          {news.tacGia && (
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{news.tacGia}</span>
            </div>
          )}
          {news.luotXem !== undefined && (
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{news.luotXem} lượt xem</span>
            </div>
          )}
        </div>

        {/* Tóm tắt */}
        {news.tomTat && (
          <div className="bg-[#f5e6c8]/50 border-l-4 border-[#d4af37] p-6 rounded-r-lg mb-8">
            <p className="text-lg text-[#5d4037] italic leading-relaxed">
              {news.tomTat}
            </p>
          </div>
        )}

        {/* Nội dung chính */}
        <div 
          className="prose prose-lg prose-stone max-w-none text-[#2d2d2d] leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: news.noiDung || "" }}
        />

        {/* Họa tiết chân trang */}
        <div className="mt-16 flex justify-center opacity-60">
          <svg className="w-64 h-12" viewBox="0 0 256 48" fill="none">
            <path
              d="M 8 24 L 64 24 M 72 24 Q 88 16 104 24 Q 120 32 128 24 Q 136 16 152 24 Q 168 32 184 24 M 192 24 L 248 24"
              stroke="#c9a961"
              strokeWidth="2"
            />
            <circle cx="128" cy="24" r="6" fill="#c9a961" />
          </svg>
        </div>

        {/* Nút quay lại ở cuối */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-8 py-3 bg-[#b91c1c] text-white rounded-lg hover:bg-[#991b1b] transition-colors shadow-lg font-semibold"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách tin tức
          </button>
        </div>
      </article>
    </div>
  );
}
