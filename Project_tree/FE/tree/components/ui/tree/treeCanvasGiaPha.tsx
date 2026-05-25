"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMembersByDongHo, saveCoordinates, loadEdgeCoordinates, saveEdgeCoordinates } from "@/service/member.service";
import { keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, File, Moon, PictureInPicture, Search, Settings, SquareArrowDownLeft, SquareArrowOutDownLeft, SquareArrowOutUpLeft, Sun, Workflow } from "lucide-react";
import jsPDF from 'jspdf';

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
interface RawNode {
    thanhVienId: number;
    chaId?: number;
    meId?: number;
    voId?: number;
    chongId?: number;
    doiThuoc?: number;
    gioiTinh?: number;
    ngayMat?: string;
    toaDoX?: number;
    toaDoY?: number;
    anhChanDung?: string;
    hoTen?: string;
    ngheNghiep?: string;
    noiSinh?: string;
    [key: string]: any;
}

interface Node extends RawNode {
    id: number;
    fid: number | null;
    mid: number | null;
    pids: number[];
    x: number;
    y: number;
    children: number[];
    w: number;
    h: number;
    gen: number;
}

interface EdgeMod {
    bendX?: number;
    bendY?: number;
    dx?: number;
    dy?: number;
    cp1?: { x: number; y: number };
    cp2?: { x: number; y: number };
}

interface RState {
    scale: number;
    ox: number;
    oy: number;
    panning: boolean;
    panStart: any;
    dragId: number | null;
    dragDX: number;
    dragDY: number;
    hovId: number | null;
    selId: number | null;
    selSet: Set<number>;
    selRect: null | { x0: number; y0: number; x1: number; y1: number };
    groupDrag: null | { ids: number[]; offsets: Record<number, { dx: number; dy: number }> };
    lmap: Record<number, Node>;
    edges: any[];
    genRegions: Record<number, any>;
    hl: Set<number>;
    dark: boolean;
    edgeMods: Record<string, EdgeMod>;
    hoverEdge: { edgeIndex: number; handle: string } | null;
    edgeDrag: {
        edgeId: string;
        handle: string;
        startWx: number;
        startWy: number;
        startBendX?: number;
        startBendY?: number;
    } | null;
    undoStack: { lmap: Record<number, Node>; edgeMods: Record<string, EdgeMod> }[];
    maxUndo: number;
}

// ─────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────
const NW = 41;
const NH = 59;
const SIBLING_GAP_H = 10;
const CHILD_CLUSTER_GAP = 2;
const GEN_PADDING = 5;
const GEN_VERTICAL_GAP = 50;
const CHILD_Y_OFFSET = 2;
const SCALE_LAN = 1.6;

const defaultAvatar = new Image();
defaultAvatar.crossOrigin = "anonymous";
defaultAvatar.src = "../images/defaul_avt_node.png";

const bg = new Image();
bg.crossOrigin = "anonymous";
bg.src = "../images/background.png";

const chipBg = new Image();
chipBg.crossOrigin = "anonymous";
chipBg.src = "../images/chip_background.png";

const gen1Bg = new Image();
gen1Bg.crossOrigin = "anonymous";
gen1Bg.src = "../images/node_background_1.png";

const deadBg = new Image();
deadBg.crossOrigin = "anonymous";
deadBg.src = "../images/node_background_dead.jpg";

const maleBg = new Image();
maleBg.crossOrigin = "anonymous";
maleBg.src = "../images/node_background_male.png";

const femaleBg = new Image();
femaleBg.crossOrigin = "anonymous";
femaleBg.src = "../images/node_background_female.png";

const primaryBg = new Image();
primaryBg.crossOrigin = "anonymous";
primaryBg.src = "/images/primary_bg.png";

const background = new Image();
background.crossOrigin = "anonymous";
background.src = "../images/pha_he_background.jpg";

// ─────────────────────────────────────────────────────────────────
//  NODE SIZE BY GENERATION
// ─────────────────────────────────────────────────────────────────
const getNodeSizeGen = (gen: number) => {
    if (gen === 1) return { NW: 120, NH: 40, FS: 10, avata: false, DD: true };
    if (gen === 2) return { NW: 100, NH: 30, FS: 8, avata: false, DD: true };
    if (gen === 3) return { NW: 90, NH: 30, FS: 8, avata: false, DD: true };
    if (gen === 4) return { NW: 40, NH: 70, FS: 12, avata: false, DD: false };
    if (gen === 5) return { NW: 20, NH: 60, FS: 10, avata: false, DD: false };
    if (gen === 6) return { NW: 20, NH: 50, FS: 8, avata: false, DD: false };
    if (gen >= 7) return { NW: 15, NH: 50, FS: 8, avata: false, DD: false };
}

// ─────────────────────────────────────────────────────────────────
//  NORMALIZE
// ─────────────────────────────────────────────────────────────────
function normalize(raw: RawNode[]) {
    const spouseOf: Record<number, Set<number>> = {};
    raw.forEach(d => {
        const id = d.thanhVienId;
        if (!spouseOf[id]) spouseOf[id] = new Set();
        if (d.voId) {
            spouseOf[id].add(d.voId);
            if (!spouseOf[d.voId]) spouseOf[d.voId] = new Set();
            spouseOf[d.voId].add(id);
        }
        if (d.chongId) {
            spouseOf[id].add(d.chongId);
            if (!spouseOf[d.chongId]) spouseOf[d.chongId] = new Set();
            spouseOf[d.chongId].add(id);
        }
    });

    return raw.map(d => ({
        ...d,
        id: d.thanhVienId,
        fid: d.chaId || null,
        mid: d.meId || null,
        pids: Array.from(spouseOf[d.thanhVienId] || []),
        toaDoX: d.toaDoX || 0,
        toaDoY: d.toaDoY || 0,
    })) as RawNode[];
}

// ─────────────────────────────────────────────────────────────────
//  LAYOUT
// ─────────────────────────────────────────────────────────────────
function layout(nodes: (RawNode & { fid: number | null; mid: number | null; pids: number[] })[]) {
    const map: Record<number, Node> = {};
    const genMap: Record<number, number[]> = {};

    const hasCoordinates = nodes.some(n => (n.toaDoX || 0) > 0 || (n.toaDoY || 0) > 0);

    nodes.forEach(n => {
        const gen = n.doiThuoc || 1;
        const size = getNodeSizeGen(gen) || { NW, NH };
        map[n.thanhVienId] = { ...n, id: n.thanhVienId, gen, x: n.toaDoX || 0, y: n.toaDoY || 0, children: [], w: size.NW, h: size.NH };
        if (!genMap[gen]) genMap[gen] = [];
        genMap[gen].push(n.thanhVienId);
    });

    nodes.forEach(n => {
        const pid = n.chaId ?? (n.meId ?? null);
        if (pid && map[pid]) map[pid].children.push(n.thanhVienId);
    });
    Object.values(map).forEach(n => { n.children = [...new Set(n.children as number[])]; });

    if (hasCoordinates) {
        return { ...map, genRegions: {} };
    }

    const gens = Object.keys(genMap).map(Number).sort((a, b) => a - b);
    let currentY = 20;

    gens.forEach(gen => {
        const genNodeIds = genMap[gen];
        let avgH = NH;
        if (genNodeIds.length) {
            avgH = genNodeIds.reduce((sum, nid) => sum + (map[nid].h || NH), 0) / genNodeIds.length;
        }
        const genPad = GEN_PADDING * (avgH / NH);
        const baseYForGen = currentY + genPad + GEN_VERTICAL_GAP;

        let currentX = 0;
        genNodeIds.sort((a, b) => a - b);
        genNodeIds.forEach(id => {
            const n = map[id];
            n.x = currentX;
            n.y = baseYForGen;
            currentX += n.w + 5;
        });

        genNodeIds.forEach(id => {
            const n = map[id];
            if (n.pids && n.pids.length > 0) {
                const spouses = n.pids.map((sid: number) => map[sid]).filter((s: any) => s && s.id !== n.id);
                spouses.sort((a: any, b: any) => a.id - b.id);
                let spouseX = n.x + n.w + 5;
                spouses.forEach((s: any) => {
                    s.x = spouseX;
                    s.y = n.y;
                    spouseX += s.w + 5;
                });
            }
        });

        for (let i = 0; i < genNodeIds.length; i++) {
            const id = genNodeIds[i];
            const n = map[id];
            let maxX = n.x + n.w;
            if (n.pids && n.pids.length > 0) {
                const spouses = n.pids.map((sid: number) => map[sid]).filter((s: any) => s && s.id !== n.id);
                spouses.forEach((s: any) => { maxX = Math.max(maxX, s.x + s.w); });
            }
            const nextId = genNodeIds[i + 1];
            if (nextId) {
                const nextN = map[nextId];
                if (maxX + 5 > nextN.x) {
                    const shift = maxX + 5 - nextN.x;
                    for (let j = i + 1; j < genNodeIds.length; j++) {
                        map[genNodeIds[j]].x += shift;
                    }
                }
            }
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        genNodeIds.forEach(nid => {
            const n = map[nid];
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x + (n.w || NW));
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y + (n.h || NH));
        });

        currentY = maxY + GEN_VERTICAL_GAP;
    });

    const gen1Nodes = genMap[1] || [];
    let centerX = 0;
    if (gen1Nodes.length === 2) {
        const r1 = map[gen1Nodes[0]];
        const r2 = map[gen1Nodes[1]];
        centerX = (r1.x + (r1.w || NW) / 2 + r2.x + (r2.w || NW) / 2) / 2;
    } else {
        let minX = Infinity, maxX = -Infinity;
        Object.values(map).forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x + (n.w || NW));
        });
        centerX = (minX + maxX) / 2;
    }
    const shift = -centerX;
    Object.values(map).forEach(n => { n.x += shift; });

    return { ...map, genRegions: {} } as Record<number, Node> & { genRegions: Record<number, any> };
}

