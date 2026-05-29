import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, Card, Text, Avatar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { memberService } from '../../src/services/memberService';
import { useAsync } from '../../src/hooks/useAsync';
import { AppHeader } from '../../src/components/common/AppHeader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingOverlay } from '../../src/components/common/LoadingOverlay';
import { Member } from '../../src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MembersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const loadMembers = useCallback(async () => {
    if (!user?.dongHoId) return { data: [], totalItems: 0 };
    return await memberService.searchMembers(user.dongHoId, searchQuery, page, 20);
  }, [user?.dongHoId, searchQuery, page]);

  const { data: result, loading, execute } = useAsync(loadMembers, true);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const renderMemberCard = ({ item }: { item: Member }) => (
    <TouchableOpacity onPress={() => router.push(`/member/${item.thanhVienId}`)}>
      <Card style={styles.memberCard}>
        <Card.Content>
          <View style={styles.memberHeader}>
            <Avatar.Image
              size={56}
              source={{ uri: item.anhDaiDien || 'https://giaphaso.vn/images/vangoc.jpg' }}
            />
            <View style={styles.memberInfo}>
              <Text variant="titleMedium" style={styles.memberName}>
                {item.hoTen}
              </Text>
              <View style={styles.memberMeta}>
                <Chip
                  icon={item.gioiTinh === 1 ? 'gender-male' : 'gender-female'}
                  compact
                  style={[
                    styles.genderChip,
                    item.gioiTinh === 1 ? styles.maleChip : styles.femaleChip,
                  ]}
                  textStyle={styles.chipText}
                >
                  {item.gioiTinh === 1 ? 'Nam' : 'Nữ'}
                </Chip>
                {item.doiThuoc && (
                  <Chip compact style={styles.generationChip} textStyle={styles.chipText}>
                    Đời {item.doiThuoc}
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {item.ngaySinh && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="cake-variant" size={16} color="#666" />
              <Text style={styles.detailText}>
                {new Date(item.ngaySinh).getFullYear()}
              </Text>
            </View>
          )}

          {item.soDienThoai && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone" size={16} color="#666" />
              <Text style={styles.detailText}>{item.soDienThoai}</Text>
            </View>
          )}

          {item.diaChiHienTai && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.diaChiHienTai}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Tra cứu họ hàng" subtitle="Tìm kiếm thông tin thành viên" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {loading && page === 1 ? (
          <LoadingOverlay message="Đang tải..." />
        ) : (
          <FlatList
            data={result?.data || []}
            renderItem={renderMemberCard}
            keyExtractor={(item) => `${item.dongHoId}-${item.thanhVienId}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="account-search"
                title="Không tìm thấy thành viên"
                description="Thử tìm kiếm với từ khóa khác"
              />
            }
            onEndReached={() => {
              if (result && result.data.length < result.totalItems) {
                setPage((p) => p + 1);
              }
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  searchBar: {
    elevation: 2,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  memberCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    height: 28,
  },
  maleChip: {
    backgroundColor: '#E3F2FD',
  },
  femaleChip: {
    backgroundColor: '#FCE4EC',
  },
  generationChip: {
    backgroundColor: '#F3E5F5',
    height: 28,
  },
  chipText: {
    fontSize: 11,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  detailText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
});
