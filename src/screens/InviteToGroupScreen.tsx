import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { Avatar } from '../components';
import { AppUserProfile } from '../types';
import { getAllUsers } from '../services/userProfile';
import {
  getMemberships, getPendingInvites, getPendingRequests, inviteToGroup,
} from '../services/memberships';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';

export default function InviteToGroupScreen({ navigation, route }: any) {
  const { groupId, groupName } = route.params ?? {};
  const { user, appUser } = useAuth();

  const [candidates, setCandidates] = useState<AppUserProfile[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [users, members, invites, requests] = await Promise.all([
        getAllUsers(),
        getMemberships(groupId),
        getPendingInvites(groupId),
        getPendingRequests(groupId),
      ]);
      // Quem já está no grupo, já foi convidado ou já pediu não aparece
      const linked = new Set<string>([
        ...members.map((m) => m.userId),
        ...invites.map((m) => m.userId),
        ...requests.map((m) => m.userId),
      ]);
      setLinkedIds(linked);
      setCandidates(users.filter((u) => !linked.has(u.uid)));
    } catch {
      showAlert('Erro', 'Não foi possível carregar as pessoas.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((u) =>
      (u.name ?? '').toLowerCase().includes(term) ||
      (u.email ?? '').toLowerCase().includes(term)
    );
  }, [candidates, search]);

  function toggle(uid: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleSend() {
    if (picked.size === 0) return;
    setSending(true);

    const chosen = candidates.filter((u) => picked.has(u.uid));
    const failures: string[] = [];

    // Um a um: um convite recusado pelo servidor não deve cancelar os outros
    for (const u of chosen) {
      try {
        await inviteToGroup(
          groupId,
          groupName,
          { userId: u.uid, userName: u.name ?? u.email ?? 'Sem nome', userEmail: u.email ?? '' },
          user?.uid ?? '',
          appUser?.name ?? ''
        );
      } catch (e: any) {
        failures.push(`${u.name ?? u.email}: ${e.message}`);
      }
    }

    setSending(false);
    const sent = chosen.length - failures.length;

    if (failures.length === 0) {
      showAlert(
        'Convites enviados',
        sent === 1
          ? 'A pessoa recebeu o convite e precisa aceitar para entrar no grupo.'
          : `${sent} pessoas receberam o convite. Cada uma precisa aceitar para entrar no grupo.`
      );
      navigation.goBack();
      return;
    }

    showAlert(
      sent > 0 ? 'Enviado em parte' : 'Nenhum convite enviado',
      (sent > 0 ? `${sent} enviado(s).\n\n` : '') + failures.join('\n')
    );
    await load();
    setPicked(new Set());
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pessoa..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Quem você convidar recebe um aviso no app e decide se entra. Só aparecem
            aqui pessoas com conta criada que ainda não estão no grupo.
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {candidates.length === 0
              ? 'Todo mundo com conta no app já está neste grupo ou tem convite pendente.'
              : 'Ninguém encontrado com esse nome.'}
          </Text>
        }
        renderItem={({ item, index }) => {
          const on = picked.has(item.uid);
          return (
            <TouchableOpacity
              style={[styles.row, on && styles.rowOn]}
              onPress={() => toggle(item.uid)}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <Avatar name={item.name || item.email || 'U'} size={40} index={index} photoURL={item.photoURL} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.name || 'Sem nome'}</Text>
                <Text style={styles.rowMail}>{item.email}</Text>
              </View>
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {picked.size > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleSend}
            disabled={sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" />
              : (
                <Text style={styles.btnPrimaryText}>
                  Convidar {picked.size} {picked.size === 1 ? 'pessoa' : 'pessoas'}
                </Text>
              )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  searchBar: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    minHeight: 44,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  list: { padding: Spacing.md, gap: 8, paddingBottom: 110 },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: 40,
    fontSize: 15,
    lineHeight: 22,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    padding: 12,
    minHeight: 64,
  },
  rowOn: { borderColor: Colors.primary, backgroundColor: '#EDF2F9' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowMail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.md,
    paddingBottom: 22,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnPrimary: {
    minHeight: 50,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
