import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const authService = {
  async login(tenDangNhap: string, matKhau: string): Promise<User> {
    const response = await api.post('/users/login', {
      tenDangNhap,
      matKhau,
    });

    if (response.data.success === false) {
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    }

    const user = response.data;
    
    // Lưu token và thông tin user
    await AsyncStorage.setItem('accessToken', user.token);
    await AsyncStorage.setItem('refreshToken', user.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.post('/users/update-user-profile', data);
    
    if (response.data.success) {
      const updatedUser = response.data.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    throw new Error(response.data.message || 'Cập nhật thất bại');
  },
};
