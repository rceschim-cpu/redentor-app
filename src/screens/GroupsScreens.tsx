import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, Card, DetailRow, PrimaryButton } from '../components';
import { Group, GroupMembership } from '../types';
import { getGroups, getGroup, updateGroup, deleteGroup } from '../services/groups';
import { getMemberships, getPendingRequests, getUserMembership, requestToJoin } from '../services/memberships';
import { canCreateGroup, canManageGroup, canViewRequests } from '../services/permissions';
import { useAuth } from '../context/AuthContext';

// ─── Lista de Pequenos Grupos ──────────────────────────────────────────────────
export function GroupsListScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os grupos.'))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = appUser ? canCreateGroup(appUser.role) : false;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🏘️</Text>
            <Text style={styles.emptyText}>Nenhum grupo cadastrado ainda.</Text>
          </View>
        }
        renderItem={({ item: group }) => {
          const hasPending = (group.pendingCount ?? 0) > 0;
          const showPending =
            appUser &&
            canViewRequests(appUser.role, user?.uid ?? '', group.leaderId) &&
            hasPending;

          return (
            <TouchableOpacity
              style={styles.groupCard}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('GroupDetail', { groupId: group.id })
              }
            >
              <View style={styles.groupTop}>
                <View style={styles.groupIconWrap}>
                  <Text style={styles.groupEmoji}>{group.icon ?? '🏠'}</Text>
                </View>
                <View style={styles.groupMeta}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupLeader}>
                    Líder: {group.leaderName ?? '—'}
                  </Text>
                </View>
                {showPending ? (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{group.pendingCount}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.pillRow}>
                <View style={styles.pillBlue}>
                  <Text style={styles.pillBlueText}>
                    {group.memberCount ?? 0} membros
                  </Text>
                </View>
                {group.meetingDay ? (
                  <View style={styles.pillGray}>
                    <Text style={styles.pillGrayText}>
                      {group.meetingDay}{group.meetingTime ? ` · ${group.meetingTime}` : ''}
                    </Text>
                  </View>
                ) : null}
                <View style={group.status === 'ativo' ? styles.pillGreen : styles.pillOrange}>
                  <Text style={group.status === 'ativo' ? styles.pillGreenText : styles.pillOrangeText}>
                    {group.status === 'ativo' ? 'Ativo' : 'Em formação'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddGroup')}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Detalhe do Grupo ──────────────────────────────────────────────────────────
export function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { user, appUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [myMembership, setMyMembership] = useState<GroupMembership | null | 'loading'>('loading');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const statusBarHeight = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24);

  useEffect(() => {
    const load = async () => {
      try {
        const [g, mems] = await Promise.all([
          getGroup(groupId),
          getMemberships(groupId),
        ]);
        setGroup(g);
        setMembers(mems);
        setPendingCount(g?.pendingCount ?? 0);

        if (user) {
          const mine = await getUserMembership(groupId, user.uid);
          setMyMembership(mine);
        } else {
          setMyMembership(null);
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar o grupo.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, user]);

  const handleJoinRequest = async () => {
    if (!user || !appUser) return;
    setJoining(true);
    try {
      await requestToJoin(groupId, user.uid, appUser.name, appUser.email);
      const mine = await getUserMembership(groupId, user.uid);
      setMyMembership(mine);
      Alert.alert('Solicitação enviada!', 'Aguarde a aprovação do líder do grupo.');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a solicitação.');
    } finally {
      setJoining(false);
    }
  };

  if (loading || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const isManager = appUser
    ? canManageGroup(appUser.role, user?.uid ?? '', group.leaderId)
    : false;

  const canSeeRequests = appUser
    ? canViewRequests(appUser.role, user?.uid ?? '', group.leaderId)
    : false;

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={[styles.groupHero, { paddingTop: statusBarHeight + 16 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { top: statusBarHeight + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.heroIconRow}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroEmoji}>{group.icon ?? '🏠'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{group.name}</Text>
            <Text style={styles.heroSub}>
              {[group.meetingDay, group.meetingTime, group.neighborhood]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{group.memberCount ?? 0}</Text>
            <Text style={styles.heroStatLbl}>Membros</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>
              {group.status === 'ativo' ? 'Ativo' : 'Formação'}
            </Text>
            <Text style={styles.heroStatLbl}>Status</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
        {/* Informações */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.cardTitle}>INFORMAÇÕES</Text>
          <DetailRow label="Líder" value={group.leaderName} accent />
          {group.coLeaderName && <DetailRow label="Co-líder" value={group.coLeaderName} />}
          {group.location && <DetailRow label="Local" value={group.location} />}
          {group.neighborhood && <DetailRow label="Bairro" value={group.neighborhood} />}
        </Card>

        {/* Solicitações pendentes — só para gestores */}
        {canSeeRequests && pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingCard}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('GroupMemberRequests', {
                groupId,
                groupName: group.name,
              })
            }
          >
            <View style={styles.pendingLeft}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>
                {pendingCount} solicitação{pendingCount > 1 ? 'ões' : ''} pendente{pendingCount > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.pendingArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Membros aprovados */}
        {members.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>MEMBROS DO GRUPO</Text>
            {members.map((m, i) => (
              <View key={m.id} style={styles.memberChip}>
                <Avatar name={m.userName} size={34} index={i} />
                <Text style={styles.chipName}>{m.userName}</Text>
                {m.userId === group.leaderId && (
                  <View style={styles.pillGreen}>
                    <Text style={styles.pillGreenText}>Líder</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Botão de ação baseado no status do usuário */}
        <View style={{ marginTop: 16 }}>
          {myMembership === 'loading' ? null : myMembership === null ? (
            <PrimaryButton
              label={joining ? 'Enviando...' : 'Solicitar Ingresso'}
              onPress={handleJoinRequest}
            />
          ) : myMembership.status === 'pendente' ? (
            <View style={styles.pendingMine}>
              <Text style={styles.pendingMineText}>
                ⏳  Solicitação enviada — aguardando aprovação
              </Text>
            </View>
          ) : myMembership.status === 'aprovado' ? (
            <View style={styles.approvedMine}>
              <Text style={styles.approvedMineText}>
                ✅  Você é membro deste grupo
              </Text>
            </View>
          ) : null}

          {canSeeRequests && pendingCount === 0 && (
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() =>
                navigation.navigate('GroupMemberRequests', {
                  groupId,
                  groupName: group.name,
                })
              }
            >
              <Text style={styles.btnOutlineText}>Ver solicitações</Text>
            </TouchableOpacity>
          )}
        </View>

        {isManager && (
          <TouchableOpacity
            style={styles.btnEdit}
            onPress={() => navigation.navigate('AddGroup', { group })}
          >
            <Text style={styles.btnEditText}>Editar grupo</Text>
          </TouchableOpacity>
        )}
        {appUser?.role === 'administrador' && (
          <TouchableOpacity
            style={styles.btnDelete}
            onPress={() =>
              Alert.alert(
                'Excluir grupo',
                `Tem certeza que deseja excluir "${group.name}"? Esta ação não pode ser desfeita.`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteGroup(group.id);
                        navigation.goBack();
                      } catch {
                        Alert.alert('Erro', 'Não foi possível excluir o grupo.');
                      }
                    },
                  },
                ]
              )
            }
          >
            <Text style={styles.btnDeleteText}>Excluir grupo</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  groupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: { fontSize: 20 },
  groupMeta: { flex: 1 },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  groupLeader: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pendingBadge: {
    backgroundColor: Colors.archRose,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pillBlue: {
    backgroundColor: '#E8F2FA',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillBlueText: { fontSize: 11, fontWeight: '700', color: '#2D6EA0' },
  pillGreen: {
    backgroundColor: Colors.activeBg,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillGreenText: { fontSize: 11, fontWeight: '700', color: Colors.activeText },
  pillOrange: {
    backgroundColor: Colors.visitorBg,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillOrangeText: { fontSize: 11, fontWeight: '700', color: Colors.visitorText },
  pillGray: {
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillGrayText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  groupHero: { backgroundColor: Colors.headerBg, padding: Spacing.lg },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: { fontSize: 26, color: Colors.textPrimary, lineHeight: 30, marginTop: -2 },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    marginTop: 8,
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 24 },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.headerText,
    fontFamily: 'Lora_600SemiBold',
  },
  heroSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroStatNum: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  heroStatLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  detailBody: { flex: 1, padding: Spacing.md },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pendingCard: {
    backgroundColor: '#FFF8EC',
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0DC9A',
    marginBottom: 12,
  },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.archTan,
  },
  pendingText: { fontSize: 13, fontWeight: '600', color: '#7A6010' },
  pendingArrow: { fontSize: 16, color: '#7A6010' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  memberChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  chipName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  pendingMine: {
    backgroundColor: '#FFF8EC',
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0DC9A',
  },
  pendingMineText: { fontSize: 14, fontWeight: '600', color: '#7A6010' },
  approvedMine: {
    backgroundColor: Colors.activeBg,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8DFC0',
  },
  approvedMineText: { fontSize: 14, fontWeight: '600', color: Colors.activeText },
  btnOutline: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnEdit: { marginTop: 10, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center' },
  btnEditText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  btnDelete: { marginTop: 8, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#C0392B', alignItems: 'center' },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: '#C0392B' },
});
