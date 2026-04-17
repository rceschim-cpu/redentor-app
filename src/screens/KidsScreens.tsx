import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text as RNText,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { AppText as Text, Avatar, Card, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { Child, ChildAttendance, Guardian, KidsModule } from '../types';
import {
  getChildren,
  getChild,
  addChild,
  updateChild,
  deleteChild,
  markAttendance,
  getAttendance,
  getChildAttendanceHistory,
  calcAgeGroup,
  calcModule,
  calcAge,
} from '../services/kids';
import { maskPhone, maskDate } from '../utils/masks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<KidsModule, string> = {
  kids: 'Redentor Kids',
  ponte: 'Ponte (10-12)',
};

const AGE_GROUP_COLOR: Record<string, string> = {
  '0-3':   Colors.archRose,
  '4-6':   Colors.archGreen,
  '7-9':   Colors.archBlue,
  '10-12': Colors.gold,
};

// ─── KidsList ─────────────────────────────────────────────────────────────────

export function KidsListScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<KidsModule | 'todos'>('todos');
  const [todayAttendance, setTodayAttendance] = useState<Set<string>>(new Set());

  const isStaff =
    appUser?.role === 'administrador' ||
    appUser?.role === 'pastor' ||
    appUser?.role === 'lider';

  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        getChildren(),
        getAttendance(today),
      ])
        .then(([kids, att]) => {
          setChildren(kids);
          setTodayAttendance(new Set(att.map((a) => a.childId)));
        })
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar as crianças.'))
        .finally(() => setLoading(false));
    }, [today])
  );

  const filtered = children.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'todos' || c.module === tab;
    return matchSearch && matchTab;
  });

  const counts = {
    todos: children.length,
    kids: children.filter((c) => c.module === 'kids').length,
    ponte: children.filter((c) => c.module === 'ponte').length,
  };

  const TABS: Array<{ key: KidsModule | 'todos'; label: string }> = [
    { key: 'todos', label: `Todos (${counts.todos})` },
    { key: 'kids', label: `Kids (${counts.kids})` },
    { key: 'ponte', label: `Ponte (${counts.ponte})` },
  ];

  async function handleMarkAttendance(child: Child) {
    if (!appUser) return;
    try {
      await markAttendance(child, appUser.uid, appUser.name);
      setTodayAttendance((prev) => new Set([...prev, child.id]));
      Alert.alert('✓ Presença registrada', `${child.name} marcado(a) presente hoje.`);
    } catch (e: any) {
      Alert.alert('Aviso', e.message || 'Erro ao registrar presença.');
    }
  }

  function renderItem({ item }: { item: Child }) {
    const present = todayAttendance.has(item.id);
    const age = calcAge(item.birthDate);
    const ageColor = AGE_GROUP_COLOR[item.ageGroup] ?? Colors.textMuted;

    return (
      <TouchableOpacity
        style={styles.kidCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('KidDetail', { kidId: item.id })}
      >
        <Avatar name={item.name} size={44} index={item.name.charCodeAt(0) % 4} />
        <View style={styles.kidInfo}>
          <Text style={styles.kidName}>{item.name}</Text>
          <View style={styles.kidMeta}>
            <View style={[styles.agePill, { backgroundColor: ageColor + '22', borderColor: ageColor }]}>
              <Text style={[styles.agePillText, { color: ageColor }]}>{item.ageGroup} anos</Text>
            </View>
            <Text style={styles.kidAge}>{age} anos</Text>
            {item.status === 'inativo' && (
              <View style={styles.inactivePill}>
                <Text style={styles.inactivePillText}>Inativo</Text>
              </View>
            )}
          </View>
        </View>
        {isStaff && (
          <TouchableOpacity
            style={[styles.checkBtn, present && styles.checkBtnDone]}
            onPress={() => !present && handleMarkAttendance(item)}
            activeOpacity={present ? 1 : 0.7}
          >
            <Ionicons
              name={present ? 'checkmark-circle' : 'radio-button-off-outline'}
              size={28}
              color={present ? Colors.archGreen : Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar criança..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabChip, tab === t.key && styles.tabChipActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="happy-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhuma criança encontrada</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      {isStaff && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddKid')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── KidDetail ────────────────────────────────────────────────────────────────

export function KidDetailScreen({ route, navigation }: any) {
  const { kidId } = route.params as { kidId: string };
  const { appUser } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [history, setHistory] = useState<ChildAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff =
    appUser?.role === 'administrador' ||
    appUser?.role === 'pastor' ||
    appUser?.role === 'lider';

  useEffect(() => {
    Promise.all([getChild(kidId), getChildAttendanceHistory(kidId)])
      .then(([c, h]) => {
        setChild(c);
        setHistory(h.slice(0, 10));
        navigation.setOptions({ title: c?.name ?? 'Criança' });
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  }, [kidId]);

  async function handleToggleStatus() {
    if (!child) return;
    const newStatus = child.status === 'ativo' ? 'inativo' : 'ativo';
    Alert.alert(
      newStatus === 'ativo' ? 'Reativar' : 'Inativar',
      `Confirmar mudança de status de ${child.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await updateChild(child.id, { status: newStatus });
            setChild({ ...child, status: newStatus });
          },
        },
      ]
    );
  }

  async function handleDelete() {
    if (!child) return;
    Alert.alert(
      'Excluir criança',
      `Deseja excluir o cadastro de ${child.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteChild(child.id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.textMuted }}>Criança não encontrada.</Text>
      </View>
    );
  }

  const ageColor = AGE_GROUP_COLOR[child.ageGroup] ?? Colors.primary;

  function formatDate(iso: string) {
    // YYYY-MM-DD → DD/MM/YYYY
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header card */}
      <View style={styles.detailHeader}>
        <Avatar name={child.name} size={72} index={child.name.charCodeAt(0) % 4} />
        <Text style={styles.detailName}>{child.name}</Text>
        <View style={styles.detailBadgeRow}>
          <View style={[styles.agePill, { backgroundColor: ageColor + '22', borderColor: ageColor }]}>
            <Text style={[styles.agePillText, { color: ageColor }]}>{child.ageGroup} anos</Text>
          </View>
          <View style={[styles.agePill, { backgroundColor: Colors.archBlue + '22', borderColor: Colors.archBlue }]}>
            <Text style={[styles.agePillText, { color: Colors.archBlue }]}>
              {MODULE_LABELS[child.module]}
            </Text>
          </View>
          {child.status === 'inativo' && (
            <View style={styles.inactivePill}>
              <Text style={styles.inactivePillText}>Inativo</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da Criança</Text>
        <Card style={styles.infoCard}>
          <DetailRowLocal label="Data de nascimento" value={child.birthDate} />
          <DetailRowLocal label="Idade" value={`${calcAge(child.birthDate)} anos`} />
          {child.lastAttendance && (
            <DetailRowLocal
              label="Última presença"
              value={formatDate(child.lastAttendance.split('T')[0])}
            />
          )}
          {child.observations ? (
            <DetailRowLocal label="Observações" value={child.observations} />
          ) : null}
        </Card>
      </View>

      {/* Responsáveis */}
      {child.guardians.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsáveis</Text>
          {child.guardians.map((g, i) => (
            <Card key={i} style={styles.guardianCard}>
              <View style={styles.guardianRow}>
                <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guardianName}>{g.name}</Text>
                  <Text style={styles.guardianRel}>{g.relationship}</Text>
                </View>
                {g.phone ? (
                  <Text style={styles.guardianPhone}>{g.phone}</Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Histórico de presenças */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presenças Recentes</Text>
        {history.length === 0 ? (
          <Card style={styles.infoCard}>
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Nenhuma presença registrada.</Text>
          </Card>
        ) : (
          <Card style={styles.infoCard}>
            {history.map((a, i) => (
              <View key={a.id} style={[styles.attendanceRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.archGreen} style={{ marginRight: 6 }} />
                <Text style={styles.attendanceDate}>{formatDate(a.date)}</Text>
                <Text style={styles.attendanceBy}>{a.registeredByName}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>

      {/* Ações */}
      {isStaff && (
        <View style={[styles.section, { gap: 10 }]}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditKid', { kidId: child.id })}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Editar cadastro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: child.status === 'ativo' ? Colors.danger : Colors.archGreen }]}
            onPress={handleToggleStatus}
          >
            <Ionicons
              name={child.status === 'ativo' ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={18}
              color={child.status === 'ativo' ? Colors.danger : Colors.archGreen}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.editBtnText, { color: child.status === 'ativo' ? Colors.danger : Colors.archGreen }]}>
              {child.status === 'ativo' ? 'Inativar criança' : 'Reativar criança'}
            </Text>
          </TouchableOpacity>
          {appUser?.role === 'administrador' && (
            <TouchableOpacity style={[styles.editBtn, { borderColor: Colors.danger }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.editBtnText, { color: Colors.danger }]}>Excluir cadastro</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── AddKid / EditKid ─────────────────────────────────────────────────────────

interface KidFormState {
  name: string;
  birthDate: string;
  observations: string;
  guardians: Guardian[];
}

const EMPTY_GUARDIAN: Guardian = { name: '', phone: '', relationship: '' };

function KidFormScreen({
  navigation,
  initialData,
  onSave,
  saving,
}: {
  navigation: any;
  initialData: KidFormState;
  onSave: (data: KidFormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<KidFormState>(initialData);
  const [agePreview, setAgePreview] = useState('');

  useEffect(() => {
    if (form.birthDate.length === 10) {
      try {
        const g = calcAgeGroup(form.birthDate);
        const age = calcAge(form.birthDate);
        const mod = calcModule(g);
        setAgePreview(`${age} anos · Faixa ${g} · ${MODULE_LABELS[mod]}`);
      } catch {
        setAgePreview('');
      }
    } else {
      setAgePreview('');
    }
  }, [form.birthDate]);

  function setGuardian(i: number, field: keyof Guardian, value: string) {
    const gs = [...form.guardians];
    gs[i] = { ...gs[i], [field]: value };
    setForm({ ...form, guardians: gs });
  }

  function addGuardian() {
    setForm({ ...form, guardians: [...form.guardians, { ...EMPTY_GUARDIAN }] });
  }

  function removeGuardian(i: number) {
    setForm({ ...form, guardians: form.guardians.filter((_, idx) => idx !== i) });
  }

  function validate() {
    if (!form.name.trim()) return 'Informe o nome da criança.';
    if (form.birthDate.length !== 10) return 'Informe a data de nascimento (DD/MM/AAAA).';
    for (const g of form.guardians) {
      if (!g.name.trim()) return 'Informe o nome de todos os responsáveis.';
    }
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { Alert.alert('Atenção', err); return; }
    onSave(form);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}>
        <Text style={styles.formSectionTitle}>Dados da Criança</Text>

        <Text style={styles.fieldLabel}>Nome completo *</Text>
        <TextInput
          style={styles.fieldInput}
          value={form.name}
          onChangeText={(t) => setForm({ ...form, name: t })}
          placeholder="Ex.: Maria Silva"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Data de nascimento *</Text>
        <TextInput
          style={styles.fieldInput}
          value={form.birthDate}
          onChangeText={(t) => setForm({ ...form, birthDate: maskDate(t) })}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
        {agePreview ? (
          <Text style={styles.agePreview}>{agePreview}</Text>
        ) : null}

        <Text style={styles.fieldLabel}>Observações (alergias, necessidades especiais)</Text>
        <TextInput
          style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
          value={form.observations}
          onChangeText={(t) => setForm({ ...form, observations: t })}
          placeholder="Opcional"
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        <Text style={[styles.formSectionTitle, { marginTop: Spacing.xl }]}>
          Responsáveis
        </Text>

        {form.guardians.map((g, i) => (
          <View key={i} style={styles.guardianFormCard}>
            <View style={styles.guardianFormHeader}>
              <Text style={styles.guardianFormTitle}>Responsável {i + 1}</Text>
              {form.guardians.length > 1 && (
                <TouchableOpacity onPress={() => removeGuardian(i)}>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.fieldInput}
              value={g.name}
              onChangeText={(t) => setGuardian(i, 'name', t)}
              placeholder="Nome do responsável"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.fieldLabel}>Parentesco</Text>
            <TextInput
              style={styles.fieldInput}
              value={g.relationship}
              onChangeText={(t) => setGuardian(i, 'relationship', t)}
              placeholder="Pai, mãe, avó, etc."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.fieldLabel}>Telefone</Text>
            <TextInput
              style={styles.fieldInput}
              value={g.phone}
              onChangeText={(t) => setGuardian(i, 'phone', maskPhone(t))}
              placeholder="(41) 99999-9999"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addGuardianBtn} onPress={addGuardian}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.addGuardianText}>Adicionar responsável</Text>
        </TouchableOpacity>

        <PrimaryButton
          label={saving ? 'Salvando...' : 'Salvar'}
          onPress={handleSave}
          style={{ marginTop: Spacing.xl }}
          disabled={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AddKidScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const initial: KidFormState = {
    name: '',
    birthDate: '',
    observations: '',
    guardians: [{ ...EMPTY_GUARDIAN }],
  };

  async function handleSave(form: KidFormState) {
    if (!appUser) return;
    setSaving(true);
    try {
      const ageGroup = calcAgeGroup(form.birthDate);
      const module = calcModule(ageGroup);
      await addChild({
        name: form.name.trim(),
        birthDate: form.birthDate,
        ageGroup,
        module,
        status: 'ativo',
        guardians: form.guardians.filter((g) => g.name.trim()),
        observations: form.observations.trim(),
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KidFormScreen
      navigation={navigation}
      initialData={initial}
      onSave={handleSave}
      saving={saving}
    />
  );
}

export function EditKidScreen({ route, navigation }: any) {
  const { kidId } = route.params as { kidId: string };
  const [child, setChild] = useState<Child | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getChild(kidId).then((c) => {
      if (c) {
        setChild(c);
        navigation.setOptions({ title: `Editar — ${c.name}` });
      }
    });
  }, [kidId]);

  async function handleSave(form: KidFormState) {
    setSaving(true);
    try {
      const ageGroup = calcAgeGroup(form.birthDate);
      const module = calcModule(ageGroup);
      await updateChild(kidId, {
        name: form.name.trim(),
        birthDate: form.birthDate,
        ageGroup,
        module,
        guardians: form.guardians.filter((g) => g.name.trim()),
        observations: form.observations.trim(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!child) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const initial: KidFormState = {
    name: child.name,
    birthDate: child.birthDate,
    observations: child.observations ?? '',
    guardians: child.guardians.length > 0 ? child.guardians : [{ ...EMPTY_GUARDIAN }],
  };

  return (
    <KidFormScreen
      navigation={navigation}
      initialData={initial}
      onSave={handleSave}
      saving={saving}
    />
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function DetailRowLocal({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // List
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  tabScroll: { maxHeight: 40 },
  tabContent: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 4 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  kidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  kidMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  kidAge: { fontSize: 11, color: Colors.textMuted },
  agePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  agePillText: { fontSize: 10, fontWeight: '700' },
  inactivePill: {
    backgroundColor: Colors.inactiveBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  inactivePillText: { fontSize: 10, fontWeight: '700', color: Colors.inactiveText },
  checkBtn: { padding: 4 },
  checkBtnDone: {},

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // Detail
  detailHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  detailName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingHorizontal: Spacing.lg },
  detailBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },

  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: Spacing.sm },
  infoCard: { padding: Spacing.md },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: { fontSize: 13, color: Colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 12 },

  guardianCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  guardianRow: { flexDirection: 'row', alignItems: 'center' },
  guardianName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  guardianRel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  guardianPhone: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  attendanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  attendanceDate: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  attendanceBy: { fontSize: 12, color: Colors.textMuted, flex: 1, textAlign: 'right' },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Form
  formSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.md },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  agePreview: { fontSize: 12, color: Colors.archBlue, marginTop: 4, fontWeight: '600' },
  guardianFormCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  guardianFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guardianFormTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  addGuardianBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  addGuardianText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
