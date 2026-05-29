import api from '../config/api';

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
  uuTien?: number;
  full_name?: string;
}

export interface SearchEventParams {
  pageIndex: number;
  pageSize: number;
  search_content?: string;
  dongHoId: string;
}

export const eventService = {
  // Tìm kiếm sự kiện
  async searchEvents(params: SearchEventParams): Promise<{ data: Event[]; totalItems: number }> {
    try {
      console.log('=== searchEvents START ===');
      console.log('Params:', JSON.stringify(params, null, 2));
      console.log('API URL:', api.defaults.baseURL);
      
      const response = await api.post('/event/search', params);
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Backend trả về trực tiếp data, không có success flag
      if (response.data && response.data.data) {
        console.log('✅ Success! Events count:', response.data.data.length);
        return {
          data: response.data.data || [],
          totalItems: response.data.totalItems || 0
        };
      }
      
      console.log('❌ No data in response');
      return { data: [], totalItems: 0 };
    } catch (error: any) {
      console.error('❌ searchEvents error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { data: [], totalItems: 0 };
    }
  },

  // Lấy tất cả sự kiện (wrapper cho searchEvents)
  async getEvents(dongHoId?: string): Promise<Event[]> {
    try {
      const result = await eventService.searchEvents({
        pageIndex: 1,
        pageSize: 100,
        search_content: '',
        dongHoId: dongHoId || '',
      });
      return result.data;
    } catch (error) {
      console.error('getEvents error:', error);
      return [];
    }
  },

  // Lấy sự kiện sắp tới (7 ngày tới)
  async getUpcomingEvents(dongHoId: string): Promise<Event[]> {
    try {
      const result = await eventService.searchEvents({
        pageIndex: 1,
        pageSize: 50,
        dongHoId,
      });

      const events = result.data;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = events
        .filter((e) => {
          const d = new Date(e.ngayDienRa);
          return d >= now && d <= sevenDaysLater;
        })
        .sort((a, b) => new Date(a.ngayDienRa).getTime() - new Date(b.ngayDienRa).getTime());

      if (upcoming.length > 0) return upcoming;

      return events
        .sort((a, b) => new Date(b.ngayDienRa).getTime() - new Date(a.ngayDienRa).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('getUpcomingEvents error:', error);
      return [];
    }
  },

  // Tham gia sự kiện
  async joinEvent(suKienId: string, nguoiDungId: string): Promise<any> {
    try {
      const response = await api.post('/sukien/thamgia', {
        suKienId,
        nguoiDungId,
        trangThai: 'thamgia',
      });
      return response.data;
    } catch (error) {
      console.error('joinEvent error:', error);
      throw error;
    }
  },

  // Hủy tham gia sự kiện
  async leaveEvent(suKienId: string, nguoiDungId: string): Promise<any> {
    try {
      const response = await api.post('/sukien/huy-thamgia', {
        suKienId,
        nguoiDungId,
      });
      return response.data;
    } catch (error) {
      console.error('leaveEvent error:', error);
      throw error;
    }
  },

  // Kiểm tra đã tham gia chưa
  async checkJoined(suKienId: string, nguoiDungId: string): Promise<boolean> {
    try {
      const response = await api.get('/sukien/check-thamgia', {
        params: { suKienId, nguoiDungId },
      });
      return response.data.data?.isJoined || false;
    } catch (error) {
      return false;
    }
  },

  // Lấy danh sách bình luận
  async getComments(suKienId: string): Promise<any[]> {
    try {
      const response = await api.get(`/sukien/binhluan/${suKienId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('getComments error:', error);
      return [];
    }
  },

  // Thêm bình luận
  async addComment(suKienId: string, nguoiDungId: string, noiDung: string): Promise<any> {
    try {
      const response = await api.post('/sukien/binhluan', {
        suKienId,
        nguoiDungId,
        noiDung,
      });
      return response.data;
    } catch (error) {
      console.error('addComment error:', error);
      throw error;
    }
  },

  // Lấy thống kê RSVP
  async getRsvp(suKienId: string): Promise<any[]> {
    try {
      const response = await api.get(`/event/rsvp/${suKienId}`);
      if (response.data.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('getRsvp error:', error);
      return [];
    }
  },

  // RSVP sự kiện
  async rsvpEvent(suKienId: string, nguoiDungId: string, trangThai: string): Promise<any> {
    try {
      const response = await api.post('/event/rsvp', {
        suKienId,
        nguoiDungId,
        trangThai,
      });
      return response.data;
    } catch (error) {
      console.error('rsvpEvent error:', error);
      throw error;
    }
  },

  // Wrapper cho compatibility
  async getAllEvents(dongHoId: string, pageIndex: number, pageSize: number): Promise<{ data: Event[] }> {
    const result = await eventService.searchEvents({
      pageIndex,
      pageSize,
      dongHoId,
    });
    return { data: result.data };
  },
};
