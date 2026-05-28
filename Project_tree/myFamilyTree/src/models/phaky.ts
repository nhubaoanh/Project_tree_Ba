export interface LuocSuItem {
  thoiGian: string;
  suKien: string;
  hinhAnh?: string;
}

export interface ButTichItem {
  hoTen: string;
  noiDung: string;
  hinhAnh?: string;
}

export interface TruyenThongItem {
  hinhAnh?: string;
  noiDung: string;
}

export interface PhaKy {
  phaKyId?: string;
  dongHoId: string;
  luocSu?: LuocSuItem[] | string;
  butTich?: ButTichItem[] | string;
  viToAnh?: string;
  viToBiography?: string;
  viToHoTen?: string;
  tuDuongDiaChi?: string;
  tuDuongLinkMap?: string;
  tuDuongAnh?: string;
  tuDuongIframe?: string;
  toQuanDiaChi?: string;
  toQuanLinkMap?: string;
  toQuanAnh?: string;
  toQuanIframe?: string;
  truyenThong?: TruyenThongItem[] | string;
  nguoiTaoId?: string;
  active_flag?: number;
  lu_updated?: Date;
  lu_user_id?: string;
  tenDongHo?: string;
  RecordCount?: number;
}
