import React, { useCallback, useState } from 'react';
import {
  View,
  Text as RNText,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Linking,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { AppText as Text, Avatar, Card, DetailRow, PrimaryButton } from '../components';
import { Group, GroupMembership, GroupMaterial } from '../types';
import { getGroups, getGroup, updateGroup, deleteGroup } from '../services/groups';
import { getMemberships, getPendingRequests, getUserMembership, requestToJoin, removeMember, transferMember } from '../services/memberships';
import { getMaterials, uploadMaterial, deleteMaterial } from '../services/materials';
import { canCreateGroup, canManageGroup, canViewRequests } from '../services/permissions';
import { showAlert, showConfirm } from '../utils/alert';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('video')) return '🎬';
  return '📎';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Lista de Pequenos Grupos ──────────────────────────────────────────────────
export function GroupsListScreen({ navigation }: any) {
  const { user, appUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getGroups()
        .then(setGroups)
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar os grupos.'))
        .finally(() => setLoading(false));
    }, [])
  );

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

  // ── Group & members state
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [myMembership, setMyMembership] = useState<GroupMembership | null | 'loading'>('loading');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<GroupMembership | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [transferring, setTransferring] = useState(false);

  // ── Tab state
  const [activeTab, setActiveTab] = useState<'grupo' | 'materiais'>('grupo');

  // ── Materials state
  const [materials, setMaterials] = useState<GroupMaterial[]>([]);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const load = async () => {
        try {
          const [g, mems] = await Promise.all([
            getGroup(groupId),
            getMemberships(groupId),
          ]);
          setGroup(g);
          if (g) navigation.setOptions({ title: g.name });
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
    }, [groupId, user])
  );

  // ── Load materials when the tab is first opened
  const handleMaterialsTab = () => {
    setActiveTab('materiais');
    if (!materialsLoaded && !materialsLoading) {
      setMaterialsLoading(true);
      getMaterials(groupId)
        .then((mats) => {
          setMaterials(mats);
          setMaterialsLoaded(true);
        })
        .catch(() => showAlert('Erro', 'Não foi possível carregar os materiais.'))
        .finally(() => setMaterialsLoading(false));
    }
  };

  // ── File picker & upload (web only)
  const pickFile = () => {
    if (Platform.OS !== 'web') {
      showAlert('Upload', 'O upload de arquivos está disponível apenas pelo app web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.txt,.zip';
    input.onchange = (e: any) => {
      const file: File | undefined = e.target?.files?.[0];
      if (file) {
        setPendingFile(file);
        // Pre-fill title with filename without extension
        setPendingTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    input.click();
  };

  const cancelPendingUpload = () => {
    setPendingFile(null);
    setPendingTitle('');
  };

  const handleUpload = async () => {
    if (!pendingFile || !appUser) return;
    setUploading(true);
    try {
      const mat = await uploadMaterial(
        groupId,
        pendingFile,
        pendingTitle,
        '',
        appUser.uid,
        appUser.name
      );
      setMaterials((prev) => [mat, ...prev]);
      cancelPendingUpload();
    } catch (err: any) {
      showAlert('Erro no upload', err?.message ?? 'Não foi possível enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = (mat: GroupMaterial) => {
    showConfirm(
      'Excluir material',
      `Excluir "${mat.title}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteMaterial(mat.id, mat.fileURL);
          setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
        } catch {
          showAlert('Erro', 'Não foi possível excluir o material.');
        }
      },
      'Excluir'
    );
  };

  const openMaterial = (url: string) => {
    if (Platform.OS === 'web') {
      (window as any).open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => showAlert('Erro', 'Não foi possível abrir o arquivo.'));
    }
  };

  // ── Group action handlers
  const handleJoinRequest = async () => {
    if (!user || !appUser) return;
    setJoining(true);
    try {
      await requestToJoin(groupId, user.uid, appUser.name, appUser.email);
      const mine = await getUserMembership(groupId, user.uid);
      setMyMembership(mine);
      showAlert('Solicitação enviada!', 'Aguarde a aprovação do líder do grupo.');
    } catch {
      showAlert('Erro', 'Não foi possível enviar a solicitação.');
    } finally {
      setJoining(false);
    }
  };

  const handleRemoveMember = (m: GroupMembership) => {
    const doRemove = async () => {
      setRemovingId(m.id);
      try {
        await removeMember(groupId, m.id, m.userId);
        setMembers((prev) => prev.filter((x) => x.id !== m.id));
        setGroup((g) => g ? { ...g, memberCount: (g.memberCount ?? 1) - 1 } : g);
      } catch (err: any) {
        showAlert('Erro', err?.message ?? 'Erro ao remover.');
      } finally {
        setRemovingId(null);
      }
    };
    showConfirm('Remover membro', `Remover ${m.userName} do grupo?`, doRemove, 'Remover');
  };

  const openTransferPicker = async (m: GroupMembership) => {
    setTransferTarget(m);
    if (allGroups.length === 0) {
      const { getGroups } = await import('../services/groups');
      const gs = await getGroups();
      setAllGroups(gs.filter((g) => g.id !== groupId));
    }
  };

  const handleTransfer = async (toGroup: Group) => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await transferMember(
        groupId, transferTarget.id, transferTarget.userId,
        transferTarget.userName, transferTarget.userEmail, toGroup.id
      );
      setMembers((prev) => prev.filter((x) => x.id !== transferTarget.id));
      setGroup((g) => g ? { ...g, memberCount: (g.memberCount ?? 1) - 1 } : g);
      setTransferTarget(null);
      showAlert('Transferido!', `${transferTarget.userName} foi movido para ${toGroup.name}.`);
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Erro ao transferir.');
    } finally {
      setTransferring(false);
    }
  };

  const handleGroupDelete = () => {
    const doDelete = async () => {
      try {
        await deleteGroup(group!.id);
        navigation.goBack();
      } catch {
        showAlert('Erro', 'Não foi possível excluir o grupo.');
      }
    };
    showConfirm(
      'Excluir grupo',
      `Tem certeza que deseja excluir "${group!.name}"? Esta ação não pode ser desfeita.`,
      doDelete,
      'Excluir'
    );
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

  const canUploadMaterials =
    appUser?.role === 'pastor' || appUser?.role === 'administrador';

  return (
    <View style={styles.container}>
      {/* ── Hero ── */}
      <View style={styles.groupHero}>
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

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grupo' && styles.tabActive]}
          onPress={() => setActiveTab('grupo')}
        >
          <RNText style={[styles.tabText, activeTab === 'grupo' && styles.tabTextActive]}>
            Grupo
          </RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'materiais' && styles.tabActive]}
          onPress={handleMaterialsTab}
        >
          <RNText style={[styles.tabText, activeTab === 'materiais' && styles.tabTextActive]}>
            Materiais
          </RNText>
        </TouchableOpacity>
      </View>

      {/* ── Tab: Grupo ── */}
      {activeTab === 'grupo' && (
        <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
          {/* Informações */}
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.cardTitle}>INFORMAÇÕES</Text>
            <DetailRow label="Líder" value={group.leaderName} accent />
            {group.coLeaderName && <DetailRow label="Co-líder" value={group.coLeaderName} />}
            {group.location && <DetailRow label="Local" value={group.location} />}
            {group.neighborhood && <DetailRow label="Bairro" value={group.neighborhood} />}
          </Card>

          {/* Solicitações pendentes */}
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
                  {isManager && m.userId !== group.leaderId && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.memberActionBtn}
                        onPress={() => openTransferPicker(m)}
                        disabled={!!removingId}
                      >
                        <Text style={styles.memberActionTransfer}>↔</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.memberActionBtn}
                        onPress={() => handleRemoveMember(m)}
                        disabled={removingId === m.id}
                      >
                        <Text style={styles.memberActionRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Modal de transferência */}
          {transferTarget && (
            <View style={styles.transferPicker}>
              <Text style={styles.transferTitle}>
                Transferir {transferTarget.userName} para:
              </Text>
              {allGroups.length === 0 ? (
                <Text style={styles.transferEmpty}>Nenhum outro grupo disponível.</Text>
              ) : (
                allGroups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.transferOption}
                    onPress={() => handleTransfer(g)}
                    disabled={transferring}
                  >
                    <Text style={styles.transferOptionText}>{g.icon ?? '🏠'} {g.name}</Text>
                    {transferring && (
                      <Text style={{ color: Colors.textMuted, fontSize: 12 }}>...</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                onPress={() => setTransferTarget(null)}
                style={styles.transferCancel}
              >
                <Text style={styles.transferCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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
              onPress={handleGroupDelete}
            >
              <Text style={styles.btnDeleteText}>Excluir grupo</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ── Tab: Materiais ── */}
      {activeTab === 'materiais' && (
        <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
          {/* Upload button — pastor / admin only */}
          {canUploadMaterials && !pendingFile && (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickFile}>
              <RNText style={styles.uploadBtnText}>＋ Adicionar material</RNText>
            </TouchableOpacity>
          )}

          {/* Pending upload form */}
          {pendingFile && (
            <View style={styles.pendingUploadCard}>
              <RNText style={styles.pendingFileName} numberOfLines={1}>
                {getFileIcon(pendingFile.type)}  {pendingFile.name}
                {pendingFile.size ? `  ·  ${formatFileSize(pendingFile.size)}` : ''}
              </RNText>
              <TextInput
                style={styles.pendingTitleInput}
                value={pendingTitle}
                onChangeText={setPendingTitle}
                placeholder="Título do material"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <View style={styles.pendingBtns}>
                <TouchableOpacity
                  style={[styles.pendingBtn, styles.pendingBtnCancel]}
                  onPress={cancelPendingUpload}
                  disabled={uploading}
                >
                  <RNText style={styles.pendingBtnCancelText}>Cancelar</RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pendingBtn, styles.pendingBtnUpload, uploading && { opacity: 0.6 }]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  <RNText style={styles.pendingBtnUploadText}>
                    {uploading ? 'Enviando…' : 'Enviar'}
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Materials list */}
          {materialsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 28 }} />
          ) : materials.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyText}>
                {canUploadMaterials
                  ? 'Nenhum material publicado ainda.\nClique em "Adicionar material" para começar.'
                  : 'Nenhum material disponível para este grupo.'}
              </Text>
            </View>
          ) : (
            materials.map((mat) => (
              <View key={mat.id} style={styles.materialCard}>
                <RNText style={styles.materialIcon}>
                  {getFileIcon(mat.fileType)}
                </RNText>
                <View style={styles.materialInfo}>
                  <RNText style={styles.materialTitle} numberOfLines={2}>
                    {mat.title}
                  </RNText>
                  <RNText style={styles.materialMeta}>
                    {mat.uploaderName} · {formatDate(mat.uploadedAt)}
                    {mat.fileSize ? `  ·  ${formatFileSize(mat.fileSize)}` : ''}
                  </RNText>
                </View>
                <View style={styles.materialActions}>
                  <TouchableOpacity
                    style={styles.materialActionBtn}
                    onPress={() => openMaterial(mat.fileURL)}
                  >
                    <RNText style={styles.materialDownloadIcon}>⬇</RNText>
                  </TouchableOpacity>
                  {canUploadMaterials && (
                    <TouchableOpacity
                      style={styles.materialActionBtn}
                      onPress={() => handleDeleteMaterial(mat)}
                    >
                      <RNText style={styles.materialDeleteIcon}>✕</RNText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
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
    fontFamily: 'Inter_700Bold',
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

  // ── Group hero
  groupHero: { backgroundColor: Colors.headerBg, padding: Spacing.lg },
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
    fontFamily: 'Inter_700Bold',
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
    fontFamily: 'Inter_700Bold',
  },
  heroStatLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ── Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
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
    backgroundColor: Colors.archYellow,
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
  memberActions: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  memberActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  memberActionTransfer: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  memberActionRemove: { fontSize: 13, color: Colors.danger, fontWeight: '700' },
  transferPicker: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
    gap: 8,
  },
  transferTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  transferEmpty: { fontSize: 13, color: Colors.textMuted },
  transferOption: {
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferOptionText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  transferCancel: { alignItems: 'center', paddingVertical: 8 },
  transferCancelText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  btnEdit: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  btnEditText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDelete: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#C0392B',
    alignItems: 'center',
  },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // ── Materials tab
  uploadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  pendingUploadCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 10,
  },
  pendingFileName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pendingTitleInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  pendingBtns: { flexDirection: 'row', gap: 10 },
  pendingBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  pendingBtnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pendingBtnCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pendingBtnUpload: { backgroundColor: Colors.primary },
  pendingBtnUploadText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  materialCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  materialIcon: { fontSize: 26 },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  materialMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  materialActions: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  materialActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  materialDownloadIcon: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  materialDeleteIcon: { fontSize: 12, color: Colors.danger, fontWeight: '700' },
});
