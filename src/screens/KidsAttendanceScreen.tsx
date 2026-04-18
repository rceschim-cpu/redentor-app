import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/alert';
import { Child, ChildAttendance, KidsModule } from '../types';
import {
  getChildren,
  getAttendance,
  markAttendance,
  removeAttendance,
  calcAge,
} from '../services/kids';

const ACCENT = '#E7C530';

const MODULE_COLORS: Record<KidsModule, string> = {
  kids: '#5BA56A',
  ponte: '#4A90C4',
};

const AGE_LABELS: Record<string, string> = {
  '0-3': '0–3a', '4-6': '4–6a', '7-9': '7–9a', '10-12': '10–12a',
};

export default function KidsAttendanceScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [module, setModule] = useState<KidsModule>('kids');
  const [tab, setTab] = useState<'chamada' | 'marcar'>('chamada');

  // Dados
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<ChildAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca para marcar
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getChildren(), getAttendance(todayStr)])
      .then(([children, att]) => {
        setAllChildren(children);
        setAttendance(att);
      })
      .catch(() => showAlert('Erro', 'Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  // Crianças presentes hoje no módulo selecionado
  const presentIds = new Set(attendance.map((a) => a.childId));
  const presentToday = allChildren.filter(
    (c) => c.module === module && presentIds.has(c.id)
  );

  // Crianças do módulo ainda não marcadas (para a aba "marcar")
  const absent = allChildren.filter(
    (c) =>
      c.module === module &&
      c.status === 'ativo' &&
      !presentIds.has(c.id) &&
      (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleMark = async (child: Child) => {
    if (!appUser) return;
    setMarking(child.id);
    try {
      await markAttendance(child, appUser.uid, appUser.name, 'manual');
      await getAttendance(todayStr).then(setAttendance);
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível registrar.');
    } finally {
      setMarking(null);
    }
  };

  const handleRemove = (att: ChildAttendance) => {
    showConfirm(
      'Remover presença',
      `Remover presença de ${att.childName}?`,
      async () => {
        await removeAttendance(att.id).catch(() =>
          showAlert('Erro', 'Não foi possível remover.')
        );
        setAttendance((prev) => prev.filter((a) => a.id !== att.id));
      },
      'Remover'
    );
  };

  const moduleAttCount = (m: KidsModule) =>
    attendance.filter((a) => a.module === m).length;

  return (
    <View style={styles.container}>
      {/* Data */}
      <View style={styles.dateBar}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.dateText}>{todayLabel}</Text>
      </View>

      {/* Contadores por módulo */}
      <View style={styles.counters}>
        {(['kids', 'ponte'] as KidsModule[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.counterCard,
              { borderColor: MODULE_COLORS[m] },
              module === m && { backgroundColor: MODULE_COLORS[m] },
            ]}
            onPress={() => setModule(m)}
          >
            <Text style={[styles.counterNum, module === m && { color: '#fff' }]}>
              {moduleAttCount(m)}
            </Text>
            <Text style={[styles.counterLabel, module === m && { color: '#fff' }]}>
              {m === 'kids' ? 'Redentor Kids' : 'Ponte'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.counterCard, { borderColor: ACCENT, backgroundColor: ACCENT }]}>
          <Text style={[styles.counterNum, { color: '#fff' }]}>{attendance.length}</Text>
          <Text style={[styles.counterLabel, { color: '#fff' }]}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'chamada', label: 'Presentes hoje' },
          { key: 'marcar', label: 'Marcar presença' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : tab === 'chamada' ? (
        /* ── Lista de presentes ── */
        <FlatList
          data={presentToday}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                Nenhuma criança marcada presente ainda.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const att = attendance.find((a) => a.childId === item.id);
            return (
              <View style={styles.presentRow}>
                <View style={[styles.presentAvatar, { backgroundColor: MODULE_COLORS[item.module] }]}>
                  <Text style={styles.presentInitial}>
                    {item.name.trim()[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>
                    {AGE_LABELS[item.ageGroup]} ·{' '}
                    {att?.registeredBy === 'qrcode' ? 'QR Code' : 'Manual'}
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                {att && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(att)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.qrBtn}
                  onPress={() => navigation.navigate('KidsDetail', { childId: item.id })}
                >
                  <Ionicons name="qr-code-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : (
        /* ── Marcar presença manual ── */
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar criança..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>
          <FlatList
            data={absent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle-outline" size={40} color={Colors.activeText} />
                <Text style={styles.emptyText}>
                  {search
                    ? 'Nenhuma criança encontrada.'
                    : 'Todas as crianças já foram marcadas!'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.absentRow}>
                <View style={[styles.presentAvatar, { backgroundColor: '#E0E0E0' }]}>
                  <Text style={[styles.presentInitial, { color: '#555' }]}>
                    {item.name.trim()[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>
                    {calcAge(item.birthDate)} anos · {AGE_LABELS[item.ageGroup]}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.markBtn,
                    marking === item.id && { opacity: 0.5 },
                  ]}
                  onPress={() => handleMark(item)}
                  disabled={marking === item.id}
                >
                  {marking === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.markBtnText}>✓ Marcar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#F8F8F6',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },

  counters: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.md,
  },
  counterCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  counterNum: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: ACCENT },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textPrimary },

  list: { padding: Spacing.md, paddingBottom: 32 },

  emptyWrap: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', maxWidth: 240 },

  presentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF9',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C8E6CB',
  },
  absentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentInitial: { fontSize: 16, fontWeight: '700', color: '#fff' },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.activeText,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  removeBtn: { padding: 4, marginLeft: 4 },
  qrBtn: { padding: 4, marginLeft: 2 },

  markBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  markBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    marginBottom: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
});
