"use client";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMembersByDongHo } from "@/service/member.service";
import { getDongHoById } from "@/service/dongho.service";
import storage from "@/utils/storage";

// ── Types ───────────────────────────────────────────────────────────────────
interface ITreeNode {
  id: number;
  hoTen: string;
  ngaySinh?: string;
  ngayMat?: string;
  gioiTinh: number;   // 1 = nam, 0 = nữ
  doiThuoc: number;   // thế hệ (1-based)
  fid?: number;       // cha
  mid?: number;       // mẹ
  pids?: number[];    // vợ/chồng
}

interface LayoutNode {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  data: ITreeNode;
  gen: number;
  isV: boolean;       // isV = true → dùng layout dọc (gen > 4)
}

// ────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────────────────────
const cx = (n: LayoutNode) => n.x + n.w / 2;
const by = (n: LayoutNode) => n.y + n.h;

function nodeH(person: ITreeNode, isTop: boolean, fs: number) {
  if (isTop) return 120;
  const words = (person.hoTen || "").split(" ");
  return words.length * (fs + 4) + 80;
}

function buildYearStr(d: ITreeNode) {
  const b = d.ngaySinh ? new Date(d.ngaySinh).getFullYear() : "";
  const m = d.ngayMat ? new Date(d.ngayMat).getFullYear() : "";
  if (b && m) return `${b}–${m}`;
  if (b) return `${b}–?`;
  if (m) return `?–${m}`;
  return "";
}

function parentXOf(node: ITreeNode, prevMap: Map<number, LayoutNode>) {
  const f = node.fid ? prevMap.get(node.fid) : null;
  const m = node.mid ? prevMap.get(node.mid) : null;
  if (f && m) return (cx(f) + cx(m)) / 2;
  if (f) return cx(f);
  if (m) return cx(m);
  return 0;
}