// ─────────────────────────────────────────────────────────────────
//  BUILD EDGES
// ─────────────────────────────────────────────────────────────────
function buildEdges(nodes: RawNode[], lmap: Record<number, Node>) {
    const edges: any[] = [];
    const seen = new Set<string>();
    const spouseMap: Record<string, any> = {};

    nodes.forEach(n => {
        if (!lmap[n.thanhVienId]) return;
        n.pids.forEach((sid: number) => {
            if (!lmap[sid]) return;
            const key = [Math.min(n.thanhVienId, sid), Math.max(n.thanhVienId, sid)].join('-');
            if (seen.has(key)) return;
            seen.add(key);
            const a = lmap[n.thanhVienId], b = lmap[sid];
            const avgY = (a.y + b.y) / 2;
            const L = a.x < b.x ? a : b;
            const R = a.x < b.x ? b : a;
            const lw = L.w || NW;
            const lh = L.h || NH;
            const spouseEdge = {
                id: `spouse-${Math.min(n.id, sid)}-${Math.max(n.id, sid)}`,
                type: 'spouse',
                a: Math.min(n.id, sid),
                b: Math.max(n.id, sid),
                x1: L.x + lw,
                y1: avgY + (lh / 2),
                x2: R.x,
                y2: avgY + (lh / 2),
            };
            edges.push(spouseEdge);
            spouseMap[key] = spouseEdge;
        });
    });

    seen.clear();
    const parentGroups: Record<string, any[]> = {};

    nodes.forEach(n => {
        if (!lmap[n.id]) return;
        const fid = n.fid;
        const mid = n.mid;
        if (fid && mid && lmap[fid] && lmap[mid]) {
            const key = [Math.min(fid, mid), Math.max(fid, mid)].join('-');
            if (!parentGroups[key]) parentGroups[key] = [];
            parentGroups[key].push(n);
        } else {
            const pid = fid ?? mid ?? null;
            if (pid && lmap[pid]) {
                const key = `single-${pid}`;
                if (!parentGroups[key]) parentGroups[key] = [];
                parentGroups[key].push(n);
            }
        }
    });

    const parentEntries = Object.entries(parentGroups).map(([parentKey, children]) => {
        if (children.length === 0) return null;
        let jointX: number, jointY: number;
        if (parentKey.startsWith('single-')) {
            const pid = parseInt(parentKey.split('-')[1]);
            const parent = lmap[pid];
            const pw = parent.w || NW;
            const ph = parent.h || NH;
            jointX = parent.x + pw / 2;
            const parentJoinOffset = Math.min(ph * 0.3, 20);
            jointY = parent.y + parentJoinOffset;
        } else {
            const spouseEdge = spouseMap[parentKey];
            if (!spouseEdge) return null;
            jointX = (spouseEdge.x1 + spouseEdge.x2) / 2;
            jointY = spouseEdge.y1;
        }
        const baseBendY = jointY + 10;
        return { parentKey, children, jointX, jointY, baseBendY };
    }).filter(Boolean) as Array<{ parentKey: string; children: any[]; jointX: number; jointY: number; baseBendY: number }>;

    parentEntries.sort((a, b) => (a.baseBendY - b.baseBendY) || (a.jointX - b.jointX));

    const GROUP_SPACING = 10;
    let prevBendY: number | null = null;

    parentEntries.forEach(entry => {
        let groupBendY = entry.baseBendY;
        if (prevBendY !== null && groupBendY - prevBendY < GROUP_SPACING) {
            groupBendY = prevBendY + GROUP_SPACING;
        }
        prevBendY = groupBendY;

        entry.children.forEach(child => {
            const childNode = lmap[child.id];
            const cw = childNode.w || NW;
            edges.push({
                id: `parent-${entry.parentKey}-${child.id}`,
                type: 'parent',
                a: entry.parentKey,
                b: child.id,
                childId: child.id,
                x1: childNode.x + cw / 2,
                y1: childNode.y,
                bendX: entry.jointX,
                bendY: groupBendY,
                x2: entry.jointX,
                y2: entry.jointY,
            });
        });
    });

    return edges;
}

