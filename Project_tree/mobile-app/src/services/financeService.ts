import api from '../config/api';
import { Finance } from '../types';

export const financeService = {
  async getFinanceList(
    dongHoId: string,
    loai: 'thu' | 'chi',
    pageIndex = 1,
    pageSize = 20
  ): Promise<{
    data: Finance[];
    totalItems: number;
    pageCount: number;
  }> {
    const endpoint = loai === 'thu' ? '/contributionUp/search' : '/contributionDown/search';
    
    const response = await api.post(endpoint, {
      pageIndex,
      pageSize,
      search_content: '',
      dongHoId,
    });

    return {
      data: response.data.data || [],
      totalItems: response.data.totalItems || 0,
      pageCount: response.data.pageCount || 0,
    };
  },

  async createContribution(data: {
    soTien: number;
    moTa: string;
    dongHoId: string;
    nguoiGiaoDich: string;
  }): Promise<void> {
    const response = await api.post('/contributionUp/create', {
      ...data,
      tenKhoanThu: 'Đóng góp từ thành viên',
      ngayGiaoDich: new Date().toISOString(),
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Đóng góp thất bại');
    }
  },
};
