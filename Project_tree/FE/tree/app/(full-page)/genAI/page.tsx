"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Loader2, Info, Download } from "lucide-react";
import { askQuestion, checkAIHealth, getCollectedQuestions, exportDataset } from "@/service/aiQuery.service";
import { getDongHoById } from "@/service/dongho.service";
import storage from "@/utils/storage";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  sql?: string;
  confidence?: string;
  results?: any[];
}

export default function GenealogyChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: '🚀 Chào bạn! Tôi là AI tra cứu gia phả thông minh.\n\nHãy hỏi tôi về gia phả:\n- "Có bao nhiêu người trong gia phả?"\n- "Liệt kê tất cả thành viên"\n- "Tìm người tên Nguyễn Văn A"\n- "Có bao nhiêu người sinh năm 1990?"\n\n📊 Hệ thống đang thu thập câu hỏi để cải thiện AI!',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dongHoInfo, setDongHoInfo] = useState<any>(null);
  const [selectedDongHo, setSelectedDongHo] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Kiểm tra AI status
  useEffect(() => {
    const checkAI = async () => {
      try {
        const result = await checkAIHealth();
        setAiStatus(result.success ? "online" : "offline");
      } catch (error) {
        setAiStatus("offline");
      }
    };
    checkAI();
  }, []);

  // Load số lượng câu hỏi đã thu thập
  useEffect(() => {
    const loadQuestionCount = async () => {
      try {
        const result = await getCollectedQuestions();
        if (result.success && result.total) {
          setTotalQuestions(result.total);
        }
      } catch (error) {
        console.error("Lỗi load số câu hỏi:", error);
      }
    };
    loadQuestionCount();
  }, [messages]); // Reload sau mỗi câu hỏi mới

  // Load thông tin dòng họ của user hiện tại
  useEffect(() => {
    const loadUserDongHo = async () => {
      try {
        const user = storage.getUser();
        const userDongHoId = user?.dongHoId;

        if (userDongHoId) {
          setSelectedDongHo(userDongHoId);
          const res = await getDongHoById(userDongHoId);
          if (res.success && res.data) {
            setDongHoInfo(res.data);
            setMessages([{
              role: "model",
              text: `🚀 Chào bạn! Tôi là AI tra cứu gia phả dòng họ "${res.data.tenDongHo}".\n\nHãy hỏi tôi về gia phả:\n- "Có bao nhiêu người trong gia phả?"\n- "Liệt kê tất cả thành viên"\n- "Tìm người tên Nguyễn Văn A"\n\n📊 Hệ thống đang thu thập câu hỏi để cải thiện AI!`
            }]);
          }
        }
      } catch (error) {
        console.error("Lỗi load thông tin dòng họ:", error);
      }
    };
    loadUserDongHo();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!selectedDongHo) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Không tìm thấy thông tin dòng họ của bạn." },
      ]);
      return;
    }

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askQuestion(userMsg, selectedDongHo);

      if (response.success && response.sql) {
        // Format kết quả đẹp
        let resultText = `✅ Kết quả hỏi đáp:\n\n`;

        if (response.results && response.results.length > 0) {
          // Hiển thị kết quả
          const firstResult = response.results[0];
          const keys = Object.keys(firstResult);

          if (keys.length === 1 && typeof firstResult[keys[0]] === 'number') {
            // Trường hợp COUNT, SUM, AVG...
            resultText += `📊 Tổng số : ${firstResult[keys[0]]}\n\n`;
          } else {
            // Trường hợp nhiều cột
            response.results.forEach((row, idx) => {
              resultText += `${idx + 1}. `;
              keys.forEach(key => {
                resultText += `${key}: ${row[key]} | `;
              });
              resultText = resultText.slice(0, -3) + '\n';
            });
            resultText += `\n`;
          }

          resultText += `📈 Kết quả: ${response.total_rows}\n`;
        } else {
          resultText += `Không tìm thấy kết quả nào.\n\n`;
        }

        // resultText += `\n🔍 **SQL:** \`${response.sql}\`\n`;
        resultText += `Độ chính xác: ${response.confidence}%`;

        setMessages((prev) => [...prev, {
          role: "model",
          text: resultText,
          sql: response.sql,
          confidence: response.confidence,
          results: response.results
        }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: response.message || response.error || "Xin lỗi, tôi không thể trả lời lúc này." },
        ]);
      }
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: error.message || "Đã có lỗi xảy ra khi kết nối với máy chủ AI." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDataset = async () => {
    try {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "📦 Đang export dataset..." },
      ]);

      const result = await exportDataset();

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `✅ Export thành công!\n\n📊 Tổng: ${result.total_samples} câu hỏi\n📁 File: ${result.dataset_path}\n\n💡 Bạn có thể dùng file này để fine-tune model!`
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: `❌ Lỗi: ${result.message}` },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `❌ Lỗi: ${error.message}` },
      ]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col font-sans animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-4 border-b border-[#d4af37] flex items-center gap-3 shadow-sm rounded-t-lg">
        <div className="w-10 h-10 bg-gradient-to-br from-[#b91c1c] to-[#d4af37] rounded-full flex items-center justify-center text-white shadow">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[#5d4037] text-lg">
            Tra Cứu Gia Phả AI
          </h3>
          <p className="text-xxs text-green-600">
            {aiStatus === "online"
              ? "Sẵn sàng hỗ trợ"
              : aiStatus === "offline"
                ? "AI chưa khởi động"
                : "Đang kiểm tra..."}
          </p>
        </div>

        {/* Export Dataset Button */}
        {totalQuestions >= 10 && (
          <button
            onClick={handleExportDataset}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all shadow-md"
            title={`Export ${totalQuestions} câu hỏi để fine-tune`}
          >
            <Download size={16} />
            Export ({totalQuestions})
          </button>
        )}

        {/* Hiển thị tên dòng họ */}
        <div className="px-3 py-2 bg-gray-50 border border-[#d4af37]/50 rounded-lg text-xxs text-[#5d4037] font-medium">
          {dongHoInfo?.tenDongHo || "Đang tải..."}
        </div>

        {/* AI Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-[#d4af37]/50 rounded-lg">
          <span
            className={`w-2 h-2 rounded-full ${aiStatus === "online"
                ? "bg-green-500"
                : aiStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
          ></span>
          <span className="text-xxs text-[#5d4037] font-medium">
            {aiStatus === "online"
              ? "AI Online"
              : aiStatus === "offline"
                ? "AI Offline"
                : "Checking..."}
          </span>
        </div>

        <div
          className="text-stone-400 hover:text-[#b91c1c] cursor-pointer"
          title="AI tra cứu gia phả bằng SQL"
        >
          <Info size={20} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 text-xxs bg-[#fdfbf7] p-4 overflow-y-auto custom-scrollbar space-y-4 border-x border-[#d4af37]/30">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user"
                  ? "bg-stone-200 text-stone-600"
                  : "bg-[#fdf6e3] text-[#b91c1c] border border-[#d4af37]"
                }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === "user"
                  ? "bg-[#5d4037] text-white rounded-tr-none"
                  : "bg-white text-[#4a4a4a] border border-[#eaddcf] rounded-tl-none"
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fdf6e3] text-[#b91c1c] border border-[#d4af37] flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#eaddcf] flex items-center gap-2">
              <Loader2 className="animate-spin text-[#d4af37]" size={16} />
              <span className="text-xs text-stone-500">
                Đang phân tích câu hỏi và tạo SQL...
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Questions */}
      <div className="bg-[#fdfbf7] px-4 pb-2 border-x border-[#d4af37]/30">
        <div className="flex gap-2 flex-wrap">
          {[
            "Nguyễn Văn Quyết có bao nhiêu con?",
            "Liệt kê tất cả thành viên",
            "Có bao nhiêu người sinh là nông dân?",
            "cha của Nguyễn Văn Quyết là ai?",
            "Đời nào đông người nhất?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-3 py-1 text-xs bg-white border border-[#d4af37]/50 rounded-full text-[#5d4037] hover:bg-[#fdf6e3] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-[#d4af37] rounded-b-lg shadow-lg">
        <form onSubmit={handleSend} className="flex gap-2 text-xxs relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !selectedDongHo}
            placeholder={
              selectedDongHo
                ? "Hỏi về gia phả, ví dụ: Có bao nhiêu người trong gia phả?"
                : "Đang tải thông tin dòng họ..."
            }
            className="flex-1 text-xxs pl-4 pr-12 py-3 bg-[#f9f9f9] border border-[#d4af37]/30 rounded-full focus:outline-none focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !selectedDongHo}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#b91c1c] text-white rounded-full flex items-center justify-center hover:bg-[#991b1b] disabled:opacity-50 disabled:hover:bg-[#b91c1c] transition-colors shadow-md"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
