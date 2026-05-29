import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { eventService } from '../../src/services/eventService';
import { memberService } from '../../src/services/memberService';
import { useAsync } from '../../src/hooks/useAsync';
import { useRefresh } from '../../src/hooks/useRefresh';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Event, Member } from '../../src/types';
// ─── Hằng số bộ lọc nhanh ───────────────────────────────────────
const FILTER_OPTIONS = [
  { key: '7',   label: '7 ngày' },
  { key: '30',  label: '30 ngày' },
  { key: '90',  label: '3 tháng' },
  { key: '365', label: '1 năm' },
  { key: 'all', label: 'Tất cả' },
] as const;
type FilterKey = typeof FILTER_OPTIONS[number]['key'];
// ─── Helpers ─────────────────────────────────────────────────────
function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
// ─── Mini EventCard ───────────────────────────────────────────────
function MiniEventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const days = getDaysUntil(event.ngayDienRa);
  const isToday = days === 0;
  const isPast = days < 0;
  const isUrgent = days > 0 && days <= 3; // Sắp diễn ra trong 3 ngày
  const isUpcoming = days > 3 && days <= 7; // Sắp diễn ra trong 7 ngày

  // Màu sắc và icon
  const chipColor = isToday
    ? '#FF6F00' // Cam đậm - Hôm nay
    : isUrgent
    ? '#C62828' // Đỏ - Rất gấp
    : isUpcoming
    ? '#F57C00' // Cam - Sắp tới
    : isPast
    ? '#9E9E9E' // Xám - Đã qua
    : '#1B5E20'; // Xanh - Còn xa

  const chipText = isToday
    ? 'HÔM NAY'
    : isPast
    ? 'Đã qua'
    : days === 1
    ? 'NGÀY MAI'
    : isUrgent
    ? `${days} NGÀY NỮA`
    : `${days} ngày`;

  const showBell = isToday || isUrgent; // Hiển thị chuông cho sự kiện gấp

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.eventCard}>
      {/* Accent bar - màu nổi bật */}
      <View style={[styles.eventAccent, { backgroundColor: chipColor }]} />
      
      {/* Hiệu ứng nhấp nháy cho sự kiện hôm nay */}
      {isToday && <View style={styles.todayGlow} />}
      
      <View style={styles.eventBody}>
        <View style={styles.eventTop}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.tenSuKien}</Text>
          <View style={[styles.eventBadge, { backgroundColor: chipColor + '22' }]}>
            {showBell && (
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={14} 
                color={chipColor} 
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.eventBadgeText, { color: chipColor, fontWeight: 'bold' }]}>
              {chipText}
            </Text>
          </View>
        </View>
        <View style={styles.eventMeta}>
          <MaterialCommunityIcons name="calendar" size={13} color="#8B6914" />
          <Text style={styles.eventMetaText}>
            {new Date(event.ngayDienRa).toLocaleDateString('vi-VN')}
            {event.gioDienRa ? `  ·  ${event.gioDienRa}` : ''}
          </Text>
        </View>
        {!!event.diaDiem && (
          <View style={styles.eventMeta}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#8B6914" />
            <Text style={styles.eventMetaText} numberOfLines={1}>{event.diaDiem}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
// ─── Quick Action Button ──────────────────────────────────────────
function ActionBtn({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIconBox, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
// ─── Member Avatar (ảnh sạch, tên hiển thị bên dưới) ─────────────
function MemberAvatar({ member, onPress }: { member: Member; onPress: () => void }) {
  const avatarUri = member.anhChanDung || member.anhDaiDien;
  const initials = member.hoTen
    .split(' ')
    .pop()
    ?.substring(0, 2)
    .toUpperCase() ?? 'TV';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.memberAvatar}>
      {/* Ảnh sạch - không có tên đè lên hình */}
      <View style={styles.memberAvatarImgWrap}>
        {avatarUri ? (
          <Avatar.Image size={58} source={{ uri: avatarUri }} style={styles.memberAvatarImg} />
        ) : (
          <Avatar.Text
            size={58}
            label={initials}
            style={styles.memberAvatarText}
            labelStyle={{ color: '#8B2500', fontWeight: 'bold', fontSize: 16 }}
          />
        )}
      </View>
      {/* Tên hiển thị bên dưới ảnh */}
      <Text style={styles.memberName} numberOfLines={1}>{member.hoTen.split(' ').pop()}</Text>
    </TouchableOpacity>
  );
}
// ─── Main Screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filterKey, setFilterKey] = useState<FilterKey>('7');
  // ── Data loading ─────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user?.dongHoId) return { events: [] as Event[], members: [] as Member[] };
    const [evRes, mbRes] = await Promise.all([
      eventService.getEvents(user.dongHoId),
      memberService.getAllMembers(user.dongHoId),
    ]);
    return { events: evRes, members: mbRes };
  }, [user?.dongHoId]);
  const { data, loading, execute } = useAsync(loadAll, true);
  const { refreshing, refresh } = useRefresh(execute);
  const allEvents: Event[]  = data?.events  ?? [];
  const allMembers: Member[] = data?.members ?? [];
  // ── Filter events ─────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allEvents
      .filter((e) => {
        const d = new Date(e.ngayDienRa);
        if (filterKey === 'all') return true;
        const days = parseInt(filterKey, 10);
        const cutoff = new Date(today.getTime() + days * 86400000);
        return d >= today && d <= cutoff;
      })
      .sort(
        (a, b) =>
          new Date(a.ngayDienRa).getTime() - new Date(b.ngayDienRa).getTime()
      );
  }, [allEvents, filterKey]);
  // ── Recent members (top 8) ────────────────────────────────────
  const recentMembers = useMemo(() => allMembers.slice(0, 8), [allMembers]);
  // ── Stats ──────────────────────────────────────────────────────
  const totalLiving = allMembers.filter((m) => !m.ngayMat).length;
  const totalEvents = filteredEvents.length;
  // ── Quick actions ──────────────────────────────────────────────
  const actions = [
    { icon: 'account-search',  label: 'Tra cứu',    color: '#1565C0', bg: '#E3F2FD', route: '/(tabs)/members' },
    { icon: 'robot',           label: 'AI Chat',     color: '#558B2F', bg: '#F1F8E9', route: '/(tabs)/chat'    },
    { icon: 'calendar-month',  label: 'Sự kiện',     color: '#8B2500', bg: '#FFF3E0', route: '/events'         },
    { icon: 'chart-bar',       label: 'Thống kê',    color: '#00695C', bg: '#E0F2F1', route: '/(tabs)/statistics' },
  ];
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng ☀️';
    if (h < 18) return 'Chào buổi chiều 🌤️';
    return 'Chào buổi tối 🌙';
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ──── HEADER ──── */}
      <LinearGradient colors={['#7B1F00', '#B83400']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name ?? 'Thành viên'}
            </Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
          </View>
        </View>
        {/* Stats row inside header */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{allMembers.length}</Text>
            <Text style={styles.statLbl}>Thành viên</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalLiving}</Text>
            <Text style={styles.statLbl}>Còn sống</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalEvents}</Text>
            <Text style={styles.statLbl}>Sự kiện</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#8B2500']} />}
      >
        {/* ──── TRUY CẬP NHANH ──── */}
        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        <View style={styles.actionsGrid}>
          {actions.map((a) => (
            <ActionBtn
              key={a.route}
              icon={a.icon}
              label={a.label}
              color={a.color}
              bg={a.bg}
              onPress={() => router.push(a.route as any)}
            />
          ))}
        </View>
        {/* ──── THÀNH VIÊN GẦN ĐÂY ──── */}
        {recentMembers.length > 0 && (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Thành viên gia phả</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/members' as any)}>
                <Text style={styles.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
              {recentMembers.map((m) => (
                <MemberAvatar
                  key={m.thanhVienId}
                  member={m}
                  onPress={() => router.push(`/member/${m.thanhVienId}` as any)}
                />
              ))}
            </ScrollView>
          </>
        )}
        {/* ──── SỰ KIỆN ──── */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={styles.seeAll}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        {/* Bộ lọc nhanh theo ngày */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filterKey === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setFilterKey(opt.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Danh sách sự kiện */}
        {loading ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="loading" size={32} color="#C4A265" />
            <Text style={styles.emptyText}>Đang tải...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={40} color="#C4A265" />
            <Text style={styles.emptyText}>Không có sự kiện nào trong khoảng thời gian này</Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <MiniEventCard
              key={event.suKienId}
              event={event}
              onPress={() => router.push(`/event/${event.suKienId}` as any)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7B1F00' },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 2,
  },
  userName: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  headerAvatar: {
    backgroundColor: '#E6D5B8',
  },
  headerAvatarText: {
    backgroundColor: '#D4AF37',
  },
  // Stats in header
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLbl: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  // Body
  body: {
    flex: 1,
    backgroundColor: '#F4EFE4',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -10,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A2000',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  seeAll: {
    color: '#8B2500',
    fontSize: 13,
    fontWeight: '600',
  },
  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  actionBtn: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: '#4A2000',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Members horizontal scroll
  memberRow: {
    gap: 14,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  memberAvatar: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  memberAvatarImgWrap: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  memberAvatarImg: {
    backgroundColor: '#E6D5B8',
  },
  memberAvatarText: {
    backgroundColor: '#FFF3CD',
  },
  // Tên bên dưới ảnh, KHÔNG đè lên ảnh
  memberName: {
    fontSize: 11,
    color: '#4A2000',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 68,
  },
  // Filter chips
  filterRow: {
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9F0',
  },
  filterChipActive: {
    backgroundColor: '#8B2500',
    borderColor: '#8B2500',
  },
  filterChipText: {
    fontSize: 13,
    color: '#8B2500',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#D4AF37',
  },
  // Event card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBF2',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4A2000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EAD9B5',
  },
  eventAccent: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  todayGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6F00',
    backgroundColor: 'rgba(255, 111, 0, 0.08)',
  },
  eventBody: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1400',
    lineHeight: 20,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#7A5C20',
    flex: 1,
  },
  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    color: '#A08040',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
});