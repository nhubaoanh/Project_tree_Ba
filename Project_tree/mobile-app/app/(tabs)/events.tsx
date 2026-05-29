import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { eventService, Event } from '../../src/services/eventService';
import { useAuth } from '../../src/context/AuthContext';

// Các tùy chọn bộ lọc
const FILTER_OPTIONS = [
  { key: 'all', label: 'Tất cả' },
  { key: '7', label: '7 ngày tới' },
  { key: '30', label: '30 ngày tới' },
  { key: '90', label: '3 tháng tới' },
  { key: 'past', label: 'Đã qua' },
] as const;

type FilterKey = typeof FILTER_OPTIONS[number]['key'];

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterKey, setFilterKey] = useState<FilterKey>('all');

  useEffect(() => {
    loadEvents();
  }, [user?.dongHoId]);

  const loadEvents = async () => {
    if (!user?.dongHoId) {
      console.log('❌ No dongHoId found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading events for dongHoId:', user.dongHoId);

      const result = await eventService.searchEvents({
        pageIndex: 1,
        pageSize: 100,
        dongHoId: user.dongHoId,
      });

      console.log('✅ Events loaded:', result.data.length);
      setEvents(result.data);
    } catch (error: any) {
      console.error('❌ Load events error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [user?.dongHoId]);

  // Lọc và sắp xếp sự kiện
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = events.filter((e) => {
      const eventDate = new Date(e.ngayDienRa);
      eventDate.setHours(0, 0, 0, 0);

      if (filterKey === 'all') return true;
      if (filterKey === 'past') return eventDate < today;

      const days = parseInt(filterKey, 10);
      const futureDate = new Date(today.getTime() + days * 86400000);
      return eventDate >= today && eventDate <= futureDate;
    });

    // Sắp xếp: Mới nhất lên đầu (theo ngày giờ)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.ngayDienRa + 'T' + (a.gioDienRa || '00:00'));
      const dateB = new Date(b.ngayDienRa + 'T' + (b.gioDienRa || '00:00'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [events, filterKey]);

  const openEventDetail = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
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

  const renderEvent = ({ item }: { item: Event }) => {
    const { dateStr, time } = formatDateTime(item.ngayDienRa, item.gioDienRa);
    const badgeColor = getBadgeColor(item.tenLoaiSuKien);

    return (
      <TouchableOpacity onPress={() => openEventDetail(item)} activeOpacity={0.8}>
        <View style={styles.eventCard}>
          {/* Header với badge */}
          <View style={styles.eventHeader}>
            {item.uuTien === 0 && (
              <View style={styles.pinnedBadge}>
                <MaterialCommunityIcons name="pin" size={12} color="#D4AF37" />
                <Text style={styles.pinnedText}>Đã ghim</Text>
              </View>
            )}
            <View style={[styles.typeBadge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.typeBadgeText, { color: badgeColor.text }]}>
                {item.tenLoaiSuKien || 'Sự kiện'}
              </Text>
            </View>
          </View>

          {/* Tiêu đề */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.tenSuKien}
          </Text>

          {/* Thời gian */}
          <View style={styles.eventMeta}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color="#8B2500" />
            <Text style={styles.eventMetaText}>
              {new Date(item.ngayDienRa).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.eventMeta}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#8B2500" />
            <Text style={styles.eventMetaText}>{time}</Text>
          </View>

          {/* Địa điểm */}
          {item.diaDiem && (
            <View style={styles.eventMeta}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#8B2500" />
              <Text style={styles.eventMetaText} numberOfLines={1}>
                {item.diaDiem}
              </Text>
            </View>
          )}

          {/* Mô tả ngắn */}
          {item.moTa && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.moTa}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-month" size={24} color="#D4AF37" />
        <Text style={styles.headerTitle}>Bảng Tin Dòng Họ</Text>
      </View>

      {/* Bộ lọc */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = filterKey === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilterKey(option.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.filterCount}>
          {filteredEvents.length} sự kiện
        </Text>
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B2500" />
          <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.suKienId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B2500']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#C4A265" />
              <Text style={styles.emptyText}>Không có sự kiện nào</Text>
              <Text style={styles.emptySubText}>
                {filterKey === 'past' 
                  ? 'Không có sự kiện đã qua'
                  : 'Thử chọn bộ lọc khác để xem sự kiện'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal chi tiết sự kiện */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết sự kiện</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <MaterialCommunityIcons name="close" size={28} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedEvent && (
              <>
                {/* Tiêu đề */}
                <Text style={styles.modalEventTitle}>{selectedEvent.tenSuKien}</Text>

                {/* Badge loại sự kiện */}
                {selectedEvent.tenLoaiSuKien && (
                  <View style={styles.modalBadgeContainer}>
                    <View
                      style={[
                        styles.modalBadge,
                        { backgroundColor: getBadgeColor(selectedEvent.tenLoaiSuKien).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalBadgeText,
                          { color: getBadgeColor(selectedEvent.tenLoaiSuKien).text },
                        ]}
                      >
                        {selectedEvent.tenLoaiSuKien}
                      </Text>
                    </View>
                    {selectedEvent.uuTien === 0 && (
                      <View style={styles.modalPinnedBadge}>
                        <MaterialCommunityIcons name="pin" size={14} color="#D4AF37" />
                        <Text style={styles.modalPinnedText}>Đã ghim</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Thông tin chi tiết */}
                <View style={styles.detailCard}>
                  <View style={styles.modalSection}>
                    <MaterialCommunityIcons name="calendar-clock" size={22} color="#8B2500" />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Ngày diễn ra</Text>
                      <Text style={styles.modalSectionValue}>
                        {formatDateTime(selectedEvent.ngayDienRa, selectedEvent.gioDienRa).dateStr}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.modalSection}>
                    <MaterialCommunityIcons name="clock-outline" size={22} color="#8B2500" />
                    <View style={styles.modalSectionContent}>
                      <Text style={styles.modalSectionLabel}>Thời gian</Text>
                      <Text style={styles.modalSectionValue}>
                        {formatDateTime(selectedEvent.ngayDienRa, selectedEvent.gioDienRa).time}
                      </Text>
                    </View>
                  </View>

                  {selectedEvent.diaDiem && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.modalSection}>
                        <MaterialCommunityIcons name="map-marker" size={22} color="#8B2500" />
                        <View style={styles.modalSectionContent}>
                          <Text style={styles.modalSectionLabel}>Địa điểm</Text>
                          <Text style={styles.modalSectionValue}>{selectedEvent.diaDiem}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  {selectedEvent.full_name && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.modalSection}>
                        <MaterialCommunityIcons name="account" size={22} color="#8B2500" />
                        <View style={styles.modalSectionContent}>
                          <Text style={styles.modalSectionLabel}>Người tạo</Text>
                          <Text style={styles.modalSectionValue}>{selectedEvent.full_name}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Mô tả */}
                {selectedEvent.moTa && (
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionTitle}>📝 Mô tả chi tiết</Text>
                    <Text style={styles.descriptionText}>{selectedEvent.moTa}</Text>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B2500',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#8B2500',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D5B8',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9E6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B2500',
    borderColor: '#8B2500',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B2500',
  },
  filterChipTextActive: {
    color: '#D4AF37',
  },
  filterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B6914',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 12,
    lineHeight: 24,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#5D4037',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B2500',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F5EC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8B2500',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 16,
    lineHeight: 32,
  },
  modalBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalPinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalPinnedText: {
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
  modalSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  modalSectionContent: {
    flex: 1,
  },
  modalSectionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  modalSectionValue: {
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
