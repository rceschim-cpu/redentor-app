import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, ROLE_BADGE } from '../theme';
import { Avatar } from '../components';
import { AppUserProfile, UserRole, ROLE_LABELS, ROLE_ORDER } from '../types';
import { getAllUsers, updateUserProfile } from '../services/userProfile';
import { backfillMembersFromUsers } from '../services/backfill';
import { showAlert, showConfirm } from '../utils/alert';

const ROLES: UserRole[] = ROLE_ORDER;
const ROLE_STYLE = ROLE_BADGE;

export default function UsersScreen() {
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // uid sendo salvo
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => {
        if (Platform.OS === 'web') {
          // @ts-ignore
          window.alert('Erro\nNão foi possível carregar os usuários.');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os usuários.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Usuários que se cadastraram mas nunca completaram o perfil não têm
  // registro em /members e por isso não aparecem na tela de Membros.
  const missingMembers = users.filter((u) => !u.memberId).length;

  const handleBackfill = () => {
    showConfirm(
      'Criar registros de membro',
      `${missingMembers} ${missingMembers === 1 ? 'pessoa' : 'pessoas'} sem registro. ` +
      'Vão entrar com nome e e-mail; telefone e nascimento ficam em branco ' +
      'até cada um preencher no próprio perfil. Continuar?',
      async () => {
        setBackfilling(true);
        try {
          const r = await backfillMembersFromUsers();
          setUsers(await getAllUsers());
          const parts = [];
          if (r.created) parts.push(`${r.created} criados`);
          if (r.linked) parts.push(`${r.linked} vinculados a cadastros existentes`);
          if (r.failed) parts.push(`${r.failed} falharam`);
          showAlert(
            'Pronto',
            parts.length ? parts.join(', ') + '.' : 'Nada a fazer — todos já tinham registro.'
          );
        } catch (e) {
          showAlert('Erro', 'Não foi possível criar os registros.');
        } finally {
          setBackfilling(false);
        }
      },
      'Criar'
    );
  };

  const handleRoleChange = async (profile: AppUserProfile, role: UserRole) => {
    if (role === profile.role) {
      setExpandedUid(null);
      return;
    }
    setSaving(profile.uid);
    try {
      await updateUserProfile(profile.uid, { role });
      setUsers((prev) =>
        prev.map((u) => (u.uid === profile.uid ? { ...u, role } : u))
      );
      setExpandedUid(null);
    } catch (err: any) {
      const msg = err?.message ?? 'Não foi possível atualizar o perfil.';
      if (Platform.OS === 'web') {
        // @ts-ignore
        window.alert(`Erro\n${msg}`);
      } else {
        Alert.alert('Erro', msg);
      }
    } finally {
      setSaving(null);
    }
  };

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
      data={users}
      keyExtractor={(u) => u.uid}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <Text style={styles.hint}>
            Toque em um usuário para alterar o perfil de acesso.
          </Text>

          {missingMembers > 0 && (
            <View style={styles.backfillCard}>
              <Text style={styles.backfillTitle}>
                {missingMembers} sem registro de membro
              </Text>
              <Text style={styles.backfillDesc}>
                Essas pessoas criaram conta mas não concluíram o cadastro, então
                não aparecem na tela de Membros.
              </Text>
              <TouchableOpacity
                style={styles.backfillBtn}
                onPress={handleBackfill}
                disabled={backfilling}
                activeOpacity={0.8}
              >
                {backfilling
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.backfillBtnText}>Criar registros agora</Text>}
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhum usuário encontrado.</Text>
      }
      renderItem={({ item, index }) => {
        const roleStyle = ROLE_STYLE[item.role];
        const isExpanded = expandedUid === item.uid;
        const isSaving = saving === item.uid;

        return (
          <View style={[styles.card, isExpanded && styles.cardExpanded]}>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setExpandedUid(isExpanded ? null : item.uid)}
            >
              <Avatar name={item.name} size={42} index={index} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.badgeText, { color: roleStyle.fg }]}>
                  {ROLE_LABELS[item.role]}
                </Text>
              </View>
              <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.rolePicker}>
                <Text style={styles.rolePickerLabel}>ALTERAR PERFIL DE ACESSO</Text>
                <View style={styles.roleChips}>
                  {ROLES.map((role) => {
                    const rs = ROLE_STYLE[role];
                    const isActive = item.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleChip,
                          isActive && { backgroundColor: rs.fg, borderColor: rs.fg },
                          !isActive && { borderColor: rs.fg },
                        ]}
                        onPress={() => handleRoleChange(item, role)}
                        disabled={isSaving}
                      >
                        {isSaving && isActive ? (
                          <ActivityIndicator size="small" color={isActive ? '#fff' : rs.fg} />
                        ) : (
                          <Text style={[
                            styles.roleChipText,
                            { color: isActive ? '#fff' : rs.fg },
                          ]}>
                            {isActive ? `✓ ${ROLE_LABELS[role]}` : ROLE_LABELS[role]}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  backfillCard: {
    backgroundColor: '#FFF8EC',
    borderWidth: 1,
    borderColor: '#F0DC9A',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  backfillTitle: { fontSize: 15, fontWeight: '700', color: '#7A6010' },
  backfillDesc: { fontSize: 13, color: '#7A6010', lineHeight: 19, opacity: 0.85 },
  backfillBtn: {
    minHeight: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  backfillBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 8 },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  empty: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: Colors.primary,
  },
  row: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  email: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 10, color: Colors.textMuted, marginLeft: 2 },
  rolePicker: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    gap: 10,
    backgroundColor: Colors.background,
  },
  rolePickerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
    minWidth: 80,
    alignItems: 'center',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
