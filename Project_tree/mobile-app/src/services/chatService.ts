import api from '../config/api';
import { memberService } from './memberService';

interface ChatResponse {
  success: boolean;
  data: {
    question: string;
    sql: string;
    result: {
      type: 'count' | 'list' | 'empty';
      count?: number;
      value?: number;
      data?: any[];
      message: string;
    };
    usedAPI: string;
  };
}

export interface ChatMessageResponse {
  text: string;
  data?: any[];
  type?: 'count' | 'list' | 'empty';
}

// Caching members for fast lookup
let cachedMembers: any[] | null = null;

export const chatService = {
  async sendMessage(message: string, dongHoId: string): Promise<ChatMessageResponse> {
    try {
      const response = await api.post<ChatResponse>('/text2sql/query', {
        question: message,
        dongHoId,
      });

      if (response.data.success && response.data.data) {
        const result = response.data.data.result;
        
        // Format response dựa trên type
        if (result.type === 'count') {
          return {
            text: `${result.message}\n\nKết quả: ${result.value || result.count || 0}`,
            type: 'count'
          };
        } else if (result.type === 'list' && result.data && result.data.length > 0) {
          
          // Lấy danh sách thành viên để tra cứu tên bố mẹ
          if (!cachedMembers) {
            try {
              cachedMembers = await memberService.getAllMembers(dongHoId);
            } catch (e) {
              console.warn("Could not fetch members for lookup", e);
              cachedMembers = [];
            }
          }
          
          const memberMap = new Map();
          cachedMembers.forEach(m => memberMap.set(m.thanhVienId, m.hoTen));

          // Enhance data with parent names
          const enhancedData = result.data.slice(0, 10).map((item: any) => {
            if (item.hoTen) {
              return {
                ...item,
                tenCha: item.chaId ? memberMap.get(item.chaId) : null,
                tenMe: item.meId ? memberMap.get(item.meId) : null,
                tenVoChong: item.voId ? memberMap.get(item.voId) : (item.chongId ? memberMap.get(item.chongId) : null)
              };
            }
            return item;
          });

          let text = `${result.message}`;
          if (result.data.length > 10) {
            text += ` (Hiển thị 10/${result.data.length} kết quả)`;
          }
          
          return {
            text,
            data: enhancedData,
            type: 'list'
          };
        } else {
          return { text: result.message || 'Không tìm thấy kết quả nào.', type: 'empty' };
        }
      }

      return { text: 'Xin lỗi, tôi không thể trả lời câu hỏi này.' };
    } catch (error: any) {
      console.error('Chat error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Không thể kết nối với chatbot. Vui lòng thử lại.');
    }
  },

  async getQuickQuestions(): Promise<string[]> {
    try {
      const response = await api.get('/text2sql/examples');
      
      if (response.data.success && response.data.data?.examples) {
        return response.data.data.examples.slice(0, 6);
      }
    } catch (error) {
      console.error('Error loading examples:', error);
    }

    return [
      'Có bao nhiêu thành viên trong dòng họ?',
      'Có bao nhiêu thành viên nam?',
      'Có bao nhiêu thành viên nữ?',
      'Danh sách thành viên đời thứ 3',
      'Có bao nhiêu người còn sống?',
      'Thành viên trẻ nhất là ai?',
    ];
  },
};
