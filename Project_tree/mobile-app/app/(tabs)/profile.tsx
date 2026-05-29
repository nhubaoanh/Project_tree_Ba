import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Avatar, List, Divider, Button, Portal, Modal, TextInput } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/common/AppHeader';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [updating, setUpdating] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      await updateUser(editData);
      setShowEditModal(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const getGenderText = (gender?: number) => {
    if (gender === 1) return 'Nam';
    if (gender === 0) return 'Nữ';
    return 'Chưa xác định';
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Cá nhân" subtitle="Thông tin tài khoản" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.full_name}
            </Text>
            <Text variant="bodyMedium" style={styles.userRole}>
              {user?.roleCode === 'admin' ? '👑 Quản trị viên' : '🌿 Thành viên'}
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                setEditData({
                  full_name: user?.full_name || '',
                  phone: user?.phone || '',
                  email: user?.email || '',
                });
                setShowEditModal(true);
              }}
              style={styles.editButton}
              icon="pencil"
            >
              Chỉnh sửa
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Thông tin cá nhân
            </Text>
            
            <List.Item
              title="Giới tính"
              description={getGenderText(user?.gender)}
              left={(props) => <List.Icon {...props} icon="gender-male-female" />}
            />
            <Divider />
            
            <List.Item
              title="Email"
              description={user?.email || 'Chưa cập nhật'}
              left={(props) => <List.Icon {...props} icon="email" />}
            />
            <Divider />
            
            <List.Item
              title="Số điện thoại"
              description={user?.phone || 'Chưa cập nhật'}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />
            <Divider />
            
            <List.Item
              title="Ngày sinh"
              description={
                user?.date_of_birthday
                  ? new Date(user.date_of_birthday).toLocaleDateString('vi-VN')
                  : 'Chưa cập nhật'
              }
              left={(props) => <List.Icon {...props} icon="cake-variant" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cài đặt
            </Text>
            
            <TouchableOpacity>
              <List.Item
                title="Thông báo"
                description="Quản lý thông báo"
                left={(props) => <List.Icon {...props} icon="bell" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            </TouchableOpacity>
            <Divider />
            
            <TouchableOpacity>
              <List.Item
                title="Bảo mật"
                description="Đổi mật khẩu"
                left={(props) => <List.Icon {...props} icon="shield-lock" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            </TouchableOpacity>
            <Divider />
            
            <TouchableOpacity>
              <List.Item
                title="Ngôn ngữ"
                description="Tiếng Việt"
                left={(props) => <List.Icon {...props} icon="translate" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#F44336"
          icon="logout"
        >
          Đăng xuất
        </Button>

        <Text variant="bodySmall" style={styles.version}>
          Phiên bản 1.0.0
        </Text>
      </ScrollView>

      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Chỉnh sửa thông tin
          </Text>

          <TextInput
            label="Họ và tên"
            value={editData.full_name}
            onChangeText={(text) => setEditData({ ...editData, full_name: text })}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Số điện thoại"
            value={editData.phone}
            onChangeText={(text) => setEditData({ ...editData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            left={<TextInput.Icon icon="phone" />}
          />

          <TextInput
            label="Email"
            value={editData.email}
            onChangeText={(text) => setEditData({ ...editData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowEditModal(false)}
              style={styles.modalButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={updating}
              disabled={updating}
              style={styles.modalButton}
            >
              Lưu
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EC',
  },
  content: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#F9F5EC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    marginTop: 4,
    color: '#666',
  },
  editButton: {
    marginTop: 16,
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
    elevation: 2,
  },
  settingsCard: {
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
  modalContent: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});
