"use client";

import { useRef, useEffect, useCallback } from "react";

const GOLD = "#c9a961";

// ── Drawing helpers ──────────────────────────────────────────────────────────

/**
 * Vẽ họa tiết xoắn vuông tại một góc.
 * Pivot tại (x, y), spiral mở ra theo góc phần tư +x/+y (trước khi rotate).
 * Rotation:
 *   0        → trên-trái  (spiral về phải + xuống)
 *  -π/2      → trên-phải  (spiral về trái + xuống)
 *   π/2      → dưới-trái  (spiral về phải + lên)
 *   π        → dưới-phải  (spiral về trái + lên)
 */
function cornerSpiral(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sz: number,
  angle: number,
) {
  const u = sz / 4; // mỗi bậc spiral = 1/4 kích thước góc

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Vòng ngoài: L hình mở vào góc phần tư +x/+y
  ctx.beginPath();
  ctx.moveTo(u, 0);        // 1 bậc từ góc theo cạnh trên
  ctx.lineTo(u, 3 * u);    // xuống 3 bậc
  ctx.lineTo(3 * u, 3 * u);// phải 2 bậc
  ctx.lineTo(3 * u, u);    // lên 2 bậc
  ctx.lineTo(2 * u, u);    // trái 1 bậc

  // Vòng trong: cuộn tiếp vào trung tâm
  ctx.lineTo(2 * u, 2 * u);// xuống 1 bậc — kết thúc spiral

  ctx.stroke();
  ctx.restore();
}

/** Vẽ hình thoi nhỏ (điểm trang trí giữa cạnh). */
function midDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

function renderFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  const m = 5; // lề ngoài từ cạnh thẻ
  // Kích thước spiral góc: tối đa 36 px, tỉ lệ 15% cạnh nhỏ hơn
  const csz = Math.min(w * 0.15, h * 0.15, 36);

  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";

  // Đường viền ngoài
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);

  // Đường viền trong (mảnh hơn, lùi vào 4 px)
  ctx.lineWidth = 0.6;
  ctx.strokeRect(m + 4, m + 4, w - 2 * (m + 4), h - 2 * (m + 4));

  // Họa tiết xoắn vuông đối xứng chéo tại 4 góc
  ctx.lineWidth = 1.5;
  cornerSpiral(ctx, m,     m,     csz,  0);             // trên-trái
  cornerSpiral(ctx, w - m, m,     csz, -Math.PI / 2);   // trên-phải
  cornerSpiral(ctx, m,     h - m, csz,  Math.PI / 2);   // dưới-trái
  cornerSpiral(ctx, w - m, h - m, csz,  Math.PI);       // dưới-phải

  // Hình thoi trang trí giữa mỗi cạnh
  const dr = 3;
  midDiamond(ctx, w / 2, m,     dr); // trên
  midDiamond(ctx, w / 2, h - m, dr); // dưới
  midDiamond(ctx, m,     h / 2, dr); // trái
  midDiamond(ctx, w - m, h / 2, dr); // phải
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DecoFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Bọc bất kỳ nội dung nào và vẽ khung trang trí xoắn vuông bằng canvas.
 * Canvas luôn theo kích thước thực của container (hỗ trợ resize + HiDPI).
 */
export const DecoFrame = ({ children, className = "" }: DecoFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const { width, height } = el.getBoundingClientRect();
    if (width < 10 || height < 10) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    renderFrame(ctx, width, height);
  }, []);

  useEffect(() => {
    redraw();
    const obs = new ResizeObserver(redraw);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [redraw]);

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {children}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
        aria-hidden
      />
    </div>
  );
};
