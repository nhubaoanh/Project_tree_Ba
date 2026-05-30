"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTinTucById, ITinTuc, searchTinTuc } from "@/service/tintuc.service";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import storage from "@/utils/storage";

function TinTucPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const newsId = searchParams.get("id");

  // Nếu có id trong query params, hiển thị chi tiết
  if (newsId) {
    return <NewsDetailView newsId={newsId} />;
  }

  // Nếu không có id, hiển thị danh sách
  return <NewsListView />;
}

export default function TinTucPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e3]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      </div>
    }>
      <TinTucPageContent />
    </Suspense>
  );
}

// Component hiển thị danh sách tin tức
function NewsListView() {
  const router = useRouter();
  const [dongHoId, setDongHoId] = useState<string>("");

  useEffect(() => {
    const user = storage.getUser();
    if (user?.dongHoId) {
      setDongHoId(user.dongHoId);
    }
  }, []);

  const tinTucQuery = useQuery({
    queryKey: ["tintuc-public", dongHoId],
    queryFn: () => searchTinTuc({ pageIndex: 1, pageSize: 20, dongHoId }),
    enabled: !!dongHoId,
  });

  const allNewsItems: ITinTuc[] = tinTucQuery.data?.data || [];
  
  // Tin ghim làm tin nổi bật
  const featuredNews = allNewsItems.find((item) => item.ghim === 1) || allNewsItems[0];
  // Các tin còn lại chia 2 cột
  const otherNews = allNewsItems.filter((item) => item.tinTucId !== featuredNews?.tinTucId);
  const leftColumnNews = otherNews.filter((_, i) => i % 2 === 0).slice(0, 4);
  const rightColumnNews = otherNews.filter((_, i) => i % 2 === 1).slice(0, 4);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // Component tin tức nhỏ dạng row
  const NewsRow = ({ item }: { item: ITinTuc }) => (
    <div
      onClick={() => router.push(`/news?id=${item.tinTucId}`)}
      className="flex gap-3 p-2 cursor-pointer hover:bg-[#f5e6c8]/50 rounded-lg transition-all duration-300 group"
    >
      <div className="w-24 h-16 flex-shrink-0 overflow-hidden rounded-md border border-[#d4af37]/30">
        <img
          src={item.anhDaiDien || "/images/xumvay.jpg"}
          alt={item.tieuDe}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[#8b0000] text-sm leading-tight mb-1 line-clamp-1 group-hover:underline">
          {item.tieuDe}
        </h4>
        <p className="text-xs text-[#5d4037] line-clamp-1 mb-1">
          {item.tomTat || item.noiDung?.substring(0, 50)}
        </p>
        <p className="text-xs text-[#8b5e3c] italic">
          Ngày tạo: {formatDate(item.ngayDang)}
        </p>
      </div>
    </div>
  );

  if (tinTucQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6e3]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 font-serif text-[#4a4a4a] bg-[#fdf6e3]">
      <div className="max-w-6xl mx-auto">
        {allNewsItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-500">Chưa có tin tức nào</p>
          </div>
        ) : (
          <>
            {/* Tin nổi bật */}
            {featuredNews && (
              <div 
                className="flex flex-col md:flex-row gap-6 mb-10 cursor-pointer group"
                onClick={() => router.push(`/news?id=${featuredNews.tinTucId}`)}
              >
                {/* Hình ảnh bên trái */}
                <div className="md:w-1/2 relative overflow-hidden rounded-xl border-2 border-[#d4af37]/50 shadow-lg">
                  <img
                    src={featuredNews.anhDaiDien || "/images/xumvay.jpg"}
                    alt={featuredNews.tieuDe}
                    className="w-full h-72 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <p className="absolute bottom-4 left-4 right-4 text-center text-[#5d4037] italic text-sm bg-white/80 py-2 px-4 rounded-lg">
                    {featuredNews.tomTat || "Hình ảnh con cháu sum vầy ngày tết"}
                  </p>
                </div>

                {/* Nội dung bên phải */}
                <div className="md:w-1/2 bg-[#f5e6c8]/50 rounded-xl p-6 border border-[#d4af37]/30">
                  <div className="prose prose-stone max-w-none">
                    <p className="text-[#2d2d2d] leading-relaxed text-justify first-letter:text-3xl first-letter:font-bold first-letter:text-[#8b0000] first-letter:mr-1">
                      {featuredNews.noiDung?.substring(0, 500) || "Nội dung tin tức..."}
                      {(featuredNews.noiDung?.length || 0) > 500 && "..."}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-[#d4af37]/30">
                      <h4 className="font-bold text-[#8b0000] mb-2">Ý nghĩa và giá trị:</h4>
                      <ul className="text-sm text-[#5d4037] space-y-1 list-disc list-inside">
                        <li>Đoàn tụ gia đình: Dịp để con cháu phương xa trở về với cội nguồn</li>
                        <li>Bày tỏ lòng thành kính: Con cháu dâng quà, chúc Tết ông bà, cha mẹ</li>
                        <li>Giữ gìn nét đẹp truyền thống: Các hoạt động như gói bánh chưng, trồng nêu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2 cột tin tức */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Cột trái - Các tin tức mới nhất */}
              <div>
                <h3 className="font-serif text-xl text-[#8b0000] mb-4 pb-2 border-b-2 border-[#d4af37]/50 italic">
                  Các tin tức mới nhất
                </h3>
                <div className="space-y-3">
                  {leftColumnNews.map((item) => (
                    <NewsRow key={item.tinTucId} item={item} />
                  ))}
                  {leftColumnNews.length === 0 && (
                    <p className="text-sm text-stone-500 italic">Chưa có tin tức</p>
                  )}
                </div>
              </div>

              {/* Cột phải - Xem thêm */}
              <div>
                <h3 className="font-serif text-xl text-[#8b0000] mb-4 pb-2 border-b-2 border-[#d4af37]/50 italic">
                  Xem thêm
                </h3>
                <div className="space-y-3">
                  {rightColumnNews.map((item) => (
                    <NewsRow key={item.tinTucId} item={item} />
                  ))}
                  {rightColumnNews.length === 0 && (
                    <p className="text-sm text-stone-500 italic">Chưa có tin tức</p>
                  )}
                </div>
              </div>
            </div>

            {/* Họa tiết chân trang */}
            <div className="mt-16 flex justify-center opacity-60">
              <svg className="w-64 h-12" viewBox="0 0 256 48" fill="none">
                <path d="M 8 24 L 64 24 M 72 24 Q 88 16 104 24 Q 120 32 128 24 Q 136 16 152 24 Q 168 32 184 24 M 192 24 L 248 24" stroke="#c9a961" strokeWidth="2" />
                <circle cx="128" cy="24" r="6" fill="#c9a961" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component hiển thị chi tiết tin tức
function NewsDetailView({ newsId }: { newsId: string }) {
  const router = useRouter();
  const [news, setNews] = useState<ITinTuc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await getTinTucById(newsId);
        if (response.success) {
          setNews(response.data);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [newsId]);

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
          onClick={() => router.push("/news")}
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
            onClick={() => router.push("/news")}
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
            onClick={() => router.push("/news")}
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
