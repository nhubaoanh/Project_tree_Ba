import { Node, Edge } from "reactflow";
import { toPng, toSvg } from "html-to-image";

/**
 * Export cây gia phả sang định dạng in A0
 */
export const exportToPrintLayout = async (
  nodes: Node[],
  edges: Edge[],
  options: {
    title?: string;
    subtitle?: string;
    dongHoName?: string;
  } = {}
) => {
  // Tạo một window mới để hiển thị print layout
  const printWindow = window.open("", "_blank");
  
  if (!printWindow) {
    alert("Vui lòng cho phép popup để mở chế độ in");
    return;
  }

  // Render tree vào print layout
  // Sẽ được implement trong component
};

/**
 * Tạo SVG từ ReactFlow để nhúng vào print layout
 */
export const generateTreeSVG = async (containerId: string = ".react-flow"): Promise<string> => {
  const element = document.querySelector(containerId) as HTMLElement;
  
  if (!element) {
    throw new Error("Không tìm thấy element cây gia phả");
  }

  try {
    const svgDataUrl = await toSvg(element, {
      quality: 1,
      backgroundColor: "transparent",
      cacheBust: true,
    });
    
    return svgDataUrl;
  } catch (error) {
    console.error("Lỗi khi tạo SVG:", error);
    throw error;
  }
};

/**
 * Tạo PNG chất lượng cao cho in ấn
 */
export const generateTreePNG = async (
  containerId: string = ".react-flow",
  scale: number = 3
): Promise<string> => {
  const element = document.querySelector(containerId) as HTMLElement;
  
  if (!element) {
    throw new Error("Không tìm thấy element cây gia phả");
  }

  try {
    const pngDataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: scale,
      backgroundColor: "white",
      cacheBust: true,
    });
    
    return pngDataUrl;
  } catch (error) {
    console.error("Lỗi khi tạo PNG:", error);
    throw error;
  }
};

/**
 * Download file từ data URL
 */
export const downloadFile = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

/**
 * Tính toán kích thước tối ưu cho in A0
 * A0 = 841mm x 1189mm (tỷ lệ 1:√2)
 */
export const calculateA0Dimensions = () => {
  const A0_WIDTH_MM = 841;
  const A0_HEIGHT_MM = 1189;
  const MM_TO_PX = 3.7795275591; // 96 DPI
  
  return {
    widthMM: A0_WIDTH_MM,
    heightMM: A0_HEIGHT_MM,
    widthPX: Math.round(A0_WIDTH_MM * MM_TO_PX),
    heightPX: Math.round(A0_HEIGHT_MM * MM_TO_PX),
  };
};

/**
 * Chuẩn bị dữ liệu cho print layout
 */
export const preparePrintData = (nodes: Node[], edges: Edge[]) => {
  // Tính toán bounding box của toàn bộ cây
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width || 180;
    const height = node.height || 140;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;
  
  return {
    bounds: { minX, minY, maxX, maxY },
    dimensions: { width: treeWidth, height: treeHeight },
    nodes,
    edges,
  };
};
