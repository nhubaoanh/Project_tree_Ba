export interface User {
  nguoiDungId: string;
  full_name: string;
  email: string;
  phone: string;
  avatar?: string;
  dongHoId: string;
  roleId: string;
  roleCode: string;
  gender?: number;
  date_of_birthday?: string;
  token?: string;
  refreshToken?: string;
}

export interface Event {
  suKienId: string;
  tenSuKien: string;
  moTa: string;
  ngayDienRa: string;
  gioDienRa?: string;
  diaDiem: string;
  loaiSuKienId: string;
  tenLoaiSuKien?: string;
  dongHoId: string;
  active_flag: number;
}

export interface Member {
  thanhVienId: number;
  hoTen: string;
  gioiTinh: number;
  ngaySinh?: string;
  ngayMat?: string;
  noiSinh?: string;
  noiMat?: string;
  ngheNghiep?: string;
  trinhDoHocVan?: string;
  soDienThoai?: string;
  diaChiHienTai?: string;
  tieuSu?: string;
  doiThuoc?: number;
  chaId?: number;
  meId?: number;
  voId?: number;
  chongId?: number;
  dongHoId: string;
  anhDaiDien?: string;
  anhChanDung?: string;
}

export interface Notification {
  thongBaoId: string;
  nguoiNhanId: string;
  suKienId?: string;
  tieuDe: string;
  noiDung: string;
  loaiThongBao: number;
  daDoc: boolean;
  ngayGui: string;
}

export interface Finance {
  taiChinhThuId?: string;
  taiChinhChiId?: string;
  tenKhoanThu?: string;
  tenKhoanChi?: string;
  soTien: number;
  ngayGiaoDich: string;
  nguoiGiaoDich: string;
  moTa?: string;
  dongHoId: string;
  loai: 'thu' | 'chi';
}

export interface ChatMessage {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: string | number;
    name: string;
    avatar?: string;
  };
}
