import api from '../config/api';

export interface ThongKeTongQuan {
  tongThanhVien: number;
  soNam: number;
  soNu: number;
  daMat: number;
  conSong: number;
  soDoi: number;
  soChi: number;
}

export interface ThongKeTheoDoi {
  doi: number;
  soThanhVien: number;
  soNam: number;
  soNu: number;
  daMat: number;
}

export interface ThongKeTheoChi {
  chiGocId: number;
  tenChi: string;
  soThanhVien: number;
  soDoi: number;
}

export interface ThongKeThuChi {
  tongThu: number;
  tongChi: number;
  soLanThu: number;
  soLanChi: number;
}

export interface ThongKeThuChiTheoThang {
  thang: number;
  tongThu: number;
  tongChi: number;
}

export interface ThanhVienMoiNhat {
  thanhVienId: number;
  hoTen: string;
  gioiTinh: number;
  ngaySinh?: string;
  doiThuoc?: number;
  ngayTao?: string;
  tenDongHo?: string;
}

export const statisticsService = {
  // Thống kê tổng quan
  async getThongKeTongQuan(dongHoId: string): Promise<ThongKeTongQuan> {
    try {
      const response = await api.get(`/thongke/tongquan/${dongHoId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê tổng quan thất bại');
    } catch (error) {
      console.error('getThongKeTongQuan error:', error);
      throw error;
    }
  },

  // Thống kê theo đời
  async getThongKeTheoDoi(dongHoId: string): Promise<ThongKeTheoDoi[]> {
    try {
      const response = await api.get(`/thongke/theodoi/${dongHoId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê theo đời thất bại');
    } catch (error) {
      console.error('getThongKeTheoDoi error:', error);
      throw error;
    }
  },

  // Thống kê theo chi
  async getThongKeTheoChi(dongHoId: string): Promise<ThongKeTheoChi[]> {
    try {
      const response = await api.get(`/thongke/theochi/${dongHoId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê theo chi thất bại');
    } catch (error) {
      console.error('getThongKeTheoChi error:', error);
      throw error;
    }
  },

  // Thống kê đầy đủ (tổng quan + theo đời + theo chi)
  async getFullStats(dongHoId: string): Promise<{
    tongQuan: ThongKeTongQuan;
    theoDoi: ThongKeTheoDoi[];
    theoChi: ThongKeTheoChi[];
  }> {
    try {
      const response = await api.get(`/thongke/full/${dongHoId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê đầy đủ thất bại');
    } catch (error) {
      console.error('getFullStats error:', error);
      throw error;
    }
  },

  // Thống kê tài chính thu chi
  async getThongKeThuChi(dongHoId: string, nam?: number): Promise<ThongKeThuChi> {
    try {
      let url = `/thongke/thuChi/${dongHoId}`;
      if (nam) url += `?nam=${nam}`;
      
      const response = await api.get(url);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê tài chính thất bại');
    } catch (error) {
      console.error('getThongKeThuChi error:', error);
      throw error;
    }
  },

  // Thống kê thu chi theo tháng
  async getThongKeThuChiTheoThang(dongHoId: string, nam?: number): Promise<ThongKeThuChiTheoThang[]> {
    try {
      let url = `/thongke/thuChiTheoThang/${dongHoId}`;
      if (nam) url += `?nam=${nam}`;
      
      const response = await api.get(url);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Lấy thống kê thu chi theo tháng thất bại');
    } catch (error) {
      console.error('getThongKeThuChiTheoThang error:', error);
      throw error;
    }
  },

  // Thành viên mới nhất
  async getThanhVienMoiNhat(dongHoId: string, limit: number = 5): Promise<ThanhVienMoiNhat[]> {
    try {
      const response = await api.get(`/thongke/moinhat?limit=${limit}&dongHoId=${dongHoId}`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('getThanhVienMoiNhat error:', error);
      return [];
    }
  }
};
