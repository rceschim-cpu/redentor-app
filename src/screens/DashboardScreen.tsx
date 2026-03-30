import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { ArchBar, Avatar, StatusBadge } from '../components';
import { mockMembers } from '../data/mock';

const MODULES = [
  { icon: '👥', label: 'Membros', sub: 'Cadastro geral', color: '#EDE9F7', screen: 'Members' },
  { icon: '🏘️', label: 'Pequenos Grupos', sub: '14 grupos ativos', color: '#E8F4EA', screen: 'Groups' },
  { icon: '📅', label: 'Eventos', sub: 'Calendário', color: '#E8F2FA', screen: null },
  { icon: '▶️', label: 'Cultos', sub: 'Links ao vivo', color: '#FDF0E8', screen: null },
  { icon: '🅿️', label: 'Estacionamento', sub: 'Gestão de vagas', color: '#F0F0EE', screen: null },
];

export default function DashboardScreen({ navigation }: any) {
  const recentMembers = mockMembers.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <ArchBar />
        <View style={styles.heroRow}>
          <Image
            source={require('../../logo2color.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Avatar name="João Silva" size={38} index={1} />
        </View>
        <Text style={styles.greeting}>Bem-vindo de volta</Text>
        <Text style={styles.name}>João Silva</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: '248', label: 'Membros' },
            { num: '14', label: 'Grupos' },
            { num: '3', label: 'Eventos' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Módulos */}
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
                  : Alert.alert(`${m.label}`, 'Em breve!')
              }
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                <Text style={styles.moduleEmoji}>{m.icon}</Text>
              </View>
              <Text style={styles.moduleLabel}>{m.label}</Text>
              <Text style={styles.moduleSub}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Membros recentes */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>NOVOS MEMBROS</Text>
        {recentMembers.map((m, i) => (
          <TouchableOpacity
            key={m.id}
            style={styles.memberRow}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('Members', {
                screen: 'MemberDetail',
                params: { memberId: m.id },
              })
            }
          >
            <Avatar name={m.name} size={38} index={m.avatarIndex ?? i} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberSub}>Adicionado recentemente</Text>
            </View>
            <StatusBadge status={m.status} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  heroLogo: { width: 140, height: 52 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold' },
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
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },
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
  },
  moduleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  moduleEmoji: { fontSize: 16 },
  moduleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  moduleSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  memberRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  memberSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
