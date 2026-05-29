import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '../../src/context/AuthContext';
import { statisticsService, ThongKeTongQuan, ThongKeTheoDoi, ThongKeThuChi } from '../../src/services/statisticsService';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#FFF9E6',
  backgroundGradientTo: '#FFF9E6',
  color: (opacity = 1) => `rgba(139, 37, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tongQuan, setTongQuan] = useState<ThongKeTongQuan | null>(null);
  const [theoDoi, setTheoDoi] = useState<ThongKeTheoDoi[]>([]);
  const [thuChi, setThuChi] = useState<ThongKeThuChi | null>(null);

  const fetchData = async () => {
    if (!user?.dongHoId) {
      console.log('No dongHoId found');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('Fetching statistics for dongHoId:', user.dongHoId);

      // Lấy thống kê tổng quan
      const tongQuanData = await statisticsService.getThongKeTongQuan(user.dongHoId);
      console.log('Tổng quan:', tongQuanData);
      setTongQuan(tongQuanData);

      // Lấy thống kê theo đời
      const theoDoiData = await statisticsService.getThongKeTheoDoi(user.dongHoId);
      console.log('Theo đời:', theoDoiData);
      setTheoDoi(theoDoiData);

      // Lấy thống kê tài chính
      const currentYear = new Date().getFullYear();
      const thuChiData = await statisticsService.getThongKeThuChi(user.dongHoId, currentYear);
      console.log('Thu chi:', thuChiData);
      setThuChi(thuChiData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.dongHoId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [user?.dongHoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2500" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  const pieData = tongQuan
    ? [
        {
          name: 'Nam',
          population: tongQuan.soNam,
          color: '#8B2500',
          legendFontColor: '#3E2723',
          legendFontSize: 13,
        },
        {
          name: 'Nữ',
          population: tongQuan.soNu,
          color: '#D4AF37',
          legendFontColor: '#3E2723',
          legendFontSize: 13,
        },
      ]
    : [];

  // Tính số dư từ thu chi
  const soDu = thuChi ? thuChi.tongThu - thuChi.tongChi : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header đẹp với gradient */}
      <LinearGradient colors={['#7B1F00', '#B83400']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="chart-box-outline" size={32} color="#D4AF37" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Thống Kê</Text>
            <Text style={styles.headerSubtitle}>Dòng họ {user?.full_name?.split(' ')[0] || ''}</Text>
          </View>
        </View>
        
        {/* Quick stats trong header */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <MaterialCommunityIcons name="account-group" size={20} color="#D4AF37" />
            <Text style={styles.quickStatValue}>{tongQuan?.tongThanhVien || 0}</Text>
            <Text style={styles.quickStatLabel}>Thành viên</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStatItem}>
            <MaterialCommunityIcons name="family-tree" size={20} color="#D4AF37" />
            <Text style={styles.quickStatValue}>{tongQuan?.soDoi || 0}</Text>
            <Text style={styles.quickStatLabel}>Đời</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStatItem}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#D4AF37" />
            <Text style={styles.quickStatValue}>{tongQuan?.conSong || 0}</Text>
            <Text style={styles.quickStatLabel}>Còn sống</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B2500']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Tổng quan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 TỔNG QUAN</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <MaterialCommunityIcons name="account-group" size={28} color="#8B2500" />
              <Text style={styles.cardValue}>{tongQuan?.tongThanhVien || 0}</Text>
              <Text style={styles.cardLabel}>Thành viên</Text>
            </View>
            <View style={styles.card}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#4CAF50" />
              <Text style={styles.cardValue}>{tongQuan?.conSong || 0}</Text>
              <Text style={styles.cardLabel}>Đang sống</Text>
            </View>
            <View style={styles.card}>
              <MaterialCommunityIcons name="candle" size={28} color="#9E9E9E" />
              <Text style={styles.cardValue}>{tongQuan?.daMat || 0}</Text>
              <Text style={styles.cardLabel}>Đã khuất</Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 12 }]}>
            <View style={styles.card}>
              <MaterialCommunityIcons name="gender-male" size={28} color="#1565C0" />
              <Text style={styles.cardValue}>{tongQuan?.soNam || 0}</Text>
              <Text style={styles.cardLabel}>Nam</Text>
            </View>
            <View style={styles.card}>
              <MaterialCommunityIcons name="gender-female" size={28} color="#E91E63" />
              <Text style={styles.cardValue}>{tongQuan?.soNu || 0}</Text>
              <Text style={styles.cardLabel}>Nữ</Text>
            </View>
            <View style={styles.card}>
              <MaterialCommunityIcons name="family-tree" size={28} color="#6A1B9A" />
              <Text style={styles.cardValue}>{tongQuan?.soDoi || 0}</Text>
              <Text style={styles.cardLabel}>Số đời</Text>
            </View>
          </View>
        </View>

        {/* Biểu đồ Nam Nữ */}
        {tongQuan && (tongQuan.soNam > 0 || tongQuan.soNu > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 TỶ LỆ GIỚI TÍNH</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Biểu đồ Đời */}
        {theoDoi && theoDoi.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌳 THÀNH VIÊN THEO ĐỜI</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: theoDoi.map((d) => `Đ.${d.doi}`),
                  datasets: [{ data: theoDoi.map((d) => d.soThanhVien) }],
                }}
                width={screenWidth - 48}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </View>
        )}

        {/* Tài chính */}
        {thuChi && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 QUỸ DÒNG HỌ NĂM {new Date().getFullYear()}</Text>
            <View style={[styles.card, { alignItems: 'flex-start', padding: 16, width: '100%' }]}>
              <View style={styles.financeRow}>
                <View style={styles.financeLeft}>
                  <MaterialCommunityIcons name="cash-plus" size={20} color="#4CAF50" />
                  <Text style={styles.financeLabel}>Tổng thu:</Text>
                </View>
                <Text style={styles.financeValueThu}>+{thuChi.tongThu.toLocaleString()} ₫</Text>
              </View>
              <Text style={styles.financeSubText}>({thuChi.soLanThu || 0} lần)</Text>

              <View style={styles.divider} />

              <View style={styles.financeRow}>
                <View style={styles.financeLeft}>
                  <MaterialCommunityIcons name="cash-minus" size={20} color="#F44336" />
                  <Text style={styles.financeLabel}>Tổng chi:</Text>
                </View>
                <Text style={styles.financeValueChi}>-{thuChi.tongChi.toLocaleString()} ₫</Text>
              </View>
              <Text style={styles.financeSubText}>({thuChi.soLanChi || 0} lần)</Text>

              <View style={styles.divider} />

              <View style={styles.financeRow}>
                <View style={styles.financeLeft}>
                  <MaterialCommunityIcons name="wallet" size={20} color="#8B2500" />
                  <Text style={[styles.financeLabel, { fontWeight: 'bold' }]}>Tồn quỹ:</Text>
                </View>
                <Text style={styles.financeValueDu}>{soDu.toLocaleString()} ₫</Text>
              </View>
            </View>
          </View>
        )}

        {/* Thông tin cá nhân ở cuối */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 THÔNG TIN CÁ NHÂN</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={50} color="#D4AF37" />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.full_name || 'Thành viên'}</Text>
                <Text style={styles.profileRole}>
                  {user?.roleCode === 'admin' ? '👑 Quản trị viên' : '🌿 Thành viên'}
                </Text>
              </View>
            </View>
            
            {user?.email && (
              <View style={styles.profileDetail}>
                <MaterialCommunityIcons name="email" size={18} color="#8B2500" />
                <Text style={styles.profileDetailText}>{user.email}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7B1F00',
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  headerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginTop: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  scrollContent: {
    padding: 16,
    backgroundColor: '#F9F5EC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B2500',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
    paddingLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '31%',
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#5D4037',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  financeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  financeLabel: {
    color: '#5D4037',
    fontWeight: '600',
    fontSize: 15,
  },
  financeSubText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    marginLeft: 28,
  },
  financeValueThu: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  financeValueChi: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  financeValueDu: {
    color: '#8B2500',
    fontWeight: 'bold',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D5B8',
    width: '100%',
    marginVertical: 12,
  },
  // Profile card ở cuối
  profileCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF3CD',
    borderWidth: 3,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#8B2500',
    fontWeight: '600',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6D5B8',
  },
  profileDetailText: {
    fontSize: 14,
    color: '#5D4037',
    flex: 1,
  },
});
