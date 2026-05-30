"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  MessageCircle,
  Minimize2,
  Database,
  User,
  Calendar,
} from "lucide-react";
import { queryText2SQL } from "@/service/text2sql.service";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  sql?: string;
  result?: any;
  timestamp: Date;
}

interface AIChatBoxProps {
  onClose: () => void;
  dongHoId: string;
}

const QUICK_QUESTIONS = [
  "Có bao nhiêu người trong gia phả?",
  "Gia phả có bao nhiêu nam giới?",
];

export function AIChatBox({ onClose, dongHoId }: AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: "Xin chào! Tôi có thể giúp bạn tìm hiểu về gia phả. Hãy hỏi tôi bất cứ điều gì!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [showSqlMap, setShowSqlMap] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setShowQuickQuestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await queryText2SQL(input, dongHoId);
      if (response.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: response.data.result.message,
          sql: response.data.sql,
          result: response.data.result,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: `Xin lỗi, có lỗi xảy ra: ${error.message || "Không thể kết nối đến server"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setShowQuickQuestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSql = (messageId: string) => {
    setShowSqlMap((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const renderResult = (result: any, messageId: string, sql?: string) => {
    if (!result) return null;

    return (
      <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {result.type === "count" && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl border border-blue-200/60 shadow-inner flex flex-col items-center justify-center">
            <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm tracking-tight animate-bounce-short">
              {result.value}
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-indigo-500 mt-1">
              thành viên
            </div>
          </div>
        )}

        {result.type === "list" && result.data && result.data.length > 0 && (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {result.data.slice(0, 10).map((row: any, idx: number) => {
              let gioiTinhText = row.gioiTinh;
              if (row.gioiTinh === 1 || row.gioiTinh === "1")
                gioiTinhText = "Nam";
              if (row.gioiTinh === 0 || row.gioiTinh === "0")
                gioiTinhText = "Nữ";

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-3 relative overflow-hidden group hover:border-red-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 text-sm md:text-base truncate flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {row.hoTen || "Chưa cập nhật"}
                      </h4>
                      {row.doiThuoc && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Đời {row.doiThuoc}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-semibold text-slate-500">
                      <div>
                        Giới tính:{" "}
                        <span
                          className={`${gioiTinhText === "Nam" ? "text-blue-600" : gioiTinhText === "Nữ" ? "text-pink-600" : "text-slate-600"}`}
                        >
                          {gioiTinhText || "-"}
                        </span>
                      </div>
                      {row.ngaySinh && (
                        <div className="flex items-center gap-1 truncate">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Sinh: {row.ngaySinh}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {result.data.length > 10 && (
              <div className="text-center text-xs font-bold text-slate-400 py-1 bg-slate-50 rounded-lg">
                Hiển thị 10/{result.data.length} kết quả phù hợp
              </div>
            )}
          </div>
        )}

        {result.type === "empty" && (
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/70 text-center text-sm text-amber-700 font-medium shadow-sm">
            🔍 Không tìm thấy kết quả nào phù hợp
          </div>
        )}

        {sql && (
          <div className="mt-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => toggleSql(messageId)}
              className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                showSqlMap[messageId]
                  ? "bg-slate-100 text-slate-700"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Database
                size={12}
                className={showSqlMap[messageId] ? "text-indigo-500" : ""}
              />
              {showSqlMap[messageId] ? "Ẩn câu lệnh SQL" : "Xem câu lệnh SQL"}
            </button>
            {showSqlMap[messageId] && (
              <div className="mt-1.5 p-2.5 bg-slate-900 rounded-xl text-[11px] font-mono text-emerald-400 shadow-inner overflow-x-auto border border-slate-800 leading-relaxed max-w-full">
                <code className="block whitespace-pre-wrap">{sql}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white px-5 py-3.5 rounded-full shadow-xl hover:shadow-red-200 shadow-red-900/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 border border-red-500/30"
        >
          <div className="relative">
            <MessageCircle size={20} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <span className="font-bold tracking-wide text-sm">Trợ lý AI</span>
          {messages.length > 1 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold shadow-sm">
              {messages.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl shadow-red-900/10 flex flex-col overflow-hidden border border-red-200/80 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white p-4 flex items-center justify-between shadow-md border-b border-red-700/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-sm shadow-inner">
            <Sparkles size={20} className="text-amber-300 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-1">
              AI Tộc Phả{" "}
              <span className="text-[10px] bg-amber-400 text-red-900 px-1 py-0.2 rounded font-mono">
                BETA
              </span>
            </h3>
            <p className="text-[11px] text-red-100 font-medium opacity-90">
              Tra cứu thông tin thông minh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-red-100 hover:text-white"
            title="Thu nhỏ"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-red-100 hover:text-white"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-in fade-in-50 slide-in-from-bottom-1 duration-200`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.type === "user"
                  ? "bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-tr-none font-semibold text-sm md:text-base border border-red-700/20 shadow-md"
                  : "bg-white border border-slate-100 text-slate-800 rounded-tl-none ring-1 ring-black/[0.02]"
              }`}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed font-bold text-slate-800">
                {message.type === "ai" ? (
                  message.text
                ) : (
                  <span className="text-white font-medium">{message.text}</span>
                )}
              </p>
              {message.result &&
                renderResult(message.result, message.id, message.sql)}
              <div
                className={`text-[10px] mt-1.5 text-right font-medium ${message.type === "user" ? "text-red-200/80" : "text-slate-400"}`}
              >
                {message.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2 animate-pulse">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2.5 shadow-sm ring-1 ring-black/[0.02]">
              <Loader2 size={15} className="animate-spin text-red-600" />
              <span className="text-xs font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                AI đang phân tích gia phả...
              </span>
            </div>
          </div>
        )}

        {showQuickQuestions && messages.length === 1 && (
          <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-3 delay-150 duration-300">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 pl-1">
              💡 Gợi ý cho bạn:
            </p>
            <div className="grid gap-2">
              {QUICK_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left p-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-200/60 rounded-xl hover:border-red-500 hover:bg-red-50/40 hover:text-red-700 transition-all active:scale-[0.99] shadow-sm hover:shadow"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* NÂNG CẤP LỚN: Input Footer To Hơn, Chữ To Hơn, Đẹp Hơn */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-6px_20px_rgba(0,0,0,0.04)]">
        <div className="flex gap-2.5 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Gõ câu hỏi về gia phả tại đây..."
            disabled={loading}
            className="flex-1 px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-full focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-600 focus:bg-white text-sm md:text-base font-semibold text-slate-800 placeholder-slate-400 shadow-inner transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-red-600 via-red-600 to-rose-600 text-white p-3.5 rounded-full hover:from-red-700 hover:to-rose-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 shadow-md shadow-red-600/20 active:scale-90 flex-shrink-0"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="translate-x-[1px]" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5 text-center font-semibold">
          💡 Nhấn{" "}
          <kbd className="bg-slate-100 px-1 rounded border shadow-sm">
            Enter
          </kbd>{" "}
          để gửi câu hỏi nhanh
        </p>
      </div>
    </div>
  );
}
