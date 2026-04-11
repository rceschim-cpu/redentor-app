import React, { useEffect, useRef, useState } from 'react';
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
import { Colors, Spacing, Radius } from '../theme';
import { AppText as Text, Avatar } from '../components';
import { useAuth } from '../context/AuthContext';
import { getMembers } from '../services/members';
import { getGroups } from '../services/groups';

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

const MODULES = [
  { icon: '👥', label: 'Membros', sub: 'Cadastro geral', color: '#EDE9F7', screen: 'Members' },
  { icon: '🏘️', label: 'Pequenos Grupos', sub: 'Grupos ativos', color: '#E8F4EA', screen: 'SmallGroups' },
  { icon: '📅', label: 'Eventos', sub: 'Calendário', color: '#E8F2FA', screen: 'Events' },
  { icon: '▶️', label: 'Cultos', sub: 'Links ao vivo', color: '#FDF0E8', screen: 'Cultos' },
  { icon: '🅿️', label: 'Estacionamento', sub: 'Gestão de vagas', color: '#F0F0EE', screen: 'Parking' },
  { icon: '⚙️', label: 'Configurações', sub: 'Tamanho da letra', color: '#F0EFED', screen: 'Settings' },
];

export default function DashboardScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const isAdmin = appUser?.role === 'administrador';
  const [memberCount, setMemberCount] = useState('—');
  const [groupCount, setGroupCount] = useState('—');
  const [activeBanner, setActiveBanner] = useState(0);

  const displayName = appUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  useEffect(() => {
    getMembers()
      .then((m) => setMemberCount(m.length.toString()))
      .catch(() => setMemberCount('—'));
    getGroups()
      .then((g) => setGroupCount(g.length.toString()))
      .catch(() => setGroupCount('—'));
  }, []);


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
            {isAdmin && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Users')}
                style={styles.adminBtn}
              >
                <Text style={styles.adminBtnIcon}>⚙</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={displayName} size={38} index={1} photoURL={appUser?.photoURL} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.greeting}>Bem-vindo de volta</Text>
        <Text style={styles.name}>{displayName}</Text>

        {/* Banner carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          style={styles.bannerScroll}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
            setActiveBanner(index);
          }}
        >
          {BANNERS.map((banner) => (
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
              <Text style={styles.bannerIcon}>{banner.icon}</Text>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSub}>{banner.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicadores do arco vitral */}
        <View style={styles.indicators}>
          {BANNERS.map((b, i) => (
            <View
              key={b.id}
              style={[
                styles.indicatorDot,
                {
                  backgroundColor: b.color,
                  width: i === activeBanner ? 18 : 6,
                  opacity: i === activeBanner ? 1 : 0.35,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.sectionTitle}>MÓDULOS</Text>
        <View style={styles.grid}>
          {MODULES.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={styles.moduleCard}
              activeOpacity={0.75}
              onPress={() =>
                m.screen
                  ? navigation.navigate(m.screen)
                  : Alert.alert(m.label, 'Em breve!')
              }
            >
              <View style={styles.moduleHeader}>
                <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                  <Text style={styles.moduleEmoji}>{m.icon}</Text>
                </View>
                <Text style={styles.moduleLabel} numberOfLines={1} maxScale={1.1}>{m.label}</Text>
              </View>
              <Text style={styles.moduleSub}>{m.sub}</Text>
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
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moduleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moduleEmoji: { fontSize: 16 },
  moduleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  moduleSub: { fontSize: 11, color: Colors.textMuted },
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
  bannerScroll: { marginTop: Spacing.lg, marginBottom: 0 },
  bannerSlide: {
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
  },
  bannerIcon: { fontSize: 26 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    marginBottom: 2,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
});
