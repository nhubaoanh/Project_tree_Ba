import api from '../config/api';
import { Member } from '../types';

export const memberService = {
  async searchMembers(
    dongHoId: string,
    searchContent: string = '',
    pageIndex = 1,
    pageSize = 20
  ): Promise<{
    data: Member[];
    totalItems: number;
    pageCount: number;
  }> {
    const response = await api.post('/member/search-by-dongho', {
      pageIndex,
      pageSize,
      search_content: searchContent,
      dongHoId,
    });

    return {
      data: response.data.data || [],
      totalItems: response.data.totalItems || 0,
      pageCount: response.data.pageCount || 0,
    };
  },

  async getMemberById(dongHoId: string, thanhVienId: number): Promise<Member> {
    const response = await api.get(`/member/${thanhVienId}`, {
      params: { dongHoId },
    });

    if (response.data.success) {
      const data = response.data.data;
      // GetMemberById stored procedure returns array of results
      return Array.isArray(data) ? data[0] : data;
    }

    throw new Error('Không tìm thấy thành viên');
  },

  async getAllMembers(dongHoId: string): Promise<Member[]> {
    try {
      const response = await api.get(`/member/dongho/${dongHoId}/all`);
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      // If success is false or missing, throw to use fallback
      throw new Error("Failed to get all members directly");
    } catch (error) {
      console.log('getAllMembers fallback to search', error);
      // Fallback
      const response = await api.post('/member/search-by-dongho', {
        pageIndex: 1,
        pageSize: 1000,
        search_content: '',
        dongHoId,
      });
      return response.data.data || [];
    }
  },
};
