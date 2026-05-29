import React, { useState, useEffect, useRef } from "react";
import { NavButton } from "./NavButton"; 
import { ViewMode } from "@/types/familytree";
import Image from "next/image";
import { LogOut, User, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import storage from "@/utils/storage";

interface HeaderProps {
  activeView: string;
  onNavigate: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate }) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = storage.getUser();
    setUser(userData);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    storage.clearToken();
    storage.removeUser();
    router.push('/login');
  };

  const navItems = [
    { key: ViewMode.PHA_KY, label: "Phả Ký" },
    { key: ViewMode.DIAGRAM, label: "Phả Đồ" },
    { key: ViewMode.Walet, label: "Đóng góp" },
    { key: ViewMode.EVENT, label: "Sự Kiện" },
    { key: ViewMode.NEWS, label: "Tin Tức" },
  ];

  return (
    <>
      <header className={`w-full bg-gradient-to-b bg-[#ede5b7] relative overflow-hidden border-b-1 border-yellow-600/50 transition-all duration-300 ${
        isCollapsed ? 'h-[60px]' : 'h-[180px] sm:h-[200px]'
      }`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>

        {isCollapsed ? (
          // Header thu gọn - chỉ hiện 5 nút ở giữa
          <div className="relative z-10 h-full flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
            {/* Khoảng trống bên trái */}
            <div className="w-12"></div>
            
            {/* 5 nút navigation ở giữa */}
            <nav className="flex items-center gap-2 md:gap-4 z-20">
              {navItems.map((item) => (
                <NavButton
                  key={item.key}
                  text={item.label}
                  isActive={activeView === item.key}
                  onClick={() => onNavigate(item.key)}
                />
              ))}
            </nav>

            {/* Nút mở rộng - góc phải */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-full hover:bg-white/30 transition-all z-30"
              title="Mở rộng header"
            >
              <ChevronDown size={24} className="text-[#5d4037]" />
            </button>
          </div>
        ) : (
          // Header đầy đủ - có logo và hình ảnh
          <div className="relative z-10 h-full grid grid-cols-3 gap-2 items-center px-4 md:px-8 max-w-7xl mx-auto">
            {/* Nút thu gọn - góc trên bên phải */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/30 transition-all z-50"
              title="Thu gọn header"
            >
              <ChevronUp size={24} className="text-[#5d4037]" />
            </button>

            <div className="flex justify-start items-center opacity-80 hover:opacity-100 transition-opacity h-full">
              <Image
                src="/images/en.png"
                alt="Dao"
                width={230}
                height={230}
                quality={80}
              />
            </div>
            <div className="flex flex-col items-center justify-center h-full pt-2">
              <div className="mb-13 transform hover:scale-105 transition-transform duration-500">
                <Image
                  src="/images/logo1.png"
                  alt="Dao"
                  width={280}
                  height={280}
                  quality={80}
                />
              </div>
              <nav className="flex flex-wrap justify-center text-[19`px] items-center gap-3 md:gap-4 w-full absolute bottom-2 z-20">
                {navItems.map((item) => (
                  <NavButton
                    key={item.key}
                    text={item.label}
                    isActive={activeView === item.key}
                    onClick={() => onNavigate(item.key)}
                  />
                ))}
              </nav>
            </div>
            <div className="flex justify-end items-center opacity-80 hover:opacity-100 transition-opacity h-full">
              <Image
                src="/images/backgroudrignt.png"
                alt="Dao"
                width={280}
                height={280}
                quality={80}
              />
            </div>
          </div>
        )}
      </header>

    {/* User Menu - Floating button góc dưới trái */}
    <div className="fixed bottom-6 left-6 z-50" ref={menuRef}>
      <div className="relative">
        {/* Dropdown Menu - Hiện phía trên button */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-2xl border border-[#d4af37] overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-[#fffdf5]">
              <p className="text-sm font-bold text-[#5d4037]">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-[#d4af37] mt-1">{user?.roleCode === 'td' ? 'Thủ Đồ' : 'Thành Viên'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-[#b91c1c] font-medium"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        )}

        {/* Button - Chỉ hiện avatar tròn nhỏ gọn */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-12 h-12 bg-gradient-to-br from-[#b91c1c] to-[#d4af37] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 border-2 border-white flex items-center justify-center text-white"
          title="Thông tin tài khoản"
        >
          <User size={22} />
        </button>
      </div>
    </div>
  </>
  );
};