function estRowW(gen: number, nodes: ITreeNode[]) {
  const top = gen <= 4;
  const nw = top ? 260 : 75; // Đồng bộ với layout mới
  const gg = top ? 80 : Math.max(15, 40 - gen * 2);
  const cg = 2;
  const seen = new Set<number>();
  let w = 0;
  nodes.forEach(n => {
    if (seen.has(n.id)) return;
    const partners = (n.pids || []).map(id => nodes.find(p => p.id === id)).filter(Boolean) as ITreeNode[];
    if (partners.length >= 2) {
      w += nw * 3 + cg * 2 + gg;
      [n, ...partners].forEach(p => seen.add(p.id));
    } else if (partners.length === 1 && !seen.has(partners[0]!.id)) {
      w += nw * 2 + cg + gg;
      seen.add(n.id); seen.add(partners[0]!.id);
    } else {
      w += nw + gg;
      seen.add(n.id);
    }
  });
  return w;
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// ────────────────────────────────────────────────────────────────────────────
//  CANVAS COMPONENT
// ────────────────────────────────────────────────────────────────────────────
const FamilyTreeCanvas: React.FC<{
  data: ITreeNode[];
  title?: string;
  width?: number;
  height?: number;
}> = ({ data, title = "Dòng họ", width = 6000, height = 5000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<LayoutNode[]>([]);
  const [assets, setAssets] = useState<any>({});
  const [canvasWidth, setCanvasWidth] = useState(width);
  const [canvasHeight, setCanvasHeight] = useState(height);

  // ── asset preload ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = (src: string) => new Promise<HTMLImageElement | null>(res => {
      const img = new Image();
      img.src = src;
      img.onload = () => res(img);
      img.onerror = () => res(null);
    });
    Promise.all([
      load("/images/primary_bg.png"),
      load("/images/node_background_1.png"),
      load("/images/node_background_female.png"),
      load("/images/node_background_dead.jpg"),
    ]).then(([bg, nodeBg1, nodeBgFemale, nodeBgDead]) => 
      setAssets({ bg, nodeBg1, nodeBgFemale, nodeBgDead })
    );
  }, []);

  // ── layout ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data.length) return;

    // 1. Nhóm theo thế hệ
    const genMap = new Map<number, ITreeNode[]>();
    data.forEach(n => {
      const g = n.doiThuoc || 1;
      if (!genMap.has(g)) genMap.set(g, []);
      genMap.get(g)!.push(n);
    });
    const generations = Array.from(genMap.keys()).sort((a, b) => a - b);

    // Tìm số từ nhiều nhất trong tên để làm chuẩn chiều cao node dọc
    const maxWords = data.reduce((max, n) => {
      const words = (n.hoTen || "").split(" ").length;
      return words > max ? words : max;
    }, 1);

    // 2. Map toàn bộ data để tra partner
    const allNodesMap = new Map<number, ITreeNode>(data.map(d => [d.id, d]));

    // 3. Tính chiều rộng canvas ước lượng
    let maxRW = 0;
    generations.forEach(g => { maxRW = Math.max(maxRW, estRowW(g, genMap.get(g)!)); });
    const W = Math.max(width, maxRW + 400);
    setCanvasWidth(W);

    const HEADER = 1400;
    const calc: LayoutNode[] = [];

    generations.forEach((gen, idx) => {
      const nodesInGen = genMap.get(gen)!;
      const isTop = gen <= 4;
      const nw = isTop ? 260 : 75;
      const vGap = isTop ? 500 : 440;
      const gg = isTop ? 80 : 30;       // khoảng cách GIỮA các gia đình
      const innerGap = 6;               // khoảng cách TRONG anh chị em ruột
      const cg = 2;                     // khoảng cách trong cặp vợ chồng
      const curY = HEADER + idx * vGap;

      // prevMap để sắp xếp theo X cha/mẹ
      const prevMap = idx > 0
        ? new Map(calc.filter(cn => cn.gen === generations[idx - 1]).map(cn => [cn.id, cn]))
        : new Map<number, LayoutNode>();

      // ── Helper: tạo nhóm cặp từ 1 người ─────────────────────────────────
      const processed = new Set<number>();
      const buildGroup = (n: ITreeNode): ITreeNode[] | null => {
        if (processed.has(n.id)) return null;
        const partners = (n.pids || [])
          .map(id => allNodesMap.get(id))
          .filter(Boolean)
          .filter(p => nodesInGen.some(q => q.id === p!.id) && !processed.has(p!.id)) as ITreeNode[];

        let group: ITreeNode[];
        if (n.gioiTinh === 1 && partners.length >= 2) {
          // Chồng vào giữa các vợ
          const midIdx = Math.floor(partners.length / 2);
          group = [...partners.slice(0, midIdx), n, ...partners.slice(midIdx)];
        } else if (partners.length >= 1) {
          group = n.gioiTinh === 1 ? [n, partners[0]!] : [partners[0]!, n];
        } else {
          group = [n];
        }
        group.forEach(p => processed.add(p.id));
        return group;
      };

      // ── Gom anh chị em ruột theo cha+mẹ (cluster) ────────────────────────
      type Cluster = ITreeNode[][];  // mỗi cluster = mảng couple-group
      const clusterMap = new Map<string, ITreeNode[]>();  // fkey → anh chị em
      const orphans: ITreeNode[] = [];

      // Sắp xếp nam trước nữ trong cùng thế hệ (để chồng xử lý trước vợ)
      const sortedInGen = [...nodesInGen].sort((a, b) => b.gioiTinh - a.gioiTinh);

      sortedInGen.forEach(n => {
        const fkey = (n.fid || n.mid) ? `${n.fid ?? ""}|${n.mid ?? ""}` : null;
        if (fkey) {
          if (!clusterMap.has(fkey)) clusterMap.set(fkey, []);
          clusterMap.get(fkey)!.push(n);
        } else {
          orphans.push(n);
        }
      });

      // Sắp xếp clusters theo X của cha/mẹ
      const sortedClusters: Cluster[] = [];
      const sortedKeys = Array.from(clusterMap.keys()).sort((ka, kb) => {
        const [fidA, midA] = ka.split("|").map(Number);
        const [fidB, midB] = kb.split("|").map(Number);
        const pA = (fidA && prevMap.get(fidA)) ?? (midA ? prevMap.get(midA) : undefined) ?? null;
        const pB = (fidB && prevMap.get(fidB)) ?? (midB ? prevMap.get(midB) : undefined) ?? null;
        return (pA ? cx(pA) : 0) - (pB ? cx(pB) : 0);
      });

      sortedKeys.forEach(key => {
        const siblings = clusterMap.get(key)!;
        const cluster: Cluster = [];
        siblings.forEach(sib => {
          const g = buildGroup(sib);
          if (g) cluster.push(g);
        });
        if (cluster.length > 0) sortedClusters.push(cluster);
      });

      // Orphans → mỗi người là cluster riêng
      orphans.forEach(n => {
        const g = buildGroup(n);
        if (g) sortedClusters.push([g]);
      });

      // ── Tính chiều rộng và đặt vị trí x ─────────────────────────────────
      const clusterWidths = sortedClusters.map(cluster =>
        cluster.reduce((s, g) => s + g.length * nw + (g.length - 1) * cg, 0)
        + Math.max(0, cluster.length - 1) * innerGap
      );
      const totalRowW = clusterWidths.reduce((s, w) => s + w, 0)
        + Math.max(0, sortedClusters.length - 1) * gg;

      let curX = Math.round((W - totalRowW) / 2);

      sortedClusters.forEach((cluster, ci) => {
        let clX = curX;
        cluster.forEach((group, gi) => {
          group.forEach((person, pi) => {
            const h = isTop ? 120 : (maxWords * 22 + 80);
            calc.push({
              id: person.id,
              x: Math.round(clX + pi * (nw + cg)),
              y: curY,
              w: nw, h, data: person, gen, isV: !isTop,
            });
          });
          const groupW = group.length * nw + (group.length - 1) * cg;
          clX += groupW + (gi < cluster.length - 1 ? innerGap : 0);
        });
        curX += clusterWidths[ci] + (ci < sortedClusters.length - 1 ? gg : 0);
      });
    });

    const maxY = Math.max(...calc.map(n => n.y + n.h));
    setCanvasHeight(Math.max(height, maxY + 500));
    setNodes(calc);
  }, [data, width, height]);


  // ── draw relations ─────────────────────────────────────────────────────────
  /**
   * CHIẾN LƯỢC KHÔNG CHỒNG CHÉO:
   *
   * 1. THANH HÔN NHÂN: đường ngang nối cạnh phải(chồng/vợ trái)→cạnh trái(vợ/chồng phải)
   *    tại y = barY = min(n.y)+min(n.h)*0.45 (giữa hộp)
   *
   * 2. ANCHOR POINT: điểm bắt đầu kéo đường xuống con
   *    - 1 vợ:  anchorX = midpoint(chồng, vợ),  anchorY = max(bottomY(chồng), bottomY(vợ))
   *    - 2 vợ:  anchorX_vợ1 = mid(vợ1, chồng),  anchorX_vợ2 = mid(chồng, vợ2)
   *             anchorY = max(bottomY của cặp đó)
   *
   * 3. BRIDGE Y: mỗi nhóm cha/mẹ có yBridge RIÊNG, tính từ:
   *    yBridge = anchorY + BRIDGE_FRAC * (minChildTop - anchorY)
   *    Dùng anchorX làm salt: tránh 2 nhóm cùng yBridge khi cùng thế hệ
   *
   * 4. ĐƯỜNG NGANG: chỉ span đúng min(childCenters, anchorX)..max(childCenters, anchorX)
   *    → không bao giờ đè sang nhóm khác
   *
   * 5. Đường ngang các nhóm khác nhau tự nhiên cách nhau vì anchorY và vị trí X khác nhau
   */
  const drawRelations = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#7c2d12";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]); // nét liền đậm

    const nm = new Map(nodes.map(n => [n.id, n]));


    // ── Bước 1: vẽ thanh hôn nhân ────────────────────────────────────────
    // Với chồng ở giữa 2 vợ: vẽ 2 đoạn riêng (vợ→chồng và chồng→vợ)
    const drawnCouples = new Set<string>();
    nodes.forEach(n => {
      if (n.data.gioiTinh !== 1) return; // chỉ xử lý từ chồng
      const husband = n;
      const wives = (husband.data.pids || [])
        .map(pid => nm.get(pid))
        .filter(Boolean) as LayoutNode[];
      if (wives.length === 0) return;

      wives.forEach(wife => {
        const key = [husband.id, wife.id].sort().join("-");
        if (drawnCouples.has(key)) return;
        drawnCouples.add(key);
        const left = husband.x < wife.x ? husband : wife;
        const right = husband.x < wife.x ? wife : husband;
        const barY = Math.round(left.y + Math.min(left.h, right.h) * 0.45);
        // Vẽ từ cạnh phải của node trái đến cạnh trái của node phải
        drawLine(ctx, left.x + left.w, barY, right.x, barY);
      });
    });

    // ── Bước 2: Xây anchorMap cho từng cặp (fid|mid) ────────────────────
    // key = "fid|mid" hoặc "mid|fid" → { anchorX, anchorY }
    const anchorMap = new Map<string, { anchorX: number; anchorY: number }>();

    nodes.forEach(n => {
      if (n.data.gioiTinh !== 1) return;  // chỉ xử lý chồng
      const husband = n;
      const wives = (husband.data.pids || []).map(pid => nm.get(pid)).filter(Boolean) as LayoutNode[];
      if (wives.length === 0) return;

      // Mỗi cặp (chồng + 1 vợ) có anchor riêng = midpoint của cặp đó
      wives.forEach((wife) => {
        const ax = Math.round((cx(husband) + cx(wife)) / 2);
        const ay = Math.round(Math.max(by(husband), by(wife)));
        const k1 = `${husband.id}|${wife.id}`;
        const k2 = `${wife.id}|${husband.id}`;
        anchorMap.set(k1, { anchorX: ax, anchorY: ay });
        anchorMap.set(k2, { anchorX: ax, anchorY: ay });
      });
    });


    // ── Bước 3: Gom con theo (fid|mid) ───────────────────────────────────
    type CGroup = { fid?: number; mid?: number; children: LayoutNode[] };
    const groupMap = new Map<string, CGroup>();

    nodes.forEach(child => {
      const fid = child.data.fid;
      const mid = child.data.mid;
      if (!fid && !mid) return;
      const key = `${fid ?? ""}|${mid ?? ""}`;
      if (!groupMap.has(key)) groupMap.set(key, { fid, mid, children: [] });
      groupMap.get(key)!.children.push(child);
    });

    // ── Bước 4: Mỗi nhóm có yBridge riêng ───────────────────────────────
    // Đảm bảo không 2 nhóm nào cùng gen dùng chung yBridge:
    // Ta dùng tập yBridgeUsed per (minChildY) để offset nếu trùng.
    const usedBridges = new Map<number, Set<number>>();  // minChildY → Set<yBridge>

    groupMap.forEach(({ fid, mid, children }) => {
      const fNode = fid ? nm.get(fid) : undefined;
      const mNode = mid ? nm.get(mid) : undefined;
      if (!fNode && !mNode) return;

      // Lấy anchor
      const aKey = `${fid ?? ""}|${mid ?? ""}`;
      const anchor = anchorMap.get(aKey);
      let anchorX: number, anchorY: number;

      if (anchor) {
        anchorX = anchor.anchorX;
        anchorY = anchor.anchorY;
      } else if (fNode && mNode) {
        anchorX = Math.round((cx(fNode) + cx(mNode)) / 2);
        anchorY = Math.round(Math.max(by(fNode), by(mNode)));
      } else {
        const p = (fNode ?? mNode)!;
        anchorX = Math.round(cx(p));
        anchorY = Math.round(by(p));
      }

      // Tính yBridge
      const minChildTop = Math.min(...children.map(c => c.y));
      const gap = minChildTop - anchorY;
      const FRAC = 0.40;
      let yBridge = Math.round(anchorY + gap * FRAC);

      // Đảm bảo yBridge duy nhất trong cùng minChildY
      const bucket = minChildTop;
      if (!usedBridges.has(bucket)) usedBridges.set(bucket, new Set());
      const used = usedBridges.get(bucket)!;
      // Nếu bị trùng, tăng lên cho đến khi không trùng (step = 8px)
      while (used.has(yBridge)) yBridge += 8;
      used.add(yBridge);

      // 1. Đường dọc từ anchor xuống bridge
      drawLine(ctx, anchorX, anchorY, anchorX, yBridge);

      // 2. Đường ngang chỉ span con của gia đình này + anchorX
      const childCXs = children.map(c => Math.round(cx(c)));
      const barL = Math.min(...childCXs, anchorX);
      const barR = Math.max(...childCXs, anchorX);
      if (barL !== barR) drawLine(ctx, barL, yBridge, barR, yBridge);

      // 3. Đường dọc từ bridge xuống đỉnh mỗi con
      children.forEach(child => {
        drawLine(ctx, Math.round(cx(child)), yBridge, Math.round(cx(child)), child.y);
      });

      // 4. Dấu chấm tại T-junction
      ctx.fillStyle = "#7c2d12";
      ctx.beginPath();
      ctx.arc(anchorX, yBridge, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // ── render canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (assets.bg) ctx.drawImage(assets.bg, 0, 0, canvasWidth, canvasHeight);

    const mid = canvasWidth / 2;
    if (assets.r1) ctx.drawImage(assets.r1, mid - 3400, 0, 1800, 1800);   // rồng trái
    if (assets.r2) ctx.drawImage(assets.r2, mid + 1600, 0, 1800, 1800);   // rồng phải

    // Logo giữa: giữ đúng tỷ lệ ảnh, không bóp méo
    if (assets.lg) {
      const lgH = 900;  // chiều cao cố định
      const lgW = Math.round((assets.lg.naturalWidth / assets.lg.naturalHeight) * lgH);
      ctx.drawImage(assets.lg, mid - lgW / 2, 30, lgW, lgH);
    }
    // Vẽ đường nối TRƯỚC để nằm dưới hộp
    drawRelations(ctx);

    // Reset về nét liền trước khi vẽ hộp
    ctx.setLineDash([]);

    // Vẽ hộp
    nodes.forEach(n => {
      const isTop = !n.isV;
      const isDead = !!n.data.ngayMat;
      
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 6;
      
      // Chọn hình nền dựa trên trạng thái và giới tính
      let bgImage = null;
      if (isDead) {
        bgImage = assets.nodeBgDead; // Người đã mất
      } else if (n.data.gioiTinh === 1) {
        bgImage = assets.nodeBgDead; // Nam còn sống
      } else if (n.data.gioiTinh === 0) {
        bgImage = assets.nodeBgFemale; // Nữ còn sống
      } else {
        bgImage = assets.nodeBg1; // Mặc định
      }
      
      // Vẽ hình nền nếu có, không thì dùng màu vàng
      if (bgImage) {
        ctx.drawImage(bgImage, n.x, n.y, n.w, n.h);
      } else {
        ctx.fillStyle = "#a6a696ff";
        ctx.fillRect(n.x, n.y, n.w, n.h);
      }
      
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isDead ? "#991b1b" : "#dc2626";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(n.x, n.y, n.w, n.h);

      const name = n.data.hoTen || "";
      const yearStr = buildYearStr(n.data);
      ctx.fillStyle = "#B91C1C";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isTop) {
        // Node ngang (thế hệ 1-4)
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(name, n.x + n.w / 2, n.y + n.h / 2 - 15);
        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = "#660000";
        ctx.fillText(yearStr, n.x + n.w / 2, n.y + n.h / 2 + 15);
      } else {
        // Node dọc (thế hệ 5+)
        const fs = Math.max(12, 18 - (n.gen - 5));
        ctx.font = `bold ${fs}px sans-serif`;
        const words = name.split(" ");
        const totalTextHeight = words.length * (fs + 4);
        const yearHeight = yearStr ? (Math.max(10, fs - 2) + 8) : 0;
        const contentHeight = totalTextHeight + yearHeight;
        let ty = n.y + (n.h - contentHeight) / 2 + fs / 2;
        
        words.forEach((w: string) => {
          ctx.fillStyle = "#B91C1C";
          ctx.fillText(w, n.x + n.w / 2, ty);
          ty += fs + 4;
        });
        
        if (yearStr) {
          ctx.font = `bold ${Math.max(10, fs - 2)}px sans-serif`;
          ctx.fillStyle = "#660000";
          ctx.fillText(yearStr, n.x + n.w / 2, ty + 4);
        }
      }
    });
  }, [nodes, assets, title, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ width: "100%" }}
    />
  );
};

