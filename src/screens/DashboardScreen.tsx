import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar } from '../components';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = '#E7C530';

// ─── Banners com cores originais ──────────────────────────────────────────────
const BANNERS = [
  { id: '1', color: Colors.archRose,   icon: 'musical-notes-outline' as const, title: 'Culto Dominical',       sub: 'Domingo às 10h · Templo Principal',    screen: null },
  { id: '2', color: Colors.archBlue,   icon: 'calendar-outline'      as const, title: 'Agenda da Semana',      sub: 'Confira os próximos eventos',           screen: 'Events' },
  { id: '3', color: Colors.archYellow, icon: 'ribbon-outline'        as const, title: '160 Anos do Redentor',  sub: '1865 · Celebrando nossa história',      screen: 'Celebration' },
  { id: '4', color: Colors.archGreen,  icon: 'home-outline'          as const, title: 'Pequenos Grupos',       sub: 'Encontre seu grupo desta semana',       screen: 'SmallGroups' },
];

// ─── Módulos (Ionicons brancos em fundo amarelo) ──────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

const MODULES: { icon: IoniconName; label: string; screen: string | null }[] = [
  { icon: 'person-outline',         label: 'Membros',       screen: 'Members' },
  { icon: 'people-outline',         label: 'Peq. Grupos',   screen: 'SmallGroups' },
  { icon: 'calendar-outline',       label: 'Eventos',       screen: 'Events' },
  { icon: 'play-circle-outline',    label: 'Cultos',        screen: 'Cultos' },
  { icon: 'car-outline',            label: 'Estacion.',     screen: 'Parking' },
  { icon: 'happy-outline',          label: 'Kids',          screen: 'KidsList' },
  { icon: 'notifications-outline',  label: 'Notificações',  screen: 'Notifications' },
  { icon: 'settings-outline',       label: 'Config.',       screen: 'Settings' },
];

// ─── Fundo geométrico (raios brancos diagonais sobre cinza claro) ─────────────
function GeometricBg() {
  // Raios brancos saindo do canto inferior esquerdo
  const rays = [20, 38, 55, 72, 90, 108, 126];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {rays.map((angle, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 1600,
            height: 1600,
            left: -600,
            bottom: -600,
            backgroundColor: 'rgba(255,255,255,0.52)',
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const BANNER_W = SCREEN_WIDTH - Spacing.lg * 2;

  const displayName = appUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const firstName = displayName.split(' ')[0];

  // Auto-scroll
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
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={displayName} size={42} index={1} photoURL={appUser?.photoURL} />
          </TouchableOpacity>
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
                style={[styles.bannerSlide, { width: BANNER_W, backgroundColor: b.color }]}
                onPress={() =>
                  b.screen ? navigation.navigate(b.screen) : Alert.alert(b.title, b.sub)
                }
              >
                <View style={styles.bannerIconWrap}>
                  <Ionicons name={b.icon} size={28} color="rgba(255,255,255,0.9)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>{b.title}</Text>
                  <Text style={styles.bannerSub}>{b.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Indicadores coloridos por banner */}
          <View style={styles.dotsRow}>
            {BANNERS.map((b, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveBanner(i);
                  bannerRef.current?.scrollTo({ x: i * BANNER_W, animated: true });
                }}
                style={[
                  styles.dot,
                  {
                    backgroundColor: b.color,
                    flex: i === activeBanner ? 3 : 1,
                    opacity: i === activeBanner ? 1 : 0.3,
                  },
                ]}
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
            <Ionicons name="search-outline" size={16} color="#fff" />
          </View>
        </View>

        {/* ── Grid de módulos — ícone branco em círculo amarelo ── */}
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
                <Ionicons name={m.icon} size={26} color="#fff" />
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
  // Fundo cinza claro para os raios brancos aparecerem
  container: { flex: 1, backgroundColor: '#E8E8E6' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },

  // Banner
  bannerWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  bannerSlide: {
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 88,
    overflow: 'hidden',
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold', marginBottom: 3 },
  bannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.82)' },

  // Indicadores
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    marginBottom: 4,
    width: '50%',
    alignSelf: 'center',
  },
  dot: { height: 5, borderRadius: 3 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid módulos
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moduleItem: { width: '25%', alignItems: 'center', marginBottom: Spacing.lg },
  moduleIconBox: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', maxWidth: 70 },

  // Eventos
  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },
  eventsRow: { paddingHorizontal: Spacing.lg, gap: 12, paddingBottom: 4 },
  eventCard: {
    width: 130,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
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
  eventDay:   { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold' },
  eventLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  eventLocal: { fontSize: 11, color: Colors.textSecondary },
});
