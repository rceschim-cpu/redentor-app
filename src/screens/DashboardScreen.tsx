import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar } from '../components';
import { useAuth } from '../context/AuthContext';
import { getMembers } from '../services/members';
import { getGroups } from '../services/groups';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT = '#E7C530';
const ACCENT_LIGHT = 'rgba(231,197,48,0.13)';

// ─── Banners ──────────────────────────────────────────────────────────────────
const BANNERS = [
  { id: '1', title: 'Culto Dominical', sub: 'Domingo às 10h · Templo Principal', screen: null },
  { id: '2', title: 'Agenda da Semana', sub: 'Confira os próximos eventos', screen: null },
  { id: '3', title: '160 Anos do Redentor', sub: '1865 · Celebrando nossa história', screen: 'Celebration' },
  { id: '4', title: 'Pequenos Grupos', sub: 'Encontre seu grupo desta semana', screen: 'SmallGroups' },
];

// ─── Módulos ──────────────────────────────────────────────────────────────────
const MODULES = [
  { icon: '👥', label: 'Membros',       screen: 'Members' },
  { icon: '🏘️', label: 'Peq. Grupos',   screen: 'SmallGroups' },
  { icon: '📅', label: 'Eventos',       screen: null },
  { icon: '▶️', label: 'Cultos',        screen: 'Cultos' },
  { icon: '🅿️', label: 'Estacion.',    screen: 'Parking' },
  { icon: '🧒', label: 'Kids',          screen: 'KidsList' },
  { icon: '🔔', label: 'Notificações', screen: 'Notifications' },
  { icon: '⚙️', label: 'Config.',       screen: 'Settings' },
];

// ─── Fundo Geométrico ─────────────────────────────────────────────────────────
function GeometricBg() {
  const rays = [
    { rotate: '35deg',  left: -300, bottom: -300, opacity: 0.045 },
    { rotate: '50deg',  left: -300, bottom: -300, opacity: 0.055 },
    { rotate: '65deg',  left: -300, bottom: -300, opacity: 0.04  },
    { rotate: '80deg',  left: -300, bottom: -300, opacity: 0.05  },
    { rotate: '95deg',  left: -300, bottom: -300, opacity: 0.035 },
    { rotate: '115deg', left: -300, bottom: -300, opacity: 0.04  },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {rays.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 1200,
            height: 1200,
            left: r.left,
            bottom: r.bottom,
            backgroundColor: `rgba(0,0,0,${r.opacity})`,
            transform: [{ rotate: r.rotate }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const BANNER_W = SCREEN_WIDTH - Spacing.lg * 2;

  const displayName = appUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const firstName = displayName.split(' ')[0];

  // Auto-scroll banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [BANNER_W]);

  const filteredModules = MODULES.filter((m) =>
    search === '' || m.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <GeometricBg />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Cabeçalho ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bem-Vindo</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={displayName} size={40} index={1} photoURL={appUser?.photoURL} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Banner carousel ── */}
        <View style={styles.bannerWrap}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_W);
              setActiveBanner(Math.max(0, Math.min(idx, BANNERS.length - 1)));
            }}
            style={{ borderRadius: Radius.lg, overflow: 'hidden' }}
          >
            {BANNERS.map((b) => (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.88}
                style={[styles.bannerSlide, { width: BANNER_W }]}
                onPress={() =>
                  b.screen ? navigation.navigate(b.screen) : Alert.alert(b.title, b.sub)
                }
              >
                <View style={styles.bannerInner}>
                  <Text style={styles.bannerTitle}>{b.title}</Text>
                  <Text style={styles.bannerSub}>{b.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Indicadores */}
          <View style={styles.dotsRow}>
            {BANNERS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveBanner(i);
                  bannerRef.current?.scrollTo({ x: i * BANNER_W, animated: true });
                }}
                style={[styles.dot, i === activeBanner && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* ── Barra de pesquisa ── */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar"
            placeholderTextColor="#AAAAAA"
          />
          <View style={styles.searchBtn}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        {/* ── Grid de módulos (4 colunas) ── */}
        <View style={styles.grid}>
          {filteredModules.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={styles.moduleItem}
              activeOpacity={0.75}
              onPress={() =>
                m.screen ? navigation.navigate(m.screen) : Alert.alert(m.label, 'Em breve!')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleEmoji}>{m.icon}</Text>
              </View>
              <Text style={styles.moduleLabel} numberOfLines={1}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Próximos Eventos ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsRow}
        >
          {[
            { day: '27/04', label: 'Culto Dominical', local: 'Templo Principal' },
            { day: '02/05', label: 'Reunião de PG',   local: 'Redentor' },
            { day: '04/05', label: 'Culto Dominical', local: 'Templo Principal' },
          ].map((ev, i) => (
            <View key={i} style={styles.eventCard}>
              <View style={styles.eventDateBox}>
                <Text style={styles.eventDay}>{ev.day}</Text>
              </View>
              <Text style={styles.eventLabel} numberOfLines={2}>{ev.label}</Text>
              <Text style={styles.eventLocal}>{ev.local}</Text>
            </View>
          ))}
        </ScrollView>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'SourceSans3_400Regular',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Banner
  bannerWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bannerSlide: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: ACCENT,
  },
  bannerInner: {
    padding: 20,
    minHeight: 90,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Lora_600SemiBold',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  dotActive: {
    width: 18,
    backgroundColor: ACCENT,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: { fontSize: 14 },

  // Grid de módulos
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moduleItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  moduleIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(231,197,48,0.2)',
  },
  moduleEmoji: { fontSize: 22 },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 70,
  },

  // Eventos
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  eventsRow: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    paddingBottom: 4,
  },
  eventCard: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  eventDateBox: {
    backgroundColor: ACCENT,
    borderRadius: Radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Lora_600SemiBold',
  },
  eventLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  eventLocal: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