// ── Main Content Component ───────────────────────────────────────────────────
function PrintContent() {
  const searchParams = useSearchParams();
  const [dongHoId, setDongHoId] = useState("");

  useEffect(() => {
    const id = searchParams.get("dongHoId");
    if (id) { setDongHoId(id); return; }
    const user = storage.getUser();
    if (user?.dongHoId) setDongHoId(user.dongHoId);
  }, [searchParams]);

  const { data: dhData } = useQuery({
    queryKey: ["dh", dongHoId],
    queryFn: () => getDongHoById(dongHoId),
    enabled: !!dongHoId,
  });
  const { data: mData, isLoading } = useQuery({
    queryKey: ["mp", dongHoId],
    queryFn: () => getMembersByDongHo(dongHoId),
    enabled: !!dongHoId,
  });

  const dongHo = dhData?.data;

  const members = useMemo(() => {
    const raw = mData?.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter((m: any) => m?.thanhVienId && !isNaN(m.thanhVienId));
  }, [mData]);

  const treeData = useMemo((): ITreeNode[] => {
    // Xây partnersMap: mỗi người biết danh sách vợ/chồng của mình
    const partnersMap = new Map<number, Set<number>>();
    members.forEach(m => {
      if (m.chaId && m.meId) {
        if (!partnersMap.has(m.chaId)) partnersMap.set(m.chaId, new Set());
        if (!partnersMap.has(m.meId)) partnersMap.set(m.meId, new Set());
        partnersMap.get(m.chaId)!.add(m.meId);
        partnersMap.get(m.meId)!.add(m.chaId);
      }
    });
    const result = members.map((m: any) => ({
      id: m.thanhVienId,
      hoTen: m.hoTen,
      ngaySinh: m.ngaySinh,
      ngayMat: m.ngayMat,
      gioiTinh: m.gioiTinh,
      doiThuoc: m.doiThuoc || 1,
      fid: m.chaId,
      mid: m.meId,
      pids: Array.from(partnersMap.get(m.thanhVienId) || []),
    }));

    // DEBUG: log những người có từ 2 vợ/chồng trở lên
    result.forEach(r => {
      if (r.pids.length >= 2) {
        console.log(`[MULTI-SPOUSE] ${r.hoTen} (gen ${r.doiThuoc}, giới tính ${r.gioiTinh}) có ${r.pids.length} vợ/chồng: pids=${JSON.stringify(r.pids)}`);
      }
    });
    if (result.every(r => r.pids.length < 2)) {
      console.log("[MULTI-SPOUSE] Không có ai có từ 2 vợ/chồng trong data hiện tại.");
    }

    return result;
  }, [members]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0500",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <button
        className="no-print"
        onClick={() => window.print()}
        style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: "#D4AF37", color: "#000", border: "none",
          padding: "12px 24px", borderRadius: 8, cursor: "pointer",
          fontWeight: "bold", fontSize: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        🖨️ In Gia Phả
      </button>

      {isLoading ? (
        <div style={{ color: "#D4AF37", fontSize: 24 }}>⏳ Đang tải dữ liệu gia phả...</div>
      ) : members.length === 0 ? (
        <div style={{ color: "#D4AF37", fontSize: 24 }}>📜 Chưa có dữ liệu thành viên.</div>
      ) : (
        <FamilyTreeCanvas
          data={treeData}
          title={dongHo?.tenDongHo || "Gia Tộc"}
        />
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: none; }
        }
      `}</style>
    </div>
  );
}

export default function PrintPreviewPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0d0500",
      }}>
        <div style={{ color: "#D4AF37", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>📜</div>
          <p>Đang tải...</p>
        </div>
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}