// ─────────────────────────────────────────────────────────────────
//  HIT TEST
// ─────────────────────────────────────────────────────────────────
function hit(lmap: Record<number, any>, wx: number, wy: number): number | null {
    for (const id in lmap) {
        const n = lmap[id];
        const w = n.w || NW;
        const h = n.h || NH;
        if (wx >= n.x && wx <= n.x + w && wy >= n.y && wy <= n.y + h) return Number(id);
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────
//  DRAW HELPERS
// ─────────────────────────────────────────────────────────────────
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
    return t + '…';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (ctx.measureText(currentLine + " " + word).width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const scale = Math.max(w / img.width, h / img.height);
    const nw = img.width * scale;
    const nh = img.height * scale;
    ctx.drawImage(img, -(nw - w) / 2 + x, -(nh - h) / 2 + y, nw, nh);
}

// ─────────────────────────────────────────────────────────────────
//  DRAW EDGE
// ─────────────────────────────────────────────────────────────────
function drawEdgeFn(ctx: CanvasRenderingContext2D, e: any, T: any, lineStyle: 'curved' | 'square' = 'square', edgeMods?: Record<string, any>) {
    ctx.save();
    const mod = edgeMods?.[e.id];
    const ox = mod?.dx ?? 0;
    const oy = mod?.dy ?? 0;
    const x1 = (e.x1 ?? 0) + ox;
    const y1 = (e.y1 ?? 0) + oy;
    const x2 = (e.x2 ?? 0) + ox;
    const y2 = (e.y2 ?? 0) + oy;

    if (e.type === 'spouse') {
        ctx.strokeStyle = T.spouse;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        if (mod?.cp1 && mod?.cp2) {
            ctx.moveTo(x1, y1);
            ctx.bezierCurveTo(mod.cp1.x + ox, mod.cp1.y + oy, mod.cp2.x + ox, mod.cp2.y + oy, x2, y2);
        } else if (mod?.bendX != null && mod?.bendY != null) {
            const bendX = mod.bendX + ox;
            const bendY = mod.bendY + oy;
            ctx.moveTo(x1, y1);
            ctx.lineTo(bendX, bendY);
            ctx.lineTo(x2, y2);
        } else {
            ctx.moveTo(x1, y1);
            if (lineStyle === 'curved') {
                ctx.bezierCurveTo(x1 + 16, y1, x2 - 16, y2, x2, y2);
            } else {
                ctx.lineTo(x2, y2);
            }
        }
        ctx.stroke();
    } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = T.parent;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const bendX = mod?.bendX != null ? mod.bendX + ox : e.bendX + ox;
        const bendY = mod?.bendY != null ? mod.bendY + oy : e.bendY + oy;
        if (bendX !== undefined && bendY !== undefined) {
            ctx.lineTo(x1, bendY);
            ctx.lineTo(bendX, bendY);
            ctx.lineTo(bendX, y2);
        } else {
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
    }
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
//  DRAW NODE
// ─────────────────────────────────────────────────────────────────
function drawNodeFn(ctx: CanvasRenderingContext2D, node: any, hov: boolean, hasBorder: boolean, sel: boolean, hl: boolean, dim: boolean, T: any, imageCache?: Record<number, HTMLImageElement | null>) {
    const { x, y } = node;
    const dead = !!node.ngayMat;
    const male = node.gioiTinh === 1;
    const { NW: w, NH: h, FS, avata: showAvt, DD: showDeath } = getNodeSizeGen(node.gen || 1) || { NW, NH, FS: 5, avata: true, DD: false };

    ctx.save();
    if (dim) ctx.globalAlpha = 0.15;

    ctx.shadowColor = sel ? T.selGlow : hov ? 'rgba(0,0,0,0.20)' : 'rgba(0, 0, 0, 0.23)';
    ctx.shadowBlur = sel ? 20 : hov ? 12 : 4;
    ctx.shadowOffsetY = sel ? 0 : 2;

    const [c0, c1] = dead ? T.gDead : male ? T.gMale : T.gFem;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    if (node.gen === 1 || node.gen === 2 || node.gen === 3) {
        drawImageCover(ctx, gen1Bg, x, y, w, h);
    } else {
        ctx.drawImage(dead ? deadBg : male ? maleBg : femaleBg, x, y, w, h);
    }

    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    if (hasBorder) {
        ctx.strokeStyle = sel ? T.selBdr : hov ? T.hovBdr : dead ? T.deadBdr : male ? T.maleBdr : T.femBdr;
        ctx.lineWidth = sel ? 1 : 0.5;
        ctx.strokeRect(x, y, w, h);
    }

    if (showAvt) {
        const avatarSize = 26;
        const avatarX = x + (w - avatarSize) / 2;
        const avatarY = y + 12;
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.strokeStyle = sel ? T.selBdr : dead ? T.deadBdr : male ? T.maleBdr : T.femBdr;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);
        if (imageCache && imageCache[node.id]) {
            ctx.globalAlpha = 1;
            ctx.drawImage(imageCache[node.id] || defaultAvatar, avatarX, avatarY, avatarSize, avatarSize);
        } else {
            ctx.drawImage(defaultAvatar, avatarX, avatarY, avatarSize, avatarSize);
        }
    }

    ctx.fillStyle = T.name;
    ctx.font = `${FS}px Dancing Script`;
    ctx.textAlign = "center";
    const nameTxt = node.hoTen || "—";
    const lines = wrapText(ctx, nameTxt, w - 4);
    lines.forEach((line, i) => {
        ctx.fillText(line, x + w / 2, y + FS + 4 + i * (FS + 2));
    });

    ctx.globalAlpha = 1;
    ctx.fillStyle = T.sub;
    ctx.font = `4px Dancing Script`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    let subText = node.ngayMat ? new Date(node.ngayMat).toISOString().split('T')[0] : '';
    if (showDeath && node.ngayMat) {
        const dd = new Date(node.ngayMat).toISOString().split('T')[0];
        subText = `${subText} – ${dd}`;
    }
    ctx.fillText(subText, x + w / 2, y + h - 2);

    ctx.globalAlpha = 1;
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
//  THEMES
// ─────────────────────────────────────────────────────────────────
const TH: Record<string, any> = {
    light: {
        bg: '#f7f3eb', grid: 'rgba(160,130,80,0.10)',
        parent: '#a07040', spouse: '#d15d1e',
        gMale: ['#ddeeff', '#b2ccfa'], gFem: ['#fde6f4', '#f8bde8'], gDead: ['#e5e5e5', '#ccc'],
        maleBdr: '#4070e8', femBdr: '#cc3898', deadBdr: '#999',
        selBdr: '#f5a020', hovBdr: '#f5a020', selGlow: 'rgba(245,160,30,0.4)',
        name: '#1a1a1a', sub: '#667', gen: '#595959',
        tb: 'rgba(255,255,255,0.94)', tbBdr: 'rgba(0,0,0,0.09)',
        inp: '#f4f4f4', inpBdr: '#ddd', inpClr: '#333',
        btn: '#efefef', btnClr: '#444',
        ttl: '#7a4510',
        lg: 'rgba(255,255,255,0.93)',
        stat: 'rgba(255,255,255,0.85)',
    },
    dark: {
        bg: '#0c0f1a', grid: 'rgba(60,90,140,0.14)',
        parent: '#4a80f0', spouse: '#07fec0',
        gMale: ['#182848', '#0d1e3c'], gFem: ['#350d2c', '#1c0818'], gDead: ['#222', '#161616'],
        maleBdr: '#4a80f0', femBdr: '#cc3898', deadBdr: '#555',
        selBdr: '#f0a020', hovBdr: '#f0a020', selGlow: 'rgba(240,160,30,0.5)',
        name: '#363636', sub: '#383232', gen: '#e6e6e6',
        tb: 'rgba(12,15,26,0.95)', tbBdr: 'rgba(255,255,255,0.07)',
        inp: '#181c30', inpBdr: '#2a2e44', inpClr: '#ddd',
        btn: '#181c30', btnClr: '#bbb',
        ttl: '#d4aa50',
        lg: 'rgba(12,15,26,0.93)',
        stat: 'rgba(12,15,26,0.85)',
    },
};

// ─────────────────────────────────────────────────────────────────
//  COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────
interface FamilyTreeCanvasProps {
    data?: any[];
    dongHoId?: string;
    onSelectMember?: (memberId: number) => void;
    onNodeContextMenu?: (event: React.MouseEvent, node: { id: string }) => void;
    onPaneContextMenu?: (event: React.MouseEvent) => void;
}

export default function FamilyTreeCanvasGiaPha({ data: propData, dongHoId, onSelectMember, onNodeContextMenu, onPaneContextMenu }: FamilyTreeCanvasProps) {
    const miniCvs = useRef<HTMLCanvasElement>(null);
    const cvs = useRef<HTMLCanvasElement>(null);
    const raf = useRef<number | null>(null);
    const container = useRef<HTMLDivElement>(null);
    const imageCache = useRef<Record<number, HTMLImageElement | null>>({});

    const R = useRef<RState>({
        scale: 1, ox: 0, oy: 0,
        panning: false, panStart: null as any,
        dragId: null, dragDX: 0, dragDY: 0,
        hovId: null, selId: null,
        selSet: new Set<number>(),
        selRect: null,
        groupDrag: null,
        lmap: {}, edges: [], genRegions: {},
        hl: new Set<number>(),
        dark: false,
        edgeMods: {},
        hoverEdge: null,
        edgeDrag: null,
        undoStack: [],
        maxUndo: 10,
    });

    const [dark, setDark] = useState(false);
    const [search, setSearch] = useState('');
    const [matches, setMatches] = useState(0);
    const [scaleDisplay, setScaleDisplay] = useState(1);
    const [maxGen, setMaxGen] = useState(3);
    const [allGens, setAllGens] = useState<number[]>([]);
    const [lineStyle, setLineStyle] = useState<'curved' | 'square'>('square');
    const [showSettings, setShowSettings] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState({ width: 4900, height: 3500 });
    const [legendExtended, setLegendExtended] = useState(false);
    const [edgeInfo, setEdgeInfo] = useState<any | null>(null);
    const saveCoordinatesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveEdgeCoordinatesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [toolbarPos, setToolbarPos] = useState({ top: 12, left: 10 });
    const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 });

    const T = dark ? TH.dark : TH.light;
    const CANVAS_NW = 120;
    const CANVAS_NH = 140;

    // ── Data ──
    const membersQuery = useQuery({
        queryKey: ["member-tree", dongHoId, maxGen],
        queryFn: () => dongHoId ? getMembersByDongHo(dongHoId, maxGen) : Promise.resolve({ data: [] }),
        enabled: !!dongHoId && !propData,
        placeholderData: keepPreviousData,
    });

    const edgeCoordinatesQuery = useQuery({
        queryKey: ["edge-coordinates", dongHoId],
        queryFn: () => dongHoId ? loadEdgeCoordinates(dongHoId) : Promise.resolve({ data: [] }),
        enabled: !!dongHoId,
        placeholderData: keepPreviousData,
    });

    const rawData = useMemo(() => {
        if (propData && propData.length) return propData;
        if (membersQuery.data && Array.isArray(membersQuery.data.data)) return membersQuery.data.data;
        return [];
    }, [propData, membersQuery.data]);

    useEffect(() => {
        if (!rawData.length) return;
        const gens = [...new Set(rawData.map((n: RawNode) => n.doiThuoc || 1))].sort((a, b) => (a as number) - (b as number)) as number[];
        setAllGens(gens);
        setMaxGen(Math.min(3, Math.max(...gens)));
    }, [rawData]);

    const norm = useMemo(() => {
        const filtered = rawData.filter((n: any) => (n.doiThuoc || 1) <= maxGen);
        return normalize(filtered);
    }, [rawData, maxGen]);

    // ─────────────────────────────────────────────────────────────────
    //  renderTreeContent — HÀM RENDER DUY NHẤT
    //  Gọi khi ctx đã ở đúng world-space (đã translate + scale)
    //  Dùng chung cho: draw(), previewAsImage(), downloadAsImage()
    // ─────────────────────────────────────────────────────────────────
    const renderTreeContent = useCallback((
        ctx: CanvasRenderingContext2D,
        lmap: Record<number, Node>,
        edges: any[],
        edgeMods: Record<string, EdgeMod>,
        T: any,
        opts: {
            scale?: number;
            selRect?: { x0: number; y0: number; x1: number; y1: number } | null;
            selSet?: Set<number>;
            selId?: number | null;
            hovId?: number | null;
            hl?: Set<number>;
            showPreviewFrame?: boolean;
            previewSize?: { width: number; height: number };
        } = {}
    ) => {
        const {
            scale = 1,
            selRect = null,
            selSet = new Set<number>(),
            selId = null,
            hovId = null,
            hl = new Set<number>(),
            showPreviewFrame = false,
            previewSize: pSize = { width: 4900, height: 3500 },
        } = opts;

        // ── Preview frame (khung ảnh xuất, chỉ hiện trên canvas làm việc) ──
        if (showPreviewFrame) {
            const nodes = Object.values(lmap);
            if (nodes.length) {
                let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
                nodes.forEach((n: Node) => {
                    x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y);
                    x1 = Math.max(x1, n.x + CANVAS_NW); y1 = Math.max(y1, n.y + CANVAS_NH);
                });
                const gen1Nodes = nodes.filter((n: Node) => n.doiThuoc === 1);
                const treeCenterX = gen1Nodes.length >= 2
                    ? (gen1Nodes[0].x + gen1Nodes[1].x + CANVAS_NW) / 2
                    : (x0 + x1) / 2;
                const scaleFactor = 2.5;
                const frameW = pSize.width / scaleFactor;
                const frameH = pSize.height / scaleFactor;
                const translateX = frameW / 2 - treeCenterX - 50;
                const translateY = 100;
                const frameX = -translateX;
                const frameY = -translateY;
                ctx.save();
                if (primaryBg.complete && primaryBg.naturalWidth !== 0) {
                    ctx.drawImage(primaryBg, frameX, frameY, frameW, frameH);
                } else {
                    ctx.strokeStyle = '#ff0000';
                    ctx.setLineDash([4 / scale, 2 / scale]);
                    ctx.lineWidth = 2 / scale;
                    ctx.strokeRect(frameX, frameY, frameW, frameH);
                }
                ctx.restore();
            }
        }

        // ── Bend points ──
        edges.forEach((e: any) => {
            if (e.type === 'parent' && e.bendX !== undefined && e.bendY !== undefined) {
                const mod = edgeMods[e.id];
                const bendX = mod?.bendX != null ? mod.bendX : e.bendX;
                const bendY = mod?.bendY != null ? mod.bendY : e.bendY;
                ctx.save();
                ctx.fillStyle = T.parent;
                ctx.beginPath();
                ctx.arc(bendX, bendY, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        // ── Selection rect ──
        if (selRect) {
            ctx.save();
            ctx.strokeStyle = '#4070e8';
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([4 / scale, 2 / scale]);
            ctx.strokeRect(
                Math.min(selRect.x0, selRect.x1),
                Math.min(selRect.y0, selRect.y1),
                Math.abs(selRect.x1 - selRect.x0),
                Math.abs(selRect.y1 - selRect.y0),
            );
            ctx.restore();
        }

        // ── Nodes ──
        const hasHl = hl.size > 0;
        const hasGroup = selSet.size > 0;
        Object.values(lmap).forEach((n: Node) => {
            const isSelected = selSet.has(n.id);
            drawNodeFn(
                ctx, n,
                n.id === hovId,
                true,
                isSelected || n.id === selId,
                hasGroup ? isSelected : (hasHl && hl.has(n.id)),
                hasGroup ? !isSelected : (hasHl && !hl.has(n.id)),
                T,
                imageCache.current,
            );
        });

        // ── Edges ──
        edges.forEach((e: any) => drawEdgeFn(ctx, e, T, lineStyle, edgeMods));
    }, [lineStyle]);

    // ─────────────────────────────────────────────────────────────────
    //  draw() — canvas làm việc
    // ─────────────────────────────────────────────────────────────────
    const draw = useCallback(() => {
        const c = cvs.current; if (!c) return;
        const ctx = c.getContext('2d')!;
        const { scale, ox, oy, lmap, edges, edgeMods, hovId, selId,
                selSet, selRect, hl, dark } = R.current;
        const T = dark ? TH.dark : TH.light;
        const W = c.width, H = c.height;
        const dpr = window.devicePixelRatio || 1;

        // Phase 1: background + grid (screen space, trước khi transform)
        ctx.save();
        ctx.drawImage(background, 0, 0, W, H);
        ctx.fillStyle = T.bg; ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

        const gs = 41 * scale * dpr;
        const gox = ((ox * dpr % gs) + gs) % gs;
        const goy = ((oy * dpr % gs) + gs) % gs;
        ctx.strokeStyle = T.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
        for (let x = gox; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = goy; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.restore();

        // Phase 2: tree (world space)
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);
        renderTreeContent(ctx, lmap, edges, edgeMods, T, {
            scale,
            selRect, selSet, selId, hovId, hl,
            showPreviewFrame: true,
            previewSize,
        });
        ctx.restore();
    }, [renderTreeContent, previewSize]);

    // ─────────────────────────────────────────────────────────────────
    //  buildOffscreenCanvas() — dùng chung cho preview + download
    // ─────────────────────────────────────────────────────────────────
  const buildOffscreenCanvas = useCallback((): HTMLCanvasElement | null => {
    const nodes = Object.values(R.current.lmap);
    if (!nodes.length) return null;

    const T = dark ? TH.dark : TH.light;
    const canvasWidth  = previewSize.width  * SCALE_LAN;
    const canvasHeight = previewSize.height * SCALE_LAN;

    // ── Tính bounds thực tế của cây ──
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    nodes.forEach((n: Node) => {
        const nw = (getNodeSizeGen(n.gen || 1) || { NW }).NW;
        const nh = (getNodeSizeGen(n.gen || 1) || { NH }).NH;
        x0 = Math.min(x0, n.x);
        y0 = Math.min(y0, n.y);
        x1 = Math.max(x1, n.x + nw);
        y1 = Math.max(y1, n.y + nh);
    });

    const treeW = x1 - x0;
    const treeH = y1 - y0;

    // ── Thông số layout ảnh xuất ──
    const scaledHpbgW = 1500 * SCALE_LAN;
    const hpbgX = (canvasWidth - scaledHpbgW) / 2;
    const hpbgY = 200 * SCALE_LAN;
    const scaleFactor = 4;

    // ── CÔNG THỨC ĐÚNG ──
    // Muốn top của cây (y0) nằm ở vị trí targetY trong offscreen canvas
    // Sau khi scale(scaleFactor): vị trí pixel thực = coord * scaleFactor + translate
    // Vậy: targetY = y0 * scaleFactor + translateY
    //   => translateY = targetY - y0 * scaleFactor

    const paddingTop = 60 * SCALE_LAN;   // khoảng cách từ top decoration đến cây
    const targetY = hpbgY + paddingTop;   // pixel trong offscreen canvas nơi cây bắt đầu

    // Căn cây nằm giữa theo chiều ngang trong vùng background
    const hpbgCenterX = hpbgX + scaledHpbgW / 2;
    const treeCenterX = (x0 + x1) / 2;
    const targetX = hpbgCenterX;         // pixel trong offscreen canvas: tâm cây

    const translateX = (targetX / scaleFactor) - treeCenterX - 30;
const translateY = (targetY / scaleFactor) - y0 - 40;

    // ── Tạo offscreen canvas ──
    const offscreen = document.createElement('canvas');
    offscreen.width  = canvasWidth;
    offscreen.height = canvasHeight;
    const offCtx = offscreen.getContext('2d')!;

    // Phase 1: background + decorations (screen space)
    if (primaryBg.complete && primaryBg.naturalWidth !== 0) {
        offCtx.drawImage(primaryBg, 0, 0, canvasWidth, canvasHeight);
    } else {
        offCtx.fillStyle = '#fff6d0';
        offCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        offCtx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);
    }

    // Chips thống kê
    const gen1Nodes = nodes.filter((n: any) => n.doiThuoc === 1);
    const memberCount = nodes.length;
    const maleCount   = nodes.filter((n: any) => n.gioiTinh === 1).length;
    const femaleCount = memberCount - maleCount;
    const hienTuc = gen1Nodes
        .reduce((s: number, n: any) => s + (n.pids?.length || 0), 0);
    const chipSize = 410 * SCALE_LAN;
    const xStart = hpbgX - 60 * SCALE_LAN;
    const yChip  = hpbgY + 2899 * SCALE_LAN;
    [
        `Tộc Nhân: ${memberCount}`,
        `Nam Đinh: ${maleCount}`,
        `Nữ Khuê: ${femaleCount}`,
        `Hiền Tức: ${hienTuc}`,
    ].forEach((value, i) => {
        const XChip = xStart + i * (chipSize);
        offCtx.fillStyle = '#333';
        offCtx.font = `bold ${24 * SCALE_LAN}px Arial`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(value, XChip + chipSize / 2, yChip + chipSize / 2);
    });

    // Phase 2: tree (world space)
    offCtx.save();
offCtx.scale(scaleFactor, scaleFactor);
offCtx.translate(translateX, translateY);  // world units, không chia lại
renderTreeContent(offCtx, R.current.lmap, R.current.edges, R.current.edgeMods, T);
offCtx.restore();

    return offscreen;
}, [dark, previewSize, renderTreeContent]);
    // ─────────────────────────────────────────────────────────────────
    //  previewAsImage() — dùng buildOffscreenCanvas
    // ─────────────────────────────────────────────────────────────────
    const previewAsImage = useCallback(() => {
        const offscreen = buildOffscreenCanvas();
        if (!offscreen) return;
        setPreviewImageSrc(offscreen.toDataURL('image/png'));
        setShowPreviewModal(true);
        setShowDownloadMenu(false);
    }, [buildOffscreenCanvas]);

    // ─────────────────────────────────────────────────────────────────
    //  downloadAsImage() — tái dùng preview đã có, hoặc build mới
    // ─────────────────────────────────────────────────────────────────
    const downloadAsImage = useCallback(() => {
        const doDownload = (href: string) => {
            const link = document.createElement('a');
            link.href = href;
            link.download = `family-tree-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        };

        // Nếu preview đang mở, dùng lại ảnh đó
        if (previewImageSrc) {
            doDownload(previewImageSrc);
            setShowPreviewModal(false);
            setShowDownloadMenu(false);
            return;
        }

        // Ngược lại, build offscreen canvas mới
        const offscreen = buildOffscreenCanvas();
        if (!offscreen) return;
        offscreen.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            doDownload(url);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }, [buildOffscreenCanvas, previewImageSrc]);

    // ─────────────────────────────────────────────────────────────────
    //  miniDraw
    // ─────────────────────────────────────────────────────────────────
    const miniDraw = useCallback(() => {
        const c = miniCvs.current; if (!c) return;
        const ctx = c.getContext('2d')!;
        const { lmap, edges, edgeMods } = R.current;
        const T = dark ? TH.dark : TH.light;
        ctx.clearRect(0, 0, c.width, c.height);
        const nodes = Object.values(lmap);
        if (!nodes.length) return;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        nodes.forEach((n: Node) => {
            x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y);
            x1 = Math.max(x1, n.x + CANVAS_NW); y1 = Math.max(y1, n.y + CANVAS_NH);
        });
        const scale = Math.min(c.width / (x1 - x0), c.height / (y1 - y0)) * 0.9;
        const tx = (c.width  - (x1 - x0) * scale) / 2 - x0 * scale;
        const ty = (c.height - (y1 - y0) * scale) / 2 - y0 * scale;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        nodes.forEach((n: Node) => {
            const male = n.gioiTinh === 1;
            const dead = !!n.ngayMat;
            ctx.fillStyle = dead ? '#888' : male ? '#4070e8' : '#cc3898';
            ctx.fillRect(n.x, n.y, CANVAS_NW, CANVAS_NH);
        });
        edges.forEach((e: any) => drawEdgeFn(ctx, e, T, lineStyle, edgeMods));
        ctx.restore();
    }, [dark, lineStyle]);

    const sched = useCallback(() => {
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => { draw(); miniDraw(); });
    }, [draw, miniDraw]);

    const fitAll = useCallback(() => {
        const c = cvs.current; if (!c || !container.current) return;
        const nodes = Object.values(R.current.lmap); if (!nodes.length) return;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        nodes.forEach((n: Node) => {
            x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y);
            x1 = Math.max(x1, n.x + CANVAS_NW); y1 = Math.max(y1, n.y + CANVAS_NH);
        });
        const pad = 50;
        const sw = container.current.offsetWidth;
        const sh = container.current.offsetHeight;
        const sc = Math.min(sw / (x1 - x0 + pad * 2), sh / (y1 - y0 + pad * 2), 1.4);
        R.current.scale = sc;
        R.current.ox = (sw - (x1 - x0 + pad * 2) * sc) / 2 - (x0 - pad) * sc;
        R.current.oy = (sh - (y1 - y0 + pad * 2) * sc) / 2 - (y0 - pad) * sc;
        setScaleDisplay(sc);
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => { draw(); miniDraw(); });
    }, [draw, miniDraw]);

    // ── Layout updates ──
    const { il, ie, gr } = useMemo(() => {
        const l = layout(norm as (RawNode & { fid: number | null; mid: number | null; pids: number[] })[]) as any;
        const genRegs = l.genRegions || {};
        const nodeMap = Object.fromEntries(Object.entries(l).filter(([k]) => k !== 'genRegions'));
        return { il: nodeMap as Record<number, Node>, ie: buildEdges(norm, nodeMap as Record<number, Node>), gr: genRegs };
    }, [norm]);

    useEffect(() => {
        if (!norm.length) return;
        const l = layout(norm as (RawNode & { fid: number | null; mid: number | null; pids: number[] })[]);
        const genRegs = (l as any).genRegions || {};
        const nodeMap = Object.fromEntries(Object.entries(l).filter(([k]) => k !== 'genRegions')) as Record<number, Node>;
        R.current.lmap = nodeMap;
        R.current.edges = buildEdges(norm, nodeMap);
        R.current.genRegions = genRegs;
        fitAll();
        sched();
    }, [norm, fitAll, sched]);

    useEffect(() => {
        try { R.current.lmap = structuredClone(il) as Record<number, Node>; }
        catch { R.current.lmap = JSON.parse(JSON.stringify(il)) as Record<number, Node>; }
        R.current.edges = ie;
        R.current.genRegions = gr;
        requestAnimationFrame(() => fitAll());
    }, [il, ie, gr, fitAll]);

    // ── Load edge coordinates ──
    useEffect(() => {
        if (edgeCoordinatesQuery.data && Array.isArray(edgeCoordinatesQuery.data.data)) {
            const edgeMods: Record<string, EdgeMod> = {};
            edgeCoordinatesQuery.data.data.forEach((edge: any) => {
                const mod: EdgeMod = {};
                if (edge.bendX != null) mod.bendX = edge.bendX;
                if (edge.bendY != null) mod.bendY = edge.bendY;
                if (edge.dx != null) mod.dx = edge.dx;
                if (edge.dy != null) mod.dy = edge.dy;
                if (edge.cp1x != null && edge.cp1y != null) mod.cp1 = { x: edge.cp1x, y: edge.cp1y };
                if (edge.cp2x != null && edge.cp2y != null) mod.cp2 = { x: edge.cp2x, y: edge.cp2y };
                edgeMods[edge.edgeId] = mod;
            });
            R.current.edgeMods = edgeMods;
            sched();
        }
    }, [edgeCoordinatesQuery.data, sched]);

    // ── Load images ──
    useEffect(() => {
        norm.forEach(n => {
            if (n.anhChanDung && !imageCache.current[n.id]) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = n.anhChanDung;
                img.onload = () => {
                    imageCache.current[n.id] = img;
                    requestAnimationFrame(() => {
                        if (raf.current) cancelAnimationFrame(raf.current);
                        raf.current = requestAnimationFrame(draw);
                    });
                };
                img.onerror = () => { imageCache.current[n.id] = null; };
            }
        });
    }, [norm, draw]);

    useEffect(() => {
        primaryBg.onload = () => {
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(draw);
        };
    }, [draw]);

    // ── Helpers ──
    const cssPx = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        const c = cvs.current!;
        const rect = c.getBoundingClientRect();
        const src = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as MouseEvent);
        return {
            sx: (src as Touch | MouseEvent).clientX - rect.left,
            sy: (src as Touch | MouseEvent).clientY - rect.top,
        };
    };

    const toWorld = (sx: number, sy: number) => ({
        x: (sx - R.current.ox) / R.current.scale,
        y: (sy - R.current.oy) / R.current.scale,
    });

    const findEdgeAt = useCallback((wx: number, wy: number) => {
        const THRESH = 5;
        for (const e of R.current.edges) {
            if (e.type === 'parent' && e.bendX !== undefined && e.bendY !== undefined) {
                const mod = R.current.edgeMods[e.id];
                const ox = mod?.dx ?? 0;
                const oy = mod?.dy ?? 0;
                const bendX = (mod?.bendX != null ? mod.bendX : e.bendX) + ox;
                const bendY = (mod?.bendY != null ? mod.bendY : e.bendY) + oy;
                if (Math.hypot(wx - bendX, wy - bendY) < THRESH) return { ...e, handle: 'bend' };
            }
        }
        return null;
    }, []);

    const pushUndo = useCallback(() => {
        const r = R.current;
        r.undoStack.push({ lmap: structuredClone(r.lmap), edgeMods: structuredClone(r.edgeMods) });
        if (r.undoStack.length > r.maxUndo) r.undoStack.shift();
    }, []);

    const undo = useCallback(() => {
        const r = R.current;
        if (r.undoStack.length > 0) {
            const prev = r.undoStack.pop()!;
            r.lmap = prev.lmap;
            r.edgeMods = prev.edgeMods;
            r.edges = buildEdges(norm, r.lmap);
            sched();
        }
    }, [norm, sched]);

    const debouncedSaveCoordinates = useCallback(() => {
        if (!dongHoId) return;
        if (saveCoordinatesTimeoutRef.current) clearTimeout(saveCoordinatesTimeoutRef.current);
        saveCoordinatesTimeoutRef.current = setTimeout(() => {
            const rounded = Object.values(R.current.lmap).map((node: any) => ({
                thanhVienId: node.id,
                toaDoX: Math.round(node.x / 3) * 3,
                toaDoY: Math.round(node.y / 3) * 3,
            }));
            saveCoordinates(dongHoId, rounded).catch(console.error);
        }, 500);
    }, [dongHoId]);

    const debouncedSaveEdgeCoordinates = useCallback(() => {
        if (!dongHoId) return;
        if (saveEdgeCoordinatesTimeoutRef.current) clearTimeout(saveEdgeCoordinatesTimeoutRef.current);
        saveEdgeCoordinatesTimeoutRef.current = setTimeout(() => {
            const edgeCoordsToSave = Object.entries(R.current.edgeMods).map(([edgeId, mod]) => ({
                edgeId,
                bendX: mod.bendX ?? null, bendY: mod.bendY ?? null,
                dx: mod.dx ?? null, dy: mod.dy ?? null,
                cp1x: mod.cp1?.x ?? null, cp1y: mod.cp1?.y ?? null,
                cp2x: mod.cp2?.x ?? null, cp2y: mod.cp2?.y ?? null,
            }));
            if (edgeCoordsToSave.length > 0) saveEdgeCoordinates(dongHoId, edgeCoordsToSave).catch(console.error);
        }, 500);
    }, [dongHoId]);

    // ── Mouse events ──
    const onDown = useCallback((e: React.MouseEvent) => {
        const r = R.current;
        if (e.button === 2) {
            e.preventDefault();
            const { sx, sy } = cssPx(e);
            const { x: wx, y: wy } = toWorld(sx, sy);
            const h = hit(r.lmap, wx, wy);
            if (h !== null) { onNodeContextMenu?.(e, { id: String(h) }); }
            else { onPaneContextMenu?.(e); }
            return;
        }
        const { sx, sy } = cssPx(e);
        const { x: wx, y: wy } = toWorld(sx, sy);
        const h = hit(r.lmap, wx, wy);

        if (h !== null) {
            if (e.ctrlKey) {
                if (r.selSet.has(h)) r.selSet.delete(h); else r.selSet.add(h);
            } else {
                if (!r.selSet.has(h)) { r.selSet.clear(); r.selSet.add(h); }
            }
            r.selId = h;
            pushUndo();
            const ids = Array.from(r.selSet);
            if (ids.length > 1) {
                const offsets: Record<number, { dx: number; dy: number }> = {};
                ids.forEach((id: number) => {
                    offsets[id] = { dx: wx - r.lmap[id].x, dy: wy - r.lmap[id].y };
                });
                r.groupDrag = { ids, offsets };
            } else {
                r.dragId = h;
                r.dragDX = wx - r.lmap[h].x;
                r.dragDY = wy - r.lmap[h].y;
            }
            r.selRect = null;
        } else {
            const edgeHit = findEdgeAt(wx, wy);
            if (edgeHit && edgeHit.handle === 'bend') {
                pushUndo();
                r.edgeDrag = {
                    edgeId: edgeHit.id,
                    handle: 'bend',
                    startWx: wx, startWy: wy,
                    startBendX: R.current.edgeMods[edgeHit.id]?.bendX ?? edgeHit.bendX,
                    startBendY: R.current.edgeMods[edgeHit.id]?.bendY ?? edgeHit.bendY,
                };
                r.selRect = null;
                return;
            }
            r.selId = null;
            r.groupDrag = null;
            if (e.ctrlKey) {
                r.panning = true;
                r.panStart = { sx, sy, ox: r.ox, oy: r.oy };
                cvs.current!.style.cursor = 'grabbing';
            } else {
                r.selSet.clear();
                r.selRect = { x0: wx, y0: wy, x1: wx, y1: wy };
                cvs.current!.style.cursor = 'crosshair';
            }
        }
        sched();
    }, [sched, findEdgeAt, pushUndo, onNodeContextMenu, onPaneContextMenu]);

    const onMove = useCallback((e: React.MouseEvent) => {
        const { sx, sy } = cssPx(e);
        const { x: wx, y: wy } = toWorld(sx, sy);
        const r = R.current;

        if (r.panning && r.panStart) {
            r.ox = r.panStart.ox + sx - r.panStart.sx;
            r.oy = r.panStart.oy + sy - r.panStart.sy;
            cvs.current!.style.cursor = 'grabbing';
            sched(); return;
        }

        if (r.groupDrag) {
            const { ids, offsets } = r.groupDrag;
            ids.forEach((id: number) => {
                const node = r.lmap[id];
                const off = offsets[id];
                node.x = Math.round((wx - off.dx) / 3) * 3;
                node.y = Math.round((wy - off.dy) / 3) * 3;
                (node.pids || []).forEach((sid: number) => {
                    const s = r.lmap[sid];
                    if (s) s.y = node.y;
                });
            });
            r.edges = buildEdges(norm, r.lmap);
            debouncedSaveCoordinates();
            sched(); return;
        }

        if (r.dragId !== null) {
            const draggedNode = r.lmap[r.dragId];
            draggedNode.x = Math.round((wx - r.dragDX) / 6) * 6;
            draggedNode.y = Math.round((wy - r.dragDY) / 6) * 6;
            (draggedNode.pids || []).forEach((sid: number) => {
                const s = r.lmap[sid];
                if (s) s.y = draggedNode.y;
            });
            r.edges = buildEdges(norm, r.lmap);
            debouncedSaveCoordinates();
            sched(); return;
        }

        if (r.edgeDrag) {
            const { edgeId, startWx, startWy, startBendX, startBendY } = r.edgeDrag;
            if (startBendX !== undefined && startBendY !== undefined) {
                r.edgeMods[edgeId] = {
                    ...r.edgeMods[edgeId],
                    bendX: Math.round((startBendX + wx - startWx) / 6) * 6,
                    bendY: Math.round((startBendY + wy - startWy) / 6) * 6,
                };
                debouncedSaveEdgeCoordinates();
            }
            sched(); return;
        }

        if (r.selRect) {
            cvs.current!.style.cursor = 'crosshair';
            r.selRect.x1 = wx; r.selRect.y1 = wy;
            const rx0 = Math.min(r.selRect.x0, r.selRect.x1);
            const ry0 = Math.min(r.selRect.y0, r.selRect.y1);
            const rx1 = Math.max(r.selRect.x0, r.selRect.x1);
            const ry1 = Math.max(r.selRect.y0, r.selRect.y1);
            r.selSet.clear();
            Object.values(r.lmap).forEach((n: any) => {
                const cx = n.x + CANVAS_NW / 2;
                const cy = n.y + CANVAS_NH / 2;
                if (cx >= rx0 && cx <= rx1 && cy >= ry0 && cy <= ry1) r.selSet.add(n.id);
            });
            sched(); return;
        }

        const h = hit(r.lmap, wx, wy);
        if (h !== r.hovId) {
            r.hovId = h;
            cvs.current!.style.cursor = h !== null ? 'pointer' : 'grab';
            sched();
        }
    }, [sched, norm, debouncedSaveCoordinates, debouncedSaveEdgeCoordinates]);

    const onUp = useCallback(() => {
        const r = R.current;
        r.panning = false; r.panStart = null;
        r.dragId = null; r.groupDrag = null;
        if (r.edgeDrag) debouncedSaveEdgeCoordinates();
        r.edgeDrag = null;
        if (r.selRect) r.selRect = null;
    }, [debouncedSaveEdgeCoordinates]);

    const onDbl = useCallback((e: React.MouseEvent) => {
        const { sx, sy } = cssPx(e);
        const { x, y } = toWorld(sx, sy);
        const h = hit(R.current.lmap, x, y);
        if (h !== null) {
            if (!R.current.selSet.has(h)) { R.current.selSet.clear(); R.current.selSet.add(h); }
            R.current.selId = h;
            onSelectMember?.(h);
        }
    }, [onSelectMember]);

    const onClick = useCallback((e: React.MouseEvent) => {
        const { sx, sy } = cssPx(e);
        const { x, y } = toWorld(sx, sy);
        const h = hit(R.current.lmap, x, y);
        if (h !== null) {
            if (!R.current.selSet.has(h)) { R.current.selSet.clear(); R.current.selSet.add(h); }
            R.current.selId = h;
        } else if (!e.ctrlKey) {
            R.current.selSet.clear();
            R.current.selId = null;
        }
        sched();
    }, [sched]);

    // ── Wheel ──
    useEffect(() => {
        const c = cvs.current!;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const rect = c.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const r = R.current;
            const f = e.deltaY > 0 ? 0.88 : 1.14;
            const ns = Math.max(0.05, Math.min(5, r.scale * f));
            r.ox = sx - (sx - r.ox) * (ns / r.scale);
            r.oy = sy - (sy - r.oy) * (ns / r.scale);
            r.scale = ns;
            setScaleDisplay(ns);
            sched();
        };
        c.addEventListener('wheel', handler, { passive: false });
        return () => c.removeEventListener('wheel', handler);
    }, [sched]);

    // ── Toolbar drag ──
    const onToolbarMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingToolbar(true);
        setDragStart({ x: e.clientX, y: e.clientY, top: toolbarPos.top, left: toolbarPos.left });
    }, [toolbarPos]);

    const onToolbarMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingToolbar) return;
        setToolbarPos({
            top: Math.max(0, dragStart.top + e.clientY - dragStart.y),
            left: Math.max(0, dragStart.left + e.clientX - dragStart.x),
        });
    }, [isDraggingToolbar, dragStart]);

    const onToolbarMouseUp = useCallback(() => setIsDraggingToolbar(false), []);

    useEffect(() => {
        if (isDraggingToolbar) {
            document.addEventListener('mousemove', onToolbarMouseMove);
            document.addEventListener('mouseup', onToolbarMouseUp);
            return () => {
                document.removeEventListener('mousemove', onToolbarMouseMove);
                document.removeEventListener('mouseup', onToolbarMouseUp);
            };
        }
    }, [isDraggingToolbar, onToolbarMouseMove, onToolbarMouseUp]);

    const onSearch = useCallback((q: string) => {
        setSearch(q);
        const r = R.current;
        if (!q.trim()) {
            r.hl = new Set(); setMatches(0);
        } else {
            const ql = q.toLowerCase();
            const found = norm.filter(n =>
                n.hoTen?.toLowerCase().includes(ql) ||
                n.ngheNghiep?.toLowerCase().includes(ql) ||
                n.noiSinh?.toLowerCase().includes(ql)
            );
            r.hl = new Set(found.map(n => n.id));
            setMatches(found.length);
            if (found.length && container.current) {
                const first = r.lmap[found[0].id];
                if (first) {
                    r.ox = container.current.offsetWidth  / 2 - (first.x + CANVAS_NW / 2) * r.scale;
                    r.oy = container.current.offsetHeight / 2 - (first.y + CANVAS_NH / 2) * r.scale;
                }
            }
        }
        sched();
    }, [norm, sched]);

    const zoom = useCallback((f: number) => {
        if (!container.current) return;
        const r = R.current;
        const cx = container.current.offsetWidth  / 2;
        const cy = container.current.offsetHeight / 2;
        const ns = Math.max(0.05, Math.min(5, r.scale * f));
        r.ox = cx - (cx - r.ox) * (ns / r.scale);
        r.oy = cy - (cy - r.oy) * (ns / r.scale);
        r.scale = ns;
        setScaleDisplay(ns);
        sched();
    }, [sched]);

    const downloadAsPDF = useCallback(() => {
        console.log('PDF download coming soon');
        setShowDownloadMenu(false);
    }, []);

    useEffect(() => { R.current.dark = dark; sched(); }, [dark, sched]);

    useEffect(() => {
        const c = cvs.current!;
        const dpr = window.devicePixelRatio || 1;
        const ro = new ResizeObserver(() => {
            if (!container.current) return;
            const w = container.current.offsetWidth;
            const h = container.current.offsetHeight;
            c.width = w * dpr; c.height = h * dpr;
            c.style.width = w + 'px'; c.style.height = h + 'px';
            sched();
        });
        if (container.current) ro.observe(container.current);
        return () => {
            ro.disconnect();
            if (saveCoordinatesTimeoutRef.current) clearTimeout(saveCoordinatesTimeoutRef.current);
            if (saveEdgeCoordinatesTimeoutRef.current) clearTimeout(saveEdgeCoordinatesTimeoutRef.current);
        };
    }, [sched]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo]);

    const T_tb = T;

    return (
        <div ref={container} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: T.bg }} onContextMenu={(e) => e.preventDefault()}>

            <canvas
                ref={cvs}
                style={{ display: 'block', position: 'absolute', inset: 0, cursor: 'grab' }}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onDoubleClick={onDbl}
                onClick={onClick}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* ═══ TOOLBAR ═══ */}
            <div style={{
                position: 'absolute', top: toolbarPos.top, left: toolbarPos.left,
                display: 'flex', gap: 6, alignItems: 'center',
                background: T_tb.tb, backdropFilter: 'blur(16px)',
                border: `1px solid ${T_tb.tbBdr}`, borderRadius: 8,
                padding: '6px 14px', boxShadow: '0 4px 24px rgba(0,0,0,0.11)',
                zIndex: 10, whiteSpace: 'nowrap', flexWrap: 'wrap',
                cursor: isDraggingToolbar ? 'grabbing' : 'grab',
            }}>
                <button onMouseDown={onToolbarMouseDown} style={{ width: 20, height: 20, borderRadius: 4, padding: 0, border: 'none', background: 'transparent', color: T_tb.btnClr, cursor: 'grab', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 2 }} title="Kéo để di chuyển toolbar">⋮⋮</button>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 8, fontSize: 14, color: T_tb.inpClr, opacity: 0.4 }}><Search size={12} /></span>
                    <input placeholder="Tìm tên, nghề nghiệp..." value={search} onChange={e => onSearch(e.target.value)} style={{ paddingLeft: 24, paddingRight: matches ? 28 : 8, paddingTop: 4, paddingBottom: 4, borderRadius: 20, border: `1px solid ${T_tb.inpBdr}`, background: T_tb.inp, color: T_tb.inpClr, fontSize: 14, width: 170, outline: 'none' }} />
                    {matches > 0 && <span style={{ position: 'absolute', right: 7, background: '#4070e8', color: '#fff', borderRadius: 10, fontSize: 9, padding: '1px 5px', fontWeight: 700 }}>{matches}</span>}
                </div>

                <Divider T={T_tb} />

                <span style={{ fontSize: 15, color: T_tb.btnClr, whiteSpace: 'nowrap' }}>Hiển thị:</span>
                <select value={maxGen} onChange={e => setMaxGen(Number(e.target.value))} style={{ padding: '3px 6px', borderRadius: 8, border: `1px solid ${T_tb.inpBdr}`, background: T_tb.inp, color: T_tb.inpClr, fontSize: 15, cursor: 'pointer', outline: 'none' }}>
                    {allGens.map(g => <option key={g} value={g}>Đến đời {g}</option>)}
                    {!allGens.includes(maxGen) && <option value={maxGen}>Đến đời {maxGen}</option>}
                </select>

                <Divider T={T_tb} />
                <Btn onClick={() => zoom(1.15)} T={T_tb}>＋</Btn>
                <span style={{ fontSize: 14, minWidth: 36, textAlign: 'center', color: T_tb.btnClr, fontVariantNumeric: 'tabular-nums' }}>{Math.round(scaleDisplay * 100)}%</span>
                <Btn onClick={() => zoom(0.87)} T={T_tb}>－</Btn>
                <Btn onClick={fitAll} T={T_tb} title="Vừa màn hình">⊡</Btn>
                <Divider T={T_tb} />

                <div style={{ position: 'relative' }}>
                    <Btn onClick={() => setShowSettings(s => !s)} T={T_tb} active={showSettings} title="Tùy chỉnh"><Workflow size={15} /></Btn>
                    {showSettings && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: T_tb.tb, border: `1px solid ${T_tb.tbBdr}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 200, zIndex: 1000 }}>
                            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T_tb.tbBdr}`, fontSize: 15, fontWeight: 700, color: T_tb.ttl }}>Kiểu nối</div>
                            {(['curved', 'square'] as const).map(style => (
                                <div key={style} onClick={() => { setLineStyle(style); setShowSettings(false); }} style={{ padding: '8px 12px', cursor: 'pointer', background: lineStyle === style ? T_tb.inp : 'transparent', color: lineStyle === style ? T_tb.ttl : T_tb.btnClr, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 16, height: 16, borderRadius: 3, background: lineStyle === style ? '#4070e8' : T_tb.inpBdr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff' }}>{lineStyle === style ? '✓' : ''}</span>
                                    {style === 'curved' ? 'Nối uốn lượn' : 'Nối vuông góc'}
                                </div>
                            ))}
                            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T_tb.tbBdr}`, fontSize: 15, fontWeight: 700, color: T_tb.ttl }}>Kích thước preview</div>
                            {[{ label: '10000x8000', value: { width: 10000, height: 8000 } }, { label: '8000x6000', value: { width: 8000, height: 6000 } }, { label: '6000x4000', value: { width: 6000, height: 4000 } }].map(option => (
                                <div key={option.label} onClick={() => { setPreviewSize(option.value); setShowSettings(false); }} style={{ padding: '8px 12px', cursor: 'pointer', background: previewSize.width === option.value.width ? T_tb.inp : 'transparent', color: previewSize.width === option.value.width ? T_tb.ttl : T_tb.btnClr, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 16, height: 16, borderRadius: 3, background: previewSize.width === option.value.width ? '#4070e8' : T_tb.inpBdr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff' }}>{previewSize.width === option.value.width ? '✓' : ''}</span>
                                    {option.label} px
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Divider T={T_tb} />
                <Btn onClick={() => setDark(d => !d)} T={T_tb} active={dark} title="Đổi chủ đề">{dark ? <Sun size={15} /> : <Moon size={15} />}</Btn>
            </div>

            {/* ═══ LEGEND ═══ */}
            <div style={{ width: "auto", height: legendExtended ? 'auto' : 40, fontFamily: 'Segoe UI, sans-serif', position: 'absolute', top: 70, left: 14, background: T.lg, backdropFilter: 'blur(12px)', border: `1px solid ${T.tbBdr}`, borderRadius: 10, padding: '8px 12px', fontSize: 15, zIndex: 10, transitionDuration: '0.3s' }}>
                <div onClick={() => setLegendExtended(!legendExtended)} style={{ fontWeight: 800, marginBottom: 6, color: T.ttl, fontFamily: 'monospace', display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", cursor: "pointer" }}>
                    <span>Chú thích & Hướng dẫn</span>
                    <button style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{legendExtended ? <ChevronLeft /> : <ChevronRight />}</button>
                </div>
                <div style={{ display: legendExtended ? "block" : "none" }}>
                    {[['#4070e8', '♂ Nam'], ['#cc3898', '♀ Nữ'], ['#888', '✦ Đã mất']].map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                            <span style={{ color: T.gen, fontSize: 15 }}>{l}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${T.inpBdr}`, marginTop: 8, paddingTop: 6 }}>
                        {([[T.parent, false, 'Cha/Mẹ → Con'], [T.spouse, true, 'Vợ / Chồng']] as [string, boolean, string][]).map(([clr, , lbl]) => (
                            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={clr} strokeWidth="1.6" /></svg>
                                <span style={{ color: T.gen, fontSize: 15 }}>{lbl}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontFamily: "monospace", borderTop: `1px solid ${T.inpBdr}`, marginTop: 8, paddingTop: 6, color: T.gen, lineHeight: 1.6, fontSize: 13 }}>
                        <strong>Phím & thao tác:</strong><br />
                        • Cuộn chuột: thu phóng<br />
                        • Giữ Ctrl + kéo: di chuyển toàn cảnh<br />
                        • Kéo không Ctrl: vùng chọn<br />
                        • Kéo node: đặt lại tọa độ<br />
                        • Ctrl+Z: hoàn tác<br />
                        • Double-click: mở chi tiết
                    </div>
                </div>
            </div>

            {/* ═══ DOWNLOAD ═══ */}
            <div style={{ position: 'absolute', top: 10, right: 14 }}>
                <button onClick={() => setShowDownloadMenu(s => !s)} title="Tải về" style={{ width: 30, height: 30, borderRadius: 6, padding: 0, border: `1px solid ${T.tbBdr}`, background: T.stat, color: T.gen, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    <Download size={24} />
                </button>
                {showDownloadMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: T.tb, border: `1px solid ${T.tbBdr}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 160, zIndex: 1000 }}>
                        {[
                            { icon: <PictureInPicture size={19} />, label: 'Xem trước', action: previewAsImage },
                            { icon: <PictureInPicture size={19} />, label: 'Tải ảnh', action: downloadAsImage },
                            { icon: <File size={19} />, label: 'Tải PDF', action: downloadAsPDF },
                        ].map(({ icon, label, action }) => (
                            <div key={label} onClick={action} style={{ padding: '10px 12px', cursor: 'pointer', color: T.btnClr, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.tbBdr}`, transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = T.inp}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                {icon} {label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ STATS ═══ */}
            <div style={{ position: 'absolute', bottom: 16, right: 14, fontSize: 10, color: T.gen, background: T.stat, backdropFilter: 'blur(8px)', border: `1px solid ${T.tbBdr}`, borderRadius: 7, padding: '3px 9px', zIndex: 10 }}>
                {norm.length} thành viên · đời 1–{maxGen}
            </div>

            {/* ═══ EDGE INFO MODAL ═══ */}
            {edgeInfo && (() => {
                const parents: any[] = [];
                if (typeof edgeInfo.a === 'string') {
                    if (edgeInfo.a.startsWith('single-')) {
                        const pid = parseInt(edgeInfo.a.split('-')[1], 10);
                        if (R.current.lmap[pid]) parents.push(R.current.lmap[pid]);
                    } else {
                        edgeInfo.a.split('-').map(Number).forEach((id: number) => { if (R.current.lmap[id]) parents.push(R.current.lmap[id]); });
                    }
                }
                const children = R.current.edges.filter((e: any) => e.type === 'parent' && e.a === edgeInfo.a).map((e: any) => R.current.lmap[e.childId]).filter(Boolean);
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setEdgeInfo(null)}>
                        <div style={{ background: T.bg, padding: 24, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', maxWidth: 400, width: '90%', color: T.gen, height: 360, overflowY: 'auto', marginTop: 70 }} onClick={ev => ev.stopPropagation()}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: 'monospace' }}>Thông tin liên kết</h2>
                            <div style={{ marginBottom: 8, fontSize: 18 }}><strong>Cha / Mẹ:</strong><ul style={{ marginLeft: 16, listStyleType: 'disc' }}>{parents.map(p => <li key={p.id}>{p.hoTen || '—'}</li>)}</ul></div>
                            <div style={{ marginBottom: 8, fontSize: 18 }}><strong>Con:</strong><ul style={{ marginLeft: 16, listStyleType: 'disc' }}>{children.map(c => <li key={c.id}>{c.hoTen || '—'}</li>)}</ul></div>
                            <button onClick={() => setEdgeInfo(null)} style={{ marginTop: 16, padding: '8px 16px', background: '#4070e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Đóng</button>
                        </div>
                    </div>
                );
            })()}

            {/* ═══ PREVIEW MODAL ═══ */}
            {showPreviewModal && previewImageSrc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPreviewModal(false)}>
                    <div style={{ background: T.bg, padding: 20, borderRadius: 8, marginTop: 150, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', maxWidth: '700px', maxHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', overflowY: 'auto' }} onClick={ev => ev.stopPropagation()}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: T.gen }}>Xem trước cây gia đình</h2>
                        <img src={previewImageSrc} alt="Family Tree Preview" style={{ maxWidth: '100%', maxHeight: '70vh', border: `1px solid ${T.tbBdr}`, borderRadius: 4 }} />
                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                            <button onClick={downloadAsImage} style={{ padding: '10px 20px', background: '#4070e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>Tải ảnh</button>
                            <button onClick={() => setShowPreviewModal(false)} style={{ padding: '10px 20px', background: T.btn, color: T.btnClr, border: `1px solid ${T.inpBdr}`, borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={miniCvs} width={200} height={150} style={{ position: 'absolute', bottom: 80, right: 20, opacity: 0.5, border: '1px solid #ccc', borderRadius: 4, pointerEvents: 'none' }} />
        </div>
    );

    function Btn({ children, onClick, T, active, title }: any) {
        return (
            <button onClick={onClick} title={title} style={{ width: 26, height: 26, borderRadius: 7, padding: 0, flexShrink: 0, border: `1px solid ${active ? '#4070e8' : T.inpBdr}`, background: active ? '#4070e8' : T.btn, color: active ? '#fff' : T.btnClr, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</button>
        );
    }

    function Divider({ T }: any) {
        return <div style={{ width: 1, height: 18, background: T.inpBdr, flexShrink: 0 }} />;
    }
}