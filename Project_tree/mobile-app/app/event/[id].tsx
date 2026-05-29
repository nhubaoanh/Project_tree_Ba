import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { eventService } from '../../src/services/eventService';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      if (!user?.dongHoId || !id) return;
      
      // Lấy danh sách sự kiện và tìm sự kiện theo ID
      const result = await eventService.searchEvents({
        pageIndex: 1,
        pageSize: 100,
        dongHoId: user.dongHoId,
      });
      
      const event = result.data.find((e: any) => e.suKienId === id);
      if (event) {
        setEventData(event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = timeString?.substring(0, 5) || 'Chưa cập nhật';
    return { dateStr, time };
  };

  const getBadgeColor = (type?: string) => {
    switch (type) {
      case 'TIN_VUI':
        return { bg: '#FCE4EC', text: '#AD1457' };
      case 'TIN_BUON':
        return { bg: '#EEEEEE', text: '#757575' };
      case 'SU_KIEN':
        return { bg: '#FFF3E0', text: '#E65100' };
      default:
        return { bg: '#E3F2FD', text: '#1565C0' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2500" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="calendar-remove" size={48} color="#C4A265" />
        <Text style={styles.notFoundText}>Không tìm thấy sự kiện</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { dateStr, time } = formatDateTime(eventData.ngayDienRa, eventData.gioDienRa);
  const badgeColor = getBadgeColor(eventData.tenLoaiSuKien);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tiêu đề */}
        <Text style={styles.eventTitle}>{eventData.tenSuKien}</Text>

        {/* Badge */}
        <View style={styles.badgeContainer}>
          {eventData.tenLoaiSuKien && (
            <View style={[styles.badge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.badgeText, { color: badgeColor.text }]}>
                {eventData.tenLoaiSuKien}
              </Text>
            </View>
          )}
          {eventData.uuTien === 0 && (
            <View style={styles.pinnedBadge}>
              <MaterialCommunityIcons name="pin" size={14} color="#D4AF37" />
              <Text style={styles.pinnedText}>Đã ghim</Text>
            </View>
          )}
        </View>

        {/* Thông tin chi tiết */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color="#8B2500" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Ngày diễn ra</Text>
              <Text style={styles.detailValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#8B2500" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>

          {eventData.diaDiem && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={22} color="#8B2500" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Địa điểm</Text>
                  <Text style={styles.detailValue}>{eventData.diaDiem}</Text>
                </View>
              </View>
            </>
          )}

          {eventData.full_name && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account" size={22} color="#8B2500" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Người tạo</Text>
                  <Text style={styles.detailValue}>{eventData.full_name}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Mô tả */}
        {eventData.moTa && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>📝 Mô tả chi tiết</Text>
            <Text style={styles.descriptionText}>{eventData.moTa}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5EC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B2500',
    marginTop: 8,
  },
  notFoundText: {
    fontSize: 16,
    color: '#5D4037',
    fontWeight: '500',
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#8B2500',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B2500',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 16,
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B6914',
  },
  detailCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#3E2723',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D5B8',
    marginVertical: 8,
  },
  descriptionCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B2500',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#5D4037',
    lineHeight: 24,
  },
});
