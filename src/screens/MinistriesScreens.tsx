import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { Card } from '../components';
import { useAuth } from '../context/AuthContext';
import {
  Ministry, MinistryMembership, MinistrySchedule,
  MINISTRY_LABELS, MINISTRY_ICONS, MinistryType,
} from '../types';
import {
  getMinistries, getMinistry, createMinistry, updateMinistry,
  getMinistryMemberships, getMembershipsByMember,
  joinMinistry, leaveMinistry, seedDefaultMinistries,
} from '../services/ministries';
import { getSchedules } from '../services/schedules';
import { getMembers } from '../services/members';
import { VOLUNTEER_TERM_TEXT, VOLUNTEER_TERM_VERSION } from '../constants/volunteerTerm';

const ACCENT = '#E7C530';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isAdmin(role?: string) {
  return role === 'administrador' || role === 'pastor';
}
function isLeaderOf(ministry: Ministry, memberId?: string) {
  return !!memberId && ministry.leaderIds.includes(memberId);
}

function MinistryIcon({ type, size = 22, color = ACCENT }: { type: MinistryType; size?: number; color?: string }) {
  return <Ionicons name={MINISTRY_ICONS[type] as any} size={size} color={color} />;
}

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║ 1) MinistriesListScreen                                                     ║
// ╚═════════════════════════════════════════════════════════════════════════════╝
export function MinistriesListScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [myMinistryIds, setMyMinistryIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Auto-seed na primeira vez
      await seedDefaultMinistries().catch(() => {});
      const all = await getMinistries();
      setMinistries(all);
      if (appUser?.memberId) {
        const mine = await getMembershipsByMember(appUser.memberId);
        setMyMinistryIds(new Set(mine.map((m) => m.ministryId)));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os ministérios.');
    } finally {
      setLoading(false);
    }
  }, [appUser?.memberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ministries;
    return ministries.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      MINISTRY_LABELS[m.type].toLowerCase().includes(q)
    );
  }, [ministries, search]);

  const myMinistries  = filtered.filter((m) => myMinistryIds.has(m.id));
  const otherMinistries = filtered.filter((m) => !myMinistryIds.has(m.id));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ministério"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}>
        {myMinistries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Meus Ministérios</Text>
            {myMinistries.map((m) => (
              <MinistryCard key={m.id} ministry={m} mine onPress={() => navigation.navigate('MinistryDetail', { ministryId: m.id })} />
            ))}
            <View style={{ height: 12 }} />
          </>
        )}

        <Text style={styles.sectionTitle}>
          {myMinistries.length > 0 ? 'Outros Ministérios' : 'Todos os Ministérios'}
        </Text>
        {otherMinistries.map((m) => (
          <MinistryCard key={m.id} ministry={m} onPress={() => navigation.navigate('MinistryDetail', { ministryId: m.id })} />
        ))}

        {filtered.length === 0 && (
          <Text style={styles.empty}>Nenhum ministério encontrado.</Text>
        )}
      </ScrollView>

      {isAdmin(appUser?.role) && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMinistry')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function MinistryCard({ ministry, mine, onPress }: { ministry: Ministry; mine?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={[styles.card, mine ? styles.cardMine : null]}>
        <View style={styles.cardIconBox}>
          <MinistryIcon type={ministry.type} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>{ministry.name}</Text>
            {mine && <View style={styles.minePill}><Text style={styles.minePillText}>SOU MEMBRO</Text></View>}
          </View>
          <Text style={styles.cardSub}>
            {MINISTRY_LABELS[ministry.type]}
            {ministry.meetingDay ? ` · ${ministry.meetingDay}` : ''}
            {ministry.meetingTime ? ` ${ministry.meetingTime}` : ''}
          </Text>
          <Text style={styles.cardMeta}>
            {(ministry.leaderNames?.length ?? 0) > 0 ? `Líder: ${ministry.leaderNames!.join(', ')}` : 'Sem líder definido'}
            {' · '}
            {ministry.memberCount ?? 0} {(ministry.memberCount ?? 0) === 1 ? 'membro' : 'membros'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Card>
    </TouchableOpacity>
  );
}

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║ 2) MinistryDetailScreen                                                     ║
// ╚═════════════════════════════════════════════════════════════════════════════╝
type DetailTab = 'info' | 'members' | 'schedules';

