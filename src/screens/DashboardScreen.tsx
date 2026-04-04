import React, { useEffect, useState } from 'react';
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
import { ArchBar, Avatar } from '../components';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { getMembers } from '../services/members';
import { getGroups } from '../services/groups';

const MODULES = [
  { icon: '👥', label: 'Membros', sub: 'Cadastro geral', color: '#EDE9F7', screen: 'Members' },
  { icon: '🏘️', label: 'Pequenos Grupos', sub: 'Grupos ativos', color: '#E8F4EA', screen: 'SmallGroups' },
  { icon: '📅', label: 'Eventos', sub: 'Calendário', color: '#E8F2FA', screen: null },
  { icon: '▶️', label: 'Cultos', sub: 'Links ao vivo', color: '#FDF0E8', screen: null },
  { icon: '🅿️', label: 'Estacionamento', sub: 'Gestão de vagas', color: '#F0F0EE', screen: null },
];

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [memberCount, setMemberCount] = useState('—');
  const [groupCount, setGroupCount] = useState('—');

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  useEffect(() => {
    getMembers()
      .then((m) => setMemberCount(m.length.toString()))
      .catch(() => setMemberCount('—'));
    getGroups()
      .then((g) => setGroupCount(g.length.toString()))
      .catch(() => setGroupCount('—'));
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <ArchBar />
        <View style={styles.heroRow}>
          <View style={styles.heroLogoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity onPress={handleSignOut}>
            <Avatar name={displayName} size={38} index={1} />
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Bem-vindo de volta</Text>
        <Text style={styles.name}>{displayName}</Text>
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
              <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                <Text style={styles.moduleEmoji}>{m.icon}</Text>
              </View>
              <Text style={styles.moduleLabel}>{m.label}</Text>
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
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroLogo: { width: 130, height: 46 },
  greeting: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: Colors.headerText, fontFamily: 'Lora_600SemiBold' },
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
});
