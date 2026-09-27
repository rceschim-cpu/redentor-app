import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Spacing } from '../theme';
import { Avatar } from '../components';
import { GroupRequest } from '../types';
import {
  getGroupRequests, approveGroupRequest, rejectGroupRequest,
} from '../services/groupRequests';
import { can } from '../services/permissions';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';

const STATUS_STYLE = {
  pendente: { bg: '#FFF8EC', fg: '#7A6010', label: 'Pendente' },
  aprovado: { bg: Colors.activeBg, fg: Colors.activeText, label: 'Aprovado' },
  recusado: { bg: Colors.inactiveBg, fg: Colors.inactiveText, label: 'Recusado' },
};

// Monta a linha de detalhes do grupo proposto, pulando o que ficou em branco
function groupSummary(g: GroupRequest['group']): string {
  const parts = [
    g.meetingDay && g.meetingTime ? `${g.meetingDay} às ${g.meetingTime}` : g.meetingDay,
    g.neighborhood || g.location,
    g.recurrence,
    g.status === 'em_formacao' ? 'em formação' : undefined,
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function GroupRequestsScreen() {
  const { user, appUser } = useAuth();
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const canDecide = can(appUser?.role, 'solicitacao_grupo', 'editar');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await getGroupRequests());
    } catch {
      showAlert('Erro', 'Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleApprove(req: GroupRequest) {
    setBusyId(req.id);
    try {
      await approveGroupRequest(req.id, user?.uid ?? '', appUser?.name ?? '');
      await load();
      showAlert(
        'Grupo criado',
        `"${req.group.name}" já aparece na lista, com ${req.userName} como líder.`
      );
    } catch (e: any) {
      showAlert('Erro ao aprovar', e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req: GroupRequest) {
    if (!reason.trim()) {
      showAlert('Motivo obrigatório', 'Explique por que a solicitação foi recusada.');
      return;
    }
    setBusyId(req.id);
    try {
      await rejectGroupRequest(req.id, user?.uid ?? '', appUser?.name ?? '', reason.trim());
      setRejectingId(null);
      setReason('');
      await load();
    } catch (e: any) {
      showAlert('Erro ao recusar', e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={requests}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhuma solicitação de grupo até agora.</Text>
      }
      renderItem={({ item: req }) => {
        const st = STATUS_STYLE[req.status];
        const busy = busyId === req.id;
        const isRejecting = rejectingId === req.id;
        const summary = groupSummary(req.group);

        return (
          <View style={styles.card}>
            <View style={styles.head}>
              <Avatar name={req.userName || req.userEmail} size={40} index={2} />
              <View style={styles.headInfo}>
                <Text style={styles.name}>{req.userName || 'Sem nome'}</Text>
                <Text style={styles.email}>{req.userEmail}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Text style={[styles.badgeText, { color: st.fg }]}>{st.label}</Text>
              </View>
            </View>

            <View style={styles.groupBox}>
              <Text style={styles.groupIcon}>{req.group.icon ?? '🏠'}</Text>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{req.group.name}</Text>
                {summary ? <Text style={styles.groupMeta}>{summary}</Text> : null}
              </View>
            </View>

            {req.justification ? (
              <Text style={styles.justification}>{req.justification}</Text>
            ) : null}

            {req.status !== 'pendente' && req.resolvedByName ? (
              <Text style={styles.resolved}>
                {st.label} por {req.resolvedByName}
                {req.decisionReason ? ` — ${req.decisionReason}` : ''}
              </Text>
            ) : null}

            {canDecide && req.status === 'pendente' && (
              <>
                {isRejecting && (
                  <TextInput
                    style={styles.reasonInput}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Motivo da recusa"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />
                )}
                <View style={styles.actions}>
                  {isRejecting ? (
                    <>
                      <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={() => { setRejectingId(null); setReason(''); }}
                        disabled={busy}
                      >
                        <Text style={styles.btnGhostText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnDanger}
                        onPress={() => handleReject(req)}
                        disabled={busy}
                      >
                        {busy
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={styles.btnDangerText}>Confirmar recusa</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={() => setRejectingId(req.id)}
                        disabled={busy}
                      >
                        <Text style={styles.btnGhostText}>Recusar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => handleApprove(req)}
                        disabled={busy}
                      >
                        {busy
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={styles.btnPrimaryText}>Aprovar e criar</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                <Text style={styles.note}>
                  Ao aprovar, o grupo é criado e {req.userName.split(' ')[0]} vira
                  líder — ganhando o perfil de Líder de PG, se ainda for membro.
                </Text>
              </>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 10 },
  empty: {
    textAlign: 'center', color: Colors.textMuted,
    marginTop: 44, fontSize: 15,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  email: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },

  groupBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  groupIcon: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: 'Lora_600SemiBold',
  },
  groupMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },

  justification: {
    fontSize: 14, color: Colors.textSecondary,
    lineHeight: 20, fontStyle: 'italic',
  },
  resolved: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  note: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  reasonInput: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: 12,
    minHeight: 72, fontSize: 14,
    color: Colors.textPrimary, textAlignVertical: 'top',
  },

  actions: { flexDirection: 'row', gap: 10 },
  btnGhost: {
    flex: 1, minHeight: 46, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnPrimary: {
    flex: 1.3, minHeight: 46, borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDanger: {
    flex: 1, minHeight: 46, borderRadius: Radius.lg,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDangerText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
