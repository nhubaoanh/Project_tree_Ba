"use client";

import { memo, useState } from "react";
import { Panel, useReactFlow } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Search, 
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Settings,
  Printer,
  X
} from "lucide-react";

interface TreeControlsProps {
  maxGen: number;
  setMaxGen: (gen: number) => void;
  gens: number[];
  search: string;
  onSearch: (query: string) => void;
  onPerformSearch: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onAddMember: () => void;
  onRefresh?: () => void;
  onPrint?: () => void;
}

export const TreeControls = memo(({
  maxGen,
  setMaxGen,
  gens,
  search,
  onSearch,
  onPerformSearch,
  darkMode,
  onToggleDarkMode,
  onAddMember,
  onRefresh,
  onPrint,
}: TreeControlsProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  return (
    <>
      {/* Top Left - Search & Filters */}
      {showLeftPanel ? (
        <Panel position="top-left" className="space-y-2">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 p-3 space-y-2">
            {/* Close button */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Điều khiển
              </span>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Đóng"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onPerformSearch();
                      }
                    }}
                    className="h-11 text-sm pr-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-all"
                      title="Xóa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPerformSearch();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  size="sm"
                  className="h-11 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-95 transition-all shadow-md"
                  title="Tìm kiếm (Enter)"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Generation Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Hiển thị đến đời:</label>
              <Select value={maxGen.toString()} onValueChange={(v) => setMaxGen(Number(v))}>
                <SelectTrigger className="h-11 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 active:scale-95 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600 bg-white/95 backdrop-blur">
                  {gens.map((g) => (
                    <SelectItem 
                      key={g} 
                      value={g.toString()}
                      className="dark:text-white dark:focus:bg-gray-700 dark:hover:bg-gray-700 cursor-pointer h-10"
                    >
                      Đời {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="w-full h-11 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 active:scale-95 transition-all hover:shadow-md"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Tải lại dữ liệu
              </Button>
            )}

            {/* Add Member Button */}
            <Button
              onClick={onAddMember}
              variant="default"
              size="sm"
              className="w-full h-11 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-900 hover:to-red-700 text-white active:scale-95 transition-all hover:shadow-lg"
            >
              Thêm thành viên
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel position="top-left">
          <button
            onClick={() => setShowLeftPanel(true)}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 p-2 hover:shadow-xl transition-all"
            title="Mở điều khiển"
          >
            <ChevronRight className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </Panel>
      )}

      {/* Top Right - Tools */}
      {showRightPanel ? (
        <Panel position="top-right" className="space-y-2">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 p-2 space-y-2">
            {/* Close button */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Công cụ</span>
              <button
                onClick={() => setShowRightPanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Đóng"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <Button
              onClick={onToggleDarkMode}
              variant="outline"
              size="sm"
              className="w-full active:scale-95 transition-all"
              title="Chế độ tối"
            >
              {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {darkMode ? 'Sáng' : 'Tối'}
            </Button>

            {/* Print Button */}
            {onPrint && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <Button
                  onClick={onPrint}
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  In cây sơ đồ
                </Button>
              </div>
            )}
          </div>
        </Panel>
      ) : (
        <Panel position="top-right">
          <button
            onClick={() => setShowRightPanel(true)}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 p-2 hover:shadow-xl transition-all"
            title="Mở công cụ"
          >
            <ChevronLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </Panel>
      )}

      {/* Bottom Right - Zoom Controls */}
      <Panel position="bottom-right" className="space-y-2">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 p-2 flex flex-col gap-2">
          <Button
            onClick={() => zoomIn()}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title="Phóng to (Ctrl++)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => zoomOut()}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title="Thu nhỏ (Ctrl+-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => fitView({ padding: 0.2, duration: 800 })}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title="Vừa màn hình (Ctrl+0)"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Panel>

      {/* Legend */}
      <Panel position="bottom-left">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg border border-red-400 dark:border-red-600 px-4 py-3">
          <div className="space-y-2">
            {/* Giới tính */}
            <div className="flex gap-4 text-xs dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></span>
                Nam
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pink-100 border-2 border-pink-500"></span>
                Nữ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-100 border-2 border-gray-400"></span>
                Đã mất
              </span>
            </div>
            
            {/* Quan hệ */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex gap-4 text-xs dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-blue-500"></span>
                Cha
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-pink-500"></span>
                Mẹ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block">💑</span>
                Vợ chồng
              </span>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
});

TreeControls.displayName = "TreeControls";
