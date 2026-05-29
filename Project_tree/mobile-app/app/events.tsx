import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { eventService } from '../src/services/eventService';
import { useAsync } from '../src/hooks/useAsync';
import { useRefresh } from '../src/hooks/useRefresh';
import { AppHeader } from '../src/components/common/AppHeader';
import { EmptyState } from '../src/components/common/EmptyState';
import { LoadingOverlay } from '../src/components/common/LoadingOverlay';
import { EventCard } from '../src/components/events/EventCard';
import { Event } from '../src/types';

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming_7' | 'past'>('upcoming_7');
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    if (!user?.dongHoId) return { data: [], totalItems: 0, pageCount: 0 };
    return await eventService.getAllEvents(user.dongHoId, page, 20);
  }, [user?.dongHoId, page]);

  const { data: result, loading, execute } = useAsync(fetchEvents, true);
  const { refreshing, refresh } = useRefresh(execute);

  const getFilteredEvents = () => {
    if (!result?.data) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysLater.setHours(23, 59, 59, 999);

    const filtered = result.data.filter((event: Event) => {
      const eventDate = new Date(event.ngayDienRa);
      if (filter === 'upcoming_7') {
        return eventDate >= now && eventDate <= sevenDaysLater;
      }
      if (filter === 'past') {
        return eventDate < now;
      }
      return true;
    });

    // Sắp xếp sự kiện mới/gần nhất lên đầu
    return filtered.sort((a: Event, b: Event) => new Date(b.ngayDienRa).getTime() - new Date(a.ngayDienRa).getTime());
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => {
        router.push(`/event/${item.suKienId}`);
      }}
    />
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Sự kiện dòng họ"
        subtitle="Quản lý và thông tin các hoạt động"
        showBack={true}
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={filter}
            onValueChange={(val) => setFilter(val as 'all' | 'upcoming_7' | 'past')}
            buttons={[
              {
                value: 'upcoming_7',
                label: '7 ngày tới',
                icon: 'calendar-clock',
              },
              {
                value: 'all',
                label: 'Tất cả',
                icon: 'calendar-range',
              },
              {
                value: 'past',
                label: 'Đã qua',
                icon: 'calendar-check',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {loading && page === 1 ? (
          <LoadingOverlay message="Đang tải sự kiện..." />
        ) : (
          <FlatList
            data={getFilteredEvents()}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.suKienId}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="calendar-blank"
                title="Không có sự kiện"
                description={
                  filter === 'upcoming_7'
                    ? 'Không có sự kiện nào trong 7 ngày tới'
                    : filter === 'past'
                    ? 'Không tìm thấy sự kiện nào trong quá khứ'
                    : 'Chưa có sự kiện nào được đăng ký'
                }
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
    backgroundColor: '#F9F5EC',
  },
  content: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#F9F5EC',
  },
  filterContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: '#FFF9E6',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
});
