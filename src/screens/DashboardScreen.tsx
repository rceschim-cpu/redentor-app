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
  Image,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar } from '../components';
import { useAuth } from '../context/AuthContext';
import { useBanners } from '../context/BannersContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = '#E7C530';
const BG = '#4A4A47';           // cinza escuro — contrasta com branco dos cards

// ─── Banners com cores originais ──────────────────────────────────────────────
const BANNERS = [
  { id: '1', color: Colors.archRose,   icon: 'musical-notes-outline' as const, title: 'Culto Dominical',      sub: 'Domingo às 10h · Templo Principal',  screen: null },
  { id: '2', color: Colors.archBlue,   icon: 'calendar-outline'      as const, title: 'Agenda da Semana',     sub: 'Confira os próximos eventos',         screen: 'Events' },
  { id: '3', color: Colors.archYellow, icon: 'ribbon-outline'        as const, title: '160 Anos do Redentor', sub: '1865 · Celebrando nossa história',    screen: 'CelebrationTab' },
  { id: '4', color: Colors.archGreen,  icon: 'home-outline'          as const, title: 'Pequenos Grupos',      sub: 'Encontre seu grupo desta semana',     screen: 'SmallGroupsTab' },
];

// ─── Módulos ──────────────────────────────────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

const MODULES: { icon: IoniconName; label: string; screen: string | null }[] = [
  { icon: 'person-outline',        label: 'Membros',      screen: 'MembersTab' },
  { icon: 'people-outline',        label: 'Peq. Grupos',  screen: 'SmallGroupsTab' },
  { icon: 'calendar-outline',      label: 'Eventos',      screen: 'Events' },
  { icon: 'play-circle-outline',   label: 'Cultos',       screen: 'Cultos' },
  { icon: 'car-outline',           label: 'Estacion.',    screen: 'Parking' },
  { icon: 'happy-outline',         label: 'Kids',         screen: 'KidsList' },
  { icon: 'hand-right-outline',    label: 'Ministérios',  screen: 'Ministries' },
  { icon: 'settings-outline',      label: 'Config.',      screen: 'Settings' },
];

