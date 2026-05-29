"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { QueryClient } from "@tanstack/react-query";

import { ITreeNode } from "@/types/tree";
import { FamilyNode, FamilyNodeData } from "./tree/FamilyNode";
import { CompactNode } from "./tree/CompactNode";
import { PhotoNode } from "./tree/PhotoNode";
import { FamilyMemberModal } from "./FamilyMemberModal";
import { MemberCRUDModal } from "./tree/MemberCRUDModal";
import { TreeControls } from "./tree/TreeControls";
import { ContextMenu } from "./tree/ContextMenu";
import { getLayoutedElements } from "./tree/layoutUtils";
import { deleteMember } from "@/service/member.service";
import { useToast } from "@/service/useToas";
import storage from "@/utils/storage";

interface Props {
  data: ITreeNode[];
  dongHoId?: string;
  queryClient?: QueryClient;
  onDataChange?: () => void;
  treeViewMode?: "standard" | "giaPha";
  onTreeViewModeChange?: (mode: "standard" | "giaPha") => void;
}

const MyFamilyTreeInner = ({ data, dongHoId, queryClient, onDataChange, treeViewMode, onTreeViewModeChange }: Props) => {
  // ===== React Flow Hooks =====
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { showSuccess, showError } = useToast();
  
  // ===== Modal States =====
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"add" | "edit">("add");
  const [selectedMember, setSelectedMember] = useState<ITreeNode | null>(null);
  
  // ===== Tree Display States =====
  const [maxGen, setMaxGen] = useState(3);
  const [gens, setGens] = useState<number[]>([]);
  const [direction] = useState<"TB" | "BT" | "LR" | "RL">("TB");
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [layoutAlgorithm] = useState<"dagre" | "compact" | "spacious" | "balanced">("dagre");
  const [nodeTemplate] = useState<"default" | "compact" | "photo">("default");
  const [showEdgeLabels] = useState(true);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  // ===== Context Menu States =====
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);

  // ===== Dynamic Node Types =====
  const nodeTypes: NodeTypes = useMemo(() => {
    const nodeType = nodeTemplate === "compact" ? CompactNode : nodeTemplate === "photo" ? PhotoNode : FamilyNode;
    return { familyNode: nodeType };
  }, [nodeTemplate]);

  // ===== Calculate Generations =====
  useEffect(() => {
    if (!data.length) return;
    const g = [...new Set(data.map((n) => n.doiThuoc || 1))].sort((a, b) => a - b);
    setGens(g);
    setMaxGen(Math.min(3, Math.max(...g)));
  }, [data]);

  // ===== Build Graph (Nodes & Edges) =====
  const buildGraph = useCallback(() => {
    const filtered = data.filter((n) => (n.doiThuoc || 1) <= maxGen);
    
    // Tạo nodes
    const newNodes: Node<FamilyNodeData>[] = filtered.map((n) => ({
      id: String(n.id),
      type: "familyNode",
      position: { x: 0, y: 0 }, // Sẽ được tính lại bởi layout
      data: {
        memberId: n.thanhVienId,
        hoTen: n.hoTen || "Chưa rõ",
        gioiTinh: n.gioiTinh || 1,
        ngayMat: n.ngayMat ? String(n.ngayMat) : undefined,
        ngheNghiep: n.ngheNghiep || undefined,
        anhChanDung: n.anhChanDung || undefined,
        doiThuoc: n.doiThuoc || undefined,
      },
      draggable: true,
      style: highlightedNodes.length > 0 
        ? { opacity: highlightedNodes.includes(String(n.id)) ? 1 : 0.3 }
        : {},
    }));

    // Tạo edges (quan hệ cha-mẹ -> con)
    const newEdges: Edge[] = [];
    filtered.forEach((n) => {
      const childId = String(n.id);
      
      // Edge từ cha (màu xanh dương)
      if (n.fid) {
        const fatherId = String(n.fid);
        if (filtered.some((x) => String(x.id) === fatherId)) {
          newEdges.push({
            id: `f-${fatherId}-${childId}`,
            source: fatherId,
            target: childId,
            type: "smoothstep",
            animated: false,
            label: showEdgeLabels ? "Cha" : undefined,
            labelStyle: { 
              fontSize: 11, 
              fill: darkMode ? "#60a5fa" : "#1e40af",
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif"
            },
            labelBgStyle: { 
              fill: darkMode ? "#1e293b" : "#ffffff",
              fillOpacity: 0.95
            },
            labelBgPadding: [4, 6] as [number, number],
            style: { 
              stroke: darkMode ? "#60a5fa" : "#3b82f6", 
              strokeWidth: 2.5
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: darkMode ? "#60a5fa" : "#3b82f6",
              width: 20,
              height: 20
            },
          });
        }
      }
      
      // Edge từ mẹ (màu hồng)
      if (n.mid) {
        const motherId = String(n.mid);
        if (filtered.some((x) => String(x.id) === motherId)) {
          newEdges.push({
            id: `m-${motherId}-${childId}`,
            source: motherId,
            target: childId,
            type: "smoothstep",
            animated: false,
            label: showEdgeLabels ? "Mẹ" : undefined,
            labelStyle: { 
              fontSize: 11, 
              fill: darkMode ? "#f472b6" : "#be185d",
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif"
            },
            labelBgStyle: { 
              fill: darkMode ? "#1e293b" : "#ffffff",
              fillOpacity: 0.95
            },
            labelBgPadding: [4, 6] as [number, number],
            style: { 
              stroke: darkMode ? "#f472b6" : "#ec4899", 
              strokeWidth: 2.5
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: darkMode ? "#f472b6" : "#ec4899",
              width: 20,
              height: 20
            },
          });
        }
      }
    });

    // Tạo edges cho vợ chồng (pids) - màu vàng cam, nét đứt
    filtered.forEach((n) => {
      if (n.pids && n.pids.length > 0) {
        n.pids.forEach((pid) => {
          const partnerId = String(pid);
          const nodeId = String(n.id);
          if (filtered.some((x) => String(x.id) === partnerId)) {
            // Tránh duplicate edge (chỉ tạo 1 chiều)
            if (nodeId < partnerId) {
              newEdges.push({
                id: `spouse-${nodeId}-${partnerId}`,
                source: nodeId,
                target: partnerId,
                type: "straight",
                animated: false,
                label: showEdgeLabels ? "Vợ chồng" : undefined,
                labelStyle: { 
                  fontSize: 11, 
                  fill: darkMode ? "#f59e0b" : "#c2410c",
                  fontWeight: 700,
                  fontFamily: "system-ui, -apple-system, sans-serif"
                },
                labelBgStyle: { 
                  fill: darkMode ? "#1e293b" : "#ffffff",
                  fillOpacity: 0.95
                },
                labelBgPadding: [4, 8] as [number, number],
                style: { 
                  stroke: darkMode ? "#f59e0b" : "#f97316", 
                  strokeWidth: 3,
                  strokeDasharray: "8,4"
                },
              });
            }
          }
        });
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [data, maxGen, highlightedNodes]);

  // ===== Apply Layout =====
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges,
      { direction, algorithm: layoutAlgorithm }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [buildGraph, direction, layoutAlgorithm, setNodes, setEdges]);

  // ===== Print Handler =====
  const handlePrintA0 = useCallback(() => {
    localStorage.setItem("printTreeData", JSON.stringify(data));
    localStorage.setItem("printTreeNodes", JSON.stringify(nodes));
    localStorage.setItem("printTreeEdges", JSON.stringify(edges));
    window.open(`/print-preview?dongHoId=${dongHoId || ""}`, "_blank");
  }, [data, nodes, edges, dongHoId]);

  // ===== Search Handlers =====
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const performSearch = useCallback(() => {
    if (!search.trim()) {
      setHighlightedNodes([]);
      return;
    }

    // Find matching nodes
    const matches = nodes.filter((n) =>
      n.data.hoTen?.toLowerCase().includes(search.toLowerCase()) ||
      n.data.ngheNghiep?.toLowerCase().includes(search.toLowerCase())
    );
    
    const matchIds = matches.map((n) => n.id);
    setHighlightedNodes(matchIds);

    // Jump to first result
    if (matches.length > 0 && fitView) {
      setTimeout(() => {
        fitView({ 
          nodes: [matches[0]], 
          duration: 800, 
          padding: 0.5,
          maxZoom: 1.5
        });
      }, 100);
    }
  }, [search, nodes, fitView]);

  // ===== Double Click Handler =====
  const onNodeDoubleClick = useCallback((_: any, node: Node<FamilyNodeData>) => {
    setSelectedNodeData(node.data);
    setModalOpen(true);
  }, []);

  // ===== CRUD Handlers =====
  const handleAddMember = useCallback(() => {
    setCrudMode("add");
    setSelectedMember(null);
    setCrudModalOpen(true);
  }, []);

  const handleEditMember = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    
    const member = data.find((m) => m.thanhVienId === node.data.memberId);
    if (!member) return;
    
    setCrudMode("edit");
    setSelectedMember(member);
    setCrudModalOpen(true);
  }, [nodes, data]);

  const handleDeleteMember = useCallback(async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
        
    const confirmed = window.confirm(`Bạn có chắc muốn xóa thành viên "${node.data.hoTen}"?`);
    if (!confirmed) return;
    
    try {
      if (!node.data.memberId) {
        throw new Error("Không tìm thấy ID thành viên");
      }
      
      const user = storage.getUser();
      const userId = user?.nguoiDungId || "";
      const userDongHoId = user?.dongHoId;
      const finalDongHoId = dongHoId || userDongHoId;
      
      if (!finalDongHoId) {
        throw new Error("Không tìm thấy thông tin dòng họ");
      }
      
      const result = await deleteMember(
        [{ thanhVienId: node.data.memberId, dongHoId: finalDongHoId }],
        userId
      );
      
      if (result.success) {
        showSuccess("Xóa thành viên thành công!");
        
        if (queryClient && finalDongHoId) {
          queryClient.invalidateQueries({ queryKey: ["member-tree", finalDongHoId] });
        }
        if (onDataChange) {
          onDataChange();
        }
      } else {
        throw new Error(result.message || "Không thể xóa thành viên");
      }
    } catch (error: any) {
      showError(error.message || "Có lỗi xảy ra khi xóa thành viên");
    }
  }, [nodes, data, showSuccess, showError, dongHoId, queryClient, onDataChange]);
  // ===== Context Menu Handlers =====
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // ===== Node Changes Handler =====
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  // ===== Helper Functions for Modal =====
  const getNameById = useCallback((id: string | number | null | undefined) => {
    if (id == null) return "Không có";
    const numId = typeof id === "string" ? Number(id) : id;
    const person = data.find((n) => n.id === numId);
    return person?.hoTen || "Không có";
  }, [data]);

  const getChildren = useCallback((memberId: number | undefined) => {
    if (!memberId) return [];
    const parent = data.find((n) => n.thanhVienId === memberId);
    if (!parent) return [];
    
    return data
      .filter((n) => n.fid === parent.id || n.mid === parent.id)
      .map((n) => n.hoTen || "Chưa rõ");
  }, [data]);

  // ===== Render =====
  return (
    <div className={`w-full h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-b from-amber-50 to-stone-100'}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
      >
        <Background color={darkMode ? "#374151" : "#d4a574"} gap={16} />
        
        <TreeControls
          maxGen={maxGen}
          setMaxGen={setMaxGen}
          gens={gens}
          search={search}
          onSearch={handleSearch}
          onPerformSearch={performSearch}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onAddMember={handleAddMember}
          onRefresh={onDataChange}
          onPrint={handlePrintA0}
          treeViewMode={treeViewMode}
          onTreeViewModeChange={onTreeViewModeChange}
        />
      </ReactFlow>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          id={contextMenu.id}
          top={contextMenu.top}
          left={contextMenu.left}
          onClose={closeContextMenu}
          onViewDetail={() => {
            const node = nodes.find((n) => n.id === contextMenu.id);
            if (node) {
              setSelectedNodeData(node.data);
              setModalOpen(true);
            }
            closeContextMenu();
          }}
          onEdit={() => {
            handleEditMember(contextMenu.id);
            closeContextMenu();
          }}
          onDelete={() => {
            handleDeleteMember(contextMenu.id);
            closeContextMenu();
          }}
          onCenter={() => {
            const node = nodes.find((n) => n.id === contextMenu.id);
            if (node) {
              fitView({ nodes: [node], duration: 800, padding: 0.5 });
            }
            closeContextMenu();
          }}
        />
      )}


      {/* Detail Modal */}
      {selectedNodeData && (
        <FamilyMemberModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          node={{
            id: selectedNodeData.memberId,
            memberId: selectedNodeData.memberId,
            field_0: selectedNodeData.hoTen,
            field_1: selectedNodeData.ngayMat
              ? `Mất: ${new Date(selectedNodeData.ngayMat).toLocaleDateString("vi-VN")}`
              : "Còn sống",
            field_2: selectedNodeData.ngheNghiep || "Chưa rõ",
            img_0: selectedNodeData.anhChanDung,
            fid: data.find((n) => n.thanhVienId === selectedNodeData.memberId)?.fid,
            mid: data.find((n) => n.thanhVienId === selectedNodeData.memberId)?.mid,
            pids: data.find((n) => n.thanhVienId === selectedNodeData.memberId)?.pids || [],
          }}
          getNameById={getNameById}
          getChildren={getChildren}
        />
      )}

      {/* CRUD Modal */}
      <MemberCRUDModal
        open={crudModalOpen}
        onOpenChange={setCrudModalOpen}
        mode={crudMode}
        member={selectedMember}
        allMembers={data}
        dongHoId={dongHoId}
      />
    </div>
  );
};

export const MyFamilyTree = (props: Props) => (
  <ReactFlowProvider>
    <MyFamilyTreeInner {...props} />
  </ReactFlowProvider>
);
