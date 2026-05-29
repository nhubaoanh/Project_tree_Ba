import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, Card, Divider } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';
import { memberService } from '../../src/services/memberService';
import { Member } from '../../src/types';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentCha, setParentCha] = useState<Member | null>(null);
  const [parentMe, setParentMe] = useState<Member | null>(null);
  const [spouse, setSpouse] = useState<Member | null>(null);
  const [childrenList, setChildrenList] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMemberDetail = async () => {
      if (!user?.dongHoId || !id) return;

      // Reset state khi chuyển sang thành viên khác
      setLoading(true);
      setMember(null);
      setParentCha(null);
      setParentMe(null);
      setSpouse(null);
      setChildrenList([]);

      try {
        const data = await memberService.getMemberById(user.dongHoId, parseInt(id as string));
        setMember(data);
        
        // Fetch all members once to find relationships
        const allMembers = await memberService.getAllMembers(user.dongHoId);

        // Find parents
        if (data.chaId) {
          const cha = allMembers.find(m => Number(m.thanhVienId) === Number(data.chaId));
          if (cha) setParentCha(cha);
        }
        if (data.meId) {
          const me = allMembers.find(m => Number(m.thanhVienId) === Number(data.meId));
          if (me) setParentMe(me);
        }

        // Find spouse (vợ/chồng)
        if (data.voId) {
          const vo = allMembers.find(m => Number(m.thanhVienId) === Number(data.voId));
          if (vo) setSpouse(vo);
        } else if (data.chongId) {
          const chong = allMembers.find(m => Number(m.thanhVienId) === Number(data.chongId));
          if (chong) setSpouse(chong);
        }

        // Find children
        const children = allMembers.filter(
          m => Number(m.chaId) === Number(data.thanhVienId) || Number(m.meId) === Number(data.thanhVienId)
        );
        setChildrenList(children);

      } catch (error) {
        console.error('Lỗi tải chi tiết thành viên:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberDetail();
  }, [id, user?.dongHoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2500" />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="account-off" size={48} color="#C4A265" />
        <Text style={styles.notFoundText}>Không tìm thấy thành viên</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri = member.anhChanDung || member.anhDaiDien || 'https://giaphaso.vn/images/vangoc.jpg';
  const isDead = !!member.ngayMat;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ thành viên</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Avatar.Image
                size={100}
                source={{ uri: avatarUri }}
                style={styles.avatar}
              />
              {isDead && (
                <View style={styles.deceasedBadge}>
                  <MaterialCommunityIcons name="candle" size={12} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{member.hoTen}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, member.gioiTinh === 1 ? styles.maleBadge : styles.femaleBadge]}>
                <MaterialCommunityIcons
                  name={member.gioiTinh === 1 ? 'gender-male' : 'gender-female'}
                  size={12}
                  color={member.gioiTinh === 1 ? '#1565C0' : '#AD1457'}
                />
                <Text style={[styles.badgeText, { color: member.gioiTinh === 1 ? '#1565C0' : '#AD1457' }]}>
                  {member.gioiTinh === 1 ? 'Nam' : 'Nữ'}
                </Text>
              </View>
              {member.doiThuoc && (
                <View style={styles.badgeG}>
                  <MaterialCommunityIcons name="family-tree" size={12} color="#6A1B9A" />
                  <Text style={styles.badgeTextG}>Đời thứ {member.doiThuoc}</Text>
                </View>
              )}
              {isDead && (
                <View style={styles.badgeDead}>
                  <Text style={styles.badgeTextDead}>Đã mất</Text>
                </View>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Info Rows */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>📋 Thông tin cá nhân</Text>
            <InfoRow icon="cake-variant" label="Ngày sinh" value={member.ngaySinh ? new Date(member.ngaySinh).toLocaleDateString('vi-VN') : '---'} />
            <InfoRow icon="map-marker-circle" label="Nơi sinh" value={member.noiSinh || '---'} />
            {isDead && (
              <>
                <InfoRow icon="candle" label="Ngày mất" value={new Date(member.ngayMat!).toLocaleDateString('vi-VN')} />
                <InfoRow icon="map-marker-remove" label="Nơi mất" value={member.noiMat || '---'} />
              </>
            )}
            <Divider style={styles.dividerSmall} />
            <InfoRow icon="briefcase" label="Nghề nghiệp" value={member.ngheNghiep || '---'} />
            <InfoRow icon="school" label="Học vấn" value={member.trinhDoHocVan || '---'} />
            <InfoRow icon="map-marker" label="Địa chỉ" value={member.diaChiHienTai || '---'} />
            <InfoRow icon="phone" label="Số điện thoại" value={member.soDienThoai || '---'} />
          </View>
        </Card>

        {/* Tiểu sử */}
        {!!member.tieuSu && (
          <>
            <Text style={styles.sectionTitle}>📜 Tiểu sử</Text>
            <Card style={styles.biographyCard}>
              <View style={styles.biographyContent}>
                <MaterialCommunityIcons name="book-open-variant" size={20} color="#8B2500" style={{ marginBottom: 8 }} />
                <Text style={styles.biographyText}>{member.tieuSu}</Text>
              </View>
            </Card>
          </>
        )}

        {/* Gia đình */}
        <Text style={styles.sectionTitle}>👨‍👩‍👧 Thông tin Gia đình</Text>
        <Card style={styles.familyCard}>
          {/* Cha */}
          <TouchableOpacity
            onPress={() => {
              if (parentCha) router.push(`/member/${parentCha.thanhVienId}` as any);
            }}
            activeOpacity={parentCha ? 0.7 : 1}
          >
            <View style={styles.familyRow}>
              <View style={styles.familyLabelContainer}>
                <MaterialCommunityIcons name="human-male" size={22} color="#8B2500" />
                <Text style={styles.familyLabel}>Cha</Text>
              </View>
              <View style={styles.familyValueContainer}>
                <Text style={[styles.familyValue, parentCha && styles.familyValueLink]}>
                  {parentCha ? parentCha.hoTen : 'Chưa cập nhật'}
                </Text>
                {parentCha && <MaterialCommunityIcons name="chevron-right" size={18} color="#8B2500" />}
              </View>
            </View>
          </TouchableOpacity>

          <Divider style={styles.dividerSmall} />

          {/* Mẹ */}
          <TouchableOpacity
            onPress={() => {
              if (parentMe) router.push(`/member/${parentMe.thanhVienId}` as any);
            }}
            activeOpacity={parentMe ? 0.7 : 1}
          >
            <View style={styles.familyRow}>
              <View style={styles.familyLabelContainer}>
                <MaterialCommunityIcons name="human-female" size={22} color="#D4AF37" />
                <Text style={styles.familyLabel}>Mẹ</Text>
              </View>
              <View style={styles.familyValueContainer}>
                <Text style={[styles.familyValue, parentMe && styles.familyValueLink]}>
                  {parentMe ? parentMe.hoTen : 'Chưa cập nhật'}
                </Text>
                {parentMe && <MaterialCommunityIcons name="chevron-right" size={18} color="#8B2500" />}
              </View>
            </View>
          </TouchableOpacity>

          <Divider style={styles.dividerSmall} />

          {/* Vợ / Chồng */}
          <TouchableOpacity
            onPress={() => {
              if (spouse) router.push(`/member/${spouse.thanhVienId}` as any);
            }}
            activeOpacity={spouse ? 0.7 : 1}
          >
            <View style={styles.familyRow}>
              <View style={styles.familyLabelContainer}>
                <MaterialCommunityIcons
                  name={member.gioiTinh === 1 ? 'human-female' : 'human-male'}
                  size={22}
                  color="#E91E63"
                />
                <Text style={styles.familyLabel}>{member.gioiTinh === 1 ? 'Vợ' : 'Chồng'}</Text>
              </View>
              <View style={styles.familyValueContainer}>
                <Text style={[styles.familyValue, spouse && styles.familyValueLink]}>
                  {spouse ? spouse.hoTen : 'Chưa cập nhật'}
                </Text>
                {spouse && <MaterialCommunityIcons name="chevron-right" size={18} color="#8B2500" />}
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Con cái */}
        {childrenList.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Con cái ({childrenList.length})</Text>
            <Card style={styles.familyCard}>
              {childrenList.map((child, index) => (
                <View key={child.thanhVienId}>
                  <TouchableOpacity onPress={() => router.push(`/member/${child.thanhVienId}` as any)} activeOpacity={0.7}>
                    <View style={styles.childRow}>
                      <MaterialCommunityIcons
                        name={child.gioiTinh === 1 ? 'face-man' : 'face-woman'}
                        size={22}
                        color={child.gioiTinh === 1 ? '#1565C0' : '#E91E63'}
                      />
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.hoTen}</Text>
                        <Text style={styles.childSub}>
                          {child.gioiTinh === 1 ? 'Nam' : 'Nữ'}
                          {child.doiThuoc ? ` · Đời ${child.doiThuoc}` : ''}
                          {child.ngayMat ? ' · Đã mất' : ''}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                    </View>
                  </TouchableOpacity>
                  {index < childrenList.length - 1 && <Divider style={styles.dividerSmall} />}
                </View>
              ))}
            </Card>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#8B2500" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

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
  },
  backBtn: {
    marginTop: 8,
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
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#E6D5B8',
  },
  deceasedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#555',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFF9E6',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B2500',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  maleBadge: {
    backgroundColor: '#E3F2FD',
  },
  femaleBadge: {
    backgroundColor: '#FCE4EC',
  },
  badgeG: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeDead: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextG: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  badgeTextDead: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D5B8',
  },
  infoSection: {
    padding: 16,
  },
  infoSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B2500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 130,
  },
  infoLabel: {
    fontSize: 13,
    color: '#5D4037',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3E2723',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8B2500',
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  biographyCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    borderLeftWidth: 3,
    borderLeftColor: '#8B2500',
    elevation: 1,
    marginBottom: 20,
  },
  biographyContent: {
    padding: 16,
  },
  biographyText: {
    fontSize: 14,
    color: '#3E2723',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  familyCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    padding: 4,
  },
  familyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  familyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  familyLabel: {
    fontSize: 15,
    color: '#5D4037',
    fontWeight: '600',
  },
  familyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  familyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  familyValueLink: {
    color: '#8B2500',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  dividerSmall: {
    height: 1,
    backgroundColor: '#F0E4CC',
    marginHorizontal: 12,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    color: '#3E2723',
    fontWeight: '600',
  },
  childSub: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
  },
});
