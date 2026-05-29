import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Event } from '../../types';
import { formatDate, getDaysUntil } from '../../utils/dateUtils';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const daysUntil = getDaysUntil(event.ngayDienRa);
  
  const getDaysLabel = () => {
    if (daysUntil === 0) return 'Hôm nay';
    if (daysUntil === 1) return 'Ngày mai';
    if (daysUntil < 0) return 'Đã qua';
    return `${daysUntil} ngày`;
  };

  const getChipStyle = () => {
    if (daysUntil === 0) return styles.todayChip;
    if (daysUntil <= 3) return styles.urgentChip;
    return styles.normalChip;
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
              {event.tenSuKien}
            </Text>
            <Chip
              icon="clock-outline"
              style={getChipStyle()}
              textStyle={styles.chipText}
              compact
            >
              {getDaysLabel()}
            </Chip>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatDate(event.ngayDienRa)}
              </Text>
            </View>

            {event.diaDiem && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {event.diaDiem}
                </Text>
              </View>
            )}
          </View>

          {event.moTa && (
            <Text style={styles.description} numberOfLines={2}>
              {event.moTa}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
    color: '#333',
  },
  normalChip: {
    backgroundColor: '#E3F2FD',
  },
  urgentChip: {
    backgroundColor: '#FFEBEE',
  },
  todayChip: {
    backgroundColor: '#FFF3E0',
  },
  chipText: {
    fontSize: 11,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  description: {
    color: '#999',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
});