export function MinistryDetailScreen({ route, navigation }: any) {
  const { ministryId } = route.params;
  const { appUser } = useAuth();
  const [tab, setTab] = useState<DetailTab>('info');
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [memberships, setMemberships] = useState<MinistryMembership[]>([]);
  const [schedules, setSchedules] = useState<MinistrySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTerm, setShowTerm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, mems, scheds] = await Promise.all([
        getMinistry(ministryId),
        getMinistryMemberships(ministryId),
        getSchedules(ministryId),
      ]);
      setMinistry(m);
      setMemberships(mems);
      setSchedules(scheds);
    } finally {
      setLoading(false);
    }
  }, [ministryId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (ministry) navigation.setOptions({ title: ministry.name });
  }, [ministry, navigation]);

  if (loading || !ministry) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  const isMember  = !!appUser?.memberId && memberships.some((mb) => mb.memberId === appUser.memberId);
  const canEdit   = isAdmin(appUser?.role) || isLeaderOf(ministry, appUser?.memberId);

  const onJoinPress = () => setShowTerm(true);

  const onAcceptTerm = async () => {
    if (!appUser?.memberId || !appUser?.name) {
      Alert.alert('Atenção', 'Seu perfil precisa estar vinculado a um membro para ingressar em ministérios.');
      return;
    }
    setSubmitting(true);
    try {
      await joinMinistry(ministryId, appUser.memberId, appUser.name, VOLUNTEER_TERM_VERSION);
      setShowTerm(false);
      Alert.alert('Bem-vindo(a)!', 'Você agora faz parte deste ministério.');
      load();
    } catch {
      Alert.alert('Erro', 'Não foi possível ingressar no ministério.');
    } finally {
      setSubmitting(false);
    }
  };

  const onLeavePress = () => {
    Alert.alert('Sair do ministério', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          if (!appUser?.memberId) return;
          setSubmitting(true);
          try {
            await leaveMinistry(ministryId, appUser.memberId);
            load();
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header colorido com o ícone do ministério */}
      <View style={styles.detailHeader}>
        <View style={styles.detailIconBox}>
          <MinistryIcon type={ministry.type} size={32} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailName}>{ministry.name}</Text>
          <Text style={styles.detailType}>{MINISTRY_LABELS[ministry.type]}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          { key: 'info',      label: 'Informações' },
          { key: 'members',   label: `Membros (${memberships.length})` },
          { key: 'schedules', label: `Escalas (${schedules.length})` },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'info' && (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
          <Card style={styles.infoCard}>
            {ministry.description ? (
              <Text style={styles.infoText}>{ministry.description}</Text>
            ) : <Text style={styles.infoMuted}>Sem descrição.</Text>}

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoRowText}>
                {ministry.meetingDay
                  ? `${ministry.meetingDay}${ministry.meetingTime ? ' · ' + ministry.meetingTime : ''}`
                  : 'Encontro não definido'}
                {ministry.recurrence ? ` (${ministry.recurrence})` : ''}
              </Text>
            </View>
            {ministry.location ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoRowText}>{ministry.location}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoRowText}>
                {(ministry.leaderNames?.length ?? 0) > 0
                  ? `Líder(es): ${ministry.leaderNames!.join(', ')}`
                  : 'Sem líder definido'}
              </Text>
            </View>
          </Card>

          {canEdit && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('MinistryEdit', { ministryId: ministry.id })}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.btnSecondaryText}>Editar informações</Text>
            </TouchableOpacity>
          )}

          {!isMember ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={onJoinPress} disabled={submitting}>
              <Text style={styles.btnPrimaryText}>{submitting ? 'Aguarde...' : '＋  Ingressar como voluntário'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnDanger} onPress={onLeavePress} disabled={submitting}>
              <Text style={styles.btnDangerText}>{submitting ? 'Aguarde...' : 'Sair do ministério'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {tab === 'members' && (
        <FlatList
          data={memberships}
          keyExtractor={(m) => m.memberId}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Card style={styles.memberRow}>
              <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.memberName}</Text>
                <Text style={styles.memberMeta}>
                  {item.role === 'lider' ? 'Líder' : 'Voluntário'}
                  {' · desde '}
                  {new Date(item.joinedAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum voluntário ainda.</Text>}
        />
      )}

      {tab === 'schedules' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={schedules}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
            renderItem={({ item }) => <ScheduleRow schedule={item} />}
            ListEmptyComponent={<Text style={styles.empty}>Nenhuma escala criada.</Text>}
          />
          {canEdit && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate('AddSchedule', { ministryId: ministry.id, ministryName: ministry.name })}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal do Termo */}
      <Modal visible={showTerm} animationType="slide" onRequestClose={() => setShowTerm(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={styles.termHeader}>
            <Text style={styles.termTitle}>Termo de Voluntariado</Text>
            <TouchableOpacity onPress={() => setShowTerm(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
            <Text style={styles.termText}>{VOLUNTEER_TERM_TEXT}</Text>
          </ScrollView>
          <View style={styles.termFooter}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onAcceptTerm} disabled={submitting}>
              <Text style={styles.btnPrimaryText}>
                {submitting ? 'Aguarde...' : '✓  Li e aceito o termo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ScheduleRow({ schedule }: { schedule: MinistrySchedule }) {
  const dt = new Date(schedule.date + 'T00:00:00');
  const dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return (
    <Card style={styles.scheduleRow}>
      <View style={styles.scheduleDateBox}>
        <Text style={styles.scheduleDay}>{dayStr.replace('.', '')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.scheduleTitle}>{schedule.title || 'Escala'}</Text>
        {schedule.time ? <Text style={styles.scheduleSub}>{schedule.time}</Text> : null}
        {schedule.assignments.length > 0 && (
          <Text style={styles.scheduleAssignments} numberOfLines={2}>
            {schedule.assignments.map((a) => a.role ? `${a.memberName} (${a.role})` : a.memberName).join(' · ')}
          </Text>
        )}
      </View>
    </Card>
  );
}

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║ 3) MinistryEditScreen / AddMinistryScreen                                   ║
// ╚═════════════════════════════════════════════════════════════════════════════╝
export function MinistryEditScreen({ route, navigation }: any) {
  return <MinistryFormScreen ministryId={route.params?.ministryId} navigation={navigation} />;
}

export function AddMinistryScreen({ navigation }: any) {
  return <MinistryFormScreen navigation={navigation} />;
}

function MinistryFormScreen({ ministryId, navigation }: any) {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(!!ministryId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<MinistryType>('outro');
  const [description, setDescription] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [recurrence, setRecurrence] = useState<'semanal' | 'quinzenal' | 'mensal' | ''>('');
  const [leaderIds, setLeaderIds] = useState<string[]>([]);
  const [leaderNames, setLeaderNames] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState<{ id: string; name: string }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const members = await getMembers().catch(() => []);
      setAllMembers(members.map((m) => ({ id: m.id, name: m.name })));
      if (ministryId) {
        const m = await getMinistry(ministryId);
        if (m) {
          setName(m.name);
          setType(m.type);
          setDescription(m.description ?? '');
          setMeetingDay(m.meetingDay ?? '');
          setMeetingTime(m.meetingTime ?? '');
          setLocation(m.location ?? '');
          setRecurrence((m.recurrence as any) ?? '');
          setLeaderIds(m.leaderIds ?? []);
          setLeaderNames(m.leaderNames ?? []);
        }
        setLoading(false);
      }
    })();
  }, [ministryId]);

  const onSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return; }
    setSaving(true);
    try {
      if (ministryId) {
        await updateMinistry(ministryId, {
          name, type, description, meetingDay, meetingTime, location,
          recurrence: (recurrence || undefined) as any,
          leaderIds, leaderNames,
        });
      } else {
        await createMinistry({
          name, type, description, meetingDay, meetingTime, location,
          recurrence: (recurrence || undefined) as any,
          leaderIds, leaderNames,
          status: 'ativo',
          createdBy: appUser?.uid,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('Erro ao salvar ministério:', err);
      Alert.alert('Erro ao salvar', err?.message ?? 'Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLeader = (id: string, n: string) => {
    if (leaderIds.includes(id)) {
      const idx = leaderIds.indexOf(id);
      setLeaderIds(leaderIds.filter((x) => x !== id));
      setLeaderNames(leaderNames.filter((_, i) => i !== idx));
    } else {
      setLeaderIds([...leaderIds, id]);
      setLeaderNames([...leaderNames, n]);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }}>
      <Field label="Nome">
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Louvor Domingo" />
      </Field>

      <Field label="Tipo">
        <View style={styles.chipRow}>
          {(Object.keys(MINISTRY_LABELS) as MinistryType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {MINISTRY_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Descrição">
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descrição do ministério"
          multiline
        />
      </Field>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Dia"><TextInput style={styles.input} value={meetingDay} onChangeText={setMeetingDay} placeholder="Ex: Domingo" /></Field>
        </View>
        <View style={{ width: 110 }}>
          <Field label="Hora"><TextInput style={styles.input} value={meetingTime} onChangeText={setMeetingTime} placeholder="19:30" /></Field>
        </View>
      </View>

      <Field label="Local">
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ex: Templo Principal" />
      </Field>

      <Field label="Recorrência">
        <View style={styles.chipRow}>
          {(['semanal', 'quinzenal', 'mensal'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, recurrence === r && styles.chipActive]}
              onPress={() => setRecurrence(recurrence === r ? '' : r)}
            >
              <Text style={[styles.chipText, recurrence === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label={`Líderes (${leaderIds.length})`}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setPickerOpen(true)}>
          <Ionicons name="people-outline" size={18} color={Colors.primary} />
          <Text style={styles.btnSecondaryText}>
            {leaderNames.length > 0 ? leaderNames.join(', ') : 'Selecionar líderes'}
          </Text>
        </TouchableOpacity>
      </Field>

      <TouchableOpacity style={styles.btnPrimary} onPress={onSave} disabled={saving}>
        <Text style={styles.btnPrimaryText}>{saving ? 'Salvando...' : '✓  Salvar'}</Text>
      </TouchableOpacity>

      {/* Picker de líderes */}
      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={styles.termHeader}>
            <Text style={styles.termTitle}>Selecionar Líderes</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allMembers}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: Spacing.md }}
            renderItem={({ item }) => {
              const checked = leaderIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.pickerRow, checked && styles.pickerRowChecked]}
                  onPress={() => toggleLeader(item.id, item.name)}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.pickerName}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.md, padding: 10, backgroundColor: Colors.surface,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Section
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },

  // Card de ministério
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, marginBottom: 8,
  },
  cardMine: { borderWidth: 1.5, borderColor: ACCENT },
  cardIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(231,197,48,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardMeta:  { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  minePill:  {
    backgroundColor: ACCENT, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  minePillText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 30, fontSize: 13 },

  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 5,
  },

  // Detail
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  detailIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  detailType: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: ACCENT },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textPrimary },

  infoCard: { padding: 14, marginBottom: 12 },
  infoText:  { fontSize: 14, color: Colors.textPrimary, lineHeight: 20, marginBottom: 12 },
  infoMuted: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 12 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  infoRowText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  memberMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  scheduleDateBox: {
    width: 56, paddingVertical: 8, borderRadius: Radius.md,
    backgroundColor: ACCENT, alignItems: 'center',
  },
  scheduleDay: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scheduleTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  scheduleSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scheduleAssignments: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  // Buttons
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 6,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, marginBottom: 8,
  },
  btnSecondaryText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  btnDanger: {
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center', marginTop: 6,
  },
  btnDangerText: { color: Colors.danger, fontWeight: '600', fontSize: 14 },

  // Term modal
  termHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  termTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  termText:  { fontSize: 13, lineHeight: 20, color: Colors.textPrimary },
  termFooter: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },

  // Form
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // Picker
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: Colors.surface,
    borderRadius: Radius.md, marginBottom: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  pickerRowChecked: { borderColor: Colors.primary, backgroundColor: '#F5F8FE' },
  pickerName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
});