// ─── Fundo geométrico ─────────────────────────────────────────────────────────
// Base cinza médio + raios brancos diagonais saindo do canto inferior esquerdo
function GeometricBg() {
  const rays = [18, 34, 50, 66, 82, 98, 114, 130];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {rays.map((angle, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 1800,
            height: 1800,
            left: -700,
            bottom: -700,
            backgroundColor: 'rgba(255,255,255,0.28)',
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
  const { bannerImages } = useBanners();
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const activeBannerRef = useRef(0);

  const goToBanner = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, BANNERS.length - 1));
    activeBannerRef.current = clamped;
    setActiveBanner(clamped);
  };

  const bannerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -30) goToBanner(activeBannerRef.current + 1);
        else if (g.dx > 30) goToBanner(activeBannerRef.current - 1);
      },
    })
  ).current;

  const displayName = appUser?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const firstName = displayName.split(' ')[0];

  // Auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeBannerRef.current + 1) % BANNERS.length;
      goToBanner(next);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredModules = MODULES.filter((m) =>
    search === '' || m.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <GeometricBg />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Cabeçalho: logo | saudação | avatar ── */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.greetingWrap}>
            <Text style={styles.greeting}>Bem-Vindo</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={displayName} size={40} index={1} photoURL={appUser?.photoURL} />
          </TouchableOpacity>
        </View>

        {/* ── Divisor header / banners ── */}
        <View style={styles.headerDivider}>
          <View style={styles.headerDividerLine} />
          <View style={styles.headerDividerAccent} />
          <View style={styles.headerDividerLine} />
        </View>

        {/* ── Banner carousel ── */}
        <View style={styles.bannerWrap}>
          <View
            {...bannerPan.panHandlers}
            style={{ borderRadius: Radius.lg, overflow: 'hidden' }}
          >
            {(() => {
              const b = BANNERS[activeBanner];
              const imageURL = bannerImages[b.id];
              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.bannerSlide, { backgroundColor: b.color }]}
                  onPress={() => b.screen ? navigation.navigate(b.screen) : Alert.alert(b.title, b.sub)}
                >
                  {imageURL ? (
                    // Imagem personalizada cobre o slide inteiro
                    <Image
                      source={{ uri: imageURL }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : null}
                  {/* Overlay de texto — sempre visível */}
                  <View style={[styles.bannerOverlay, imageURL ? styles.bannerOverlayImg : null]}>
                    {!imageURL && (
                      <View style={styles.bannerIconWrap}>
                        <Ionicons name={b.icon} size={26} color="rgba(255,255,255,0.9)" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannerTitle}>{b.title}</Text>
                      <Text style={styles.bannerSub}>{b.sub}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* Indicadores coloridos */}
          <View style={styles.dotsRow}>
            {BANNERS.map((b, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goToBanner(i)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: b.color,
                    flex: i === activeBanner ? 3 : 1,
                    opacity: i === activeBanner ? 1 : 0.35,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Barra de pesquisa com borda ── */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar"
            placeholderTextColor="#888"
          />
          <View style={styles.searchBtn}>
            <Ionicons name="search-outline" size={16} color="#fff" />
          </View>
        </View>

        {/* ── Grid de módulos ── */}
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
                <Ionicons name={m.icon} size={26} color={ACCENT} />
              </View>
              <Text style={styles.moduleLabel} numberOfLines={1}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Divisor ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* ── Próximos Eventos ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsRow}
        >
          {[
            { day: '19/04', label: 'Culto de Sábado',    local: 'Templo Principal' },
            { day: '27/04', label: 'Culto Dominical',    local: 'Templo Principal' },
            { day: '02/05', label: 'Reunião de PG',      local: 'Redentor' },
            { day: '04/05', label: 'Culto Dominical',    local: 'Templo Principal' },
          ].map((ev, i) => {
            const today = new Date();
            const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}`;
            const isToday = ev.day === todayStr;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                style={[styles.eventCard, isToday && styles.eventCardToday]}
                onPress={() => navigation.navigate('Events')}
              >
                <View style={[styles.eventDateBox, isToday && styles.eventDateBoxToday]}>
                  <Text style={[styles.eventDay, isToday && styles.eventDayToday]}>{ev.day}</Text>
                </View>
                <Text style={[styles.eventLabel, isToday && styles.eventLabelToday]} numberOfLines={2}>{ev.label}</Text>
                <Text style={[styles.eventLocal, isToday && styles.eventLocalToday]}>{ev.local}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header com logo | saudação | avatar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  logo: { width: 110, height: 40 },

  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Saudação (centro do header)
  greetingWrap: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 0.3 },
  name: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },

  // Divisor entre header e banners
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  headerDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  headerDividerAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },

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
  bannerOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerOverlayImg: {
    // quando há imagem, escurece levemente o rodapé para o texto ser legível
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  bannerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold', marginBottom: 3 },
  bannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.82)' },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    marginBottom: 2,
    width: '50%',
    alignSelf: 'center',
  },
  dot: { height: 5, borderRadius: 3 },

  // Search — com borda visível
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleLabel: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', maxWidth: 70 },

  // Divisor entre módulos e eventos
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
  dividerDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },

  // Eventos
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },
  sectionLink:  { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  eventsRow: { paddingHorizontal: Spacing.lg, gap: 12, paddingBottom: 4 },
  eventCard: {
    width: 130,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  eventDateBox: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: Radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDateBoxToday: { backgroundColor: '#fff' },
  eventDay:   { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },
  eventDayToday: { color: ACCENT },
  eventLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  eventLabelToday: { color: '#fff' },
  eventLocal: { fontSize: 11, color: Colors.textSecondary },
  eventLocalToday: { color: 'rgba(255,255,255,0.8)' },
  eventCardToday: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
});
