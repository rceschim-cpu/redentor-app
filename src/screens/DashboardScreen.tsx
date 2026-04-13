import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text as RNText,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { AppText as Text, Avatar } from '../components';
import { useAuth } from '../context/AuthContext';
import { getMembers } from '../services/members';
import { getGroups } from '../services/groups';
import { getUnreadCount } from '../services/notifications';
import { getAllBanners } from '../services/banners';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const BANNERS = [
  {
    id: '1',
    color: Colors.archRose,
    icon: '⛪',
    title: 'Culto Dominical',
    sub: 'Domingo às 10h · Templo Principal',
    screen: null,
  },
  {
    id: '2',
    color: Colors.archBlue,
    icon: '📅',
    title: 'Agenda da Semana',
    sub: 'Confira os próximos eventos',
    screen: 'Events',
  },
  {
    id: '3',
    color: Colors.gold,
    icon: '✦',
    title: '160 Anos do Redentor',
    sub: '1865 · Celebrando nossa história',
    screen: 'Celebration',
  },
  {
    id: '4',
    color: Colors.archGreen,
    icon: '🏘️',
    title: 'Pequenos Grupos',
    sub: 'Encontre seu grupo desta semana',
    screen: 'SmallGroups',
  },
];

type ModuleItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: string;
  adminOnly?: boolean;
  staffOnly?: boolean;
};

const MODULES: ModuleItem[] = [
  { icon: 'people-outline',         label: 'Membros',        screen: 'MembersList',   staffOnly: true },
  { icon: 'grid-outline',           label: 'Peq. Grupos',    screen: 'GroupsList' },
  { icon: 'calendar-outline',       label: 'Eventos',        screen: 'Events' },
  { icon: 'play-circle-outline',    label: 'Cultos',         screen: 'Cultos' },
  { icon: 'ribbon-outline',         label: '160 Anos',       screen: 'Celebration' },
  { icon: 'book-outline',            label: 'Bíblia',         screen: 'Bible' },
  { icon: 'notifications-outline',  label: 'Notificações',   screen: 'Notifications' },
  { icon: 'car-outline',            label: 'Estacionamento', screen: 'Parking' },
  { icon: 'settings-outline',       label: 'Configurações',  screen: 'Settings' },
];

export default function DashboardScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const isAdmin = appUser?.role === 'administrador';
  const isStaff = appUser?.role === 'administrador' || appUser?.role === 'pastor';
  const [memberCount, setMemberCount] = useState('—');
  const [groupCount, setGroupCount] = useState('—');
  const [activeBanner, setActiveBanner] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bannerImages, setBannerImages] = useState<Record<string, string>>({});
  const bannerScrollRef = useRef<ScrollView>(null);

  const displayName = appUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  useEffect(() => {
    getMembers()
      .then((m) => setMemberCount(m.length.toString()))
      .catch(() => setMemberCount('—'));
    getGroups()
      .then((g) => setGroupCount(g.length.toString()))
      .catch(() => setGroupCount('—'));
    getAllBanners()
      .then((all) => {
        const imgs: Record<string, string> = {};
        Object.entries(all).forEach(([id, b]) => { if (b.imageURL) imgs[id] = b.imageURL; });
        setBannerImages(imgs);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (appUser?.uid) {
        getUnreadCount(appUser.uid)
          .then(setUnreadCount)
          .catch(() => setUnreadCount(0));
      }
    }, [appUser?.uid])
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroLogoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.adminBtn}
            >
              <Text style={styles.adminBtnIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={displayName} size={38} index={1} photoURL={appUser?.photoURL} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.greeting}>Bem-vindo de volta</Text>
        <Text style={styles.name}>{displayName}</Text>

        {/* Banner carousel */}
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={BANNER_WIDTH}
          snapToAlignment="start"
          disableIntervalMomentum
          style={styles.bannerScroll}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
            setActiveBanner(Math.max(0, Math.min(index, BANNERS.length - 1)));
          }}
        >
          {BANNERS.map((banner) => {
            const imageURL = bannerImages[banner.id];
            return (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.85}
                style={[styles.bannerSlide, { width: BANNER_WIDTH, backgroundColor: banner.color }]}
                onPress={() =>
                  banner.screen
                    ? navigation.navigate(banner.screen)
                    : Alert.alert(banner.title, banner.sub)
                }
              >
                {imageURL ? (
                  <Image
                    source={{ uri: imageURL }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
                {/* overlay para legibilidade quando há imagem */}
                {imageURL && (
                  <View style={[StyleSheet.absoluteFill, styles.bannerOverlay]} />
                )}
                <Text style={styles.bannerIcon}>{banner.icon}</Text>
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSub}>{banner.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Indicadores do arco vitral */}
        <View style={styles.indicators}>
          {BANNERS.map((b, i) => (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.7}
              style={[
                styles.indicatorDot,
                {
                  backgroundColor: b.color,
                  flex: i === activeBanner ? 3 : 1,
                  height: i === activeBanner ? 6 : 4,
                  opacity: i === activeBanner ? 1 : 0.3,
                },
              ]}
              onPress={() => {
                setActiveBanner(i);
                bannerScrollRef.current?.scrollTo({ x: i * BANNER_WIDTH, animated: true });
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {isStaff && (
          <View style={styles.statsRow}>
            {[
              { num: memberCount, label: 'Membros' },
              { num: groupCount, label: 'Grupos' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.iconGrid}>
          {MODULES.filter(
            (m) => (!m.adminOnly || isAdmin) && (!m.staffOnly || isStaff)
          ).map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.iconItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={26} color={Colors.textPrimary} />
              </View>
              <Text style={styles.iconLabel} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroLogoWrap: {
    backgroundColor: 'transparent',
  },
  heroLogo: { width: 130, height: 46 },
  greeting: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: Colors.headerText, fontFamily: 'Inter_700Bold' },
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBtnIcon: { fontSize: 18, color: Colors.textPrimary },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.textOnDark,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    lineHeight: 11,
  },
  bannerScroll: { marginTop: Spacing.lg, marginBottom: 0 },
  bannerSlide: {
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    overflow: 'hidden',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.lg,
  },
  bannerIcon: { fontSize: 26 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    marginBottom: 2,
    width: '50%',
    alignSelf: 'center',
  },
  indicatorDot: {
    borderRadius: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFEFED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 90,
  },
});
