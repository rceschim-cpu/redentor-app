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
import { Colors, Spacing, Radius } from '../theme';
import { Avatar } from '../components';
import { AppUserProfile, UserRole, ROLE_LABELS } from '../types';
import { getAllUsers, updateUserProfile } from '../services/userProfile';

const ROLES: UserRole[] = ['administrador', 'pastor', 'lider', 'membro'];

const ROLE_STYLE: Record<UserRole, { bg: string; fg: string }> = {
  administrador: { bg: '#EDE9F7', fg: '#7B5EA7' },
  pastor:        { bg: '#E8F2FA', fg: '#2D6EA0' },
  lider:         { bg: '#E8F4EA', fg: '#3B7A46' },
  membro:        { bg: Colors.borderLight, fg: Colors.textSecondary },
};

export default function UsersScreen() {
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // uid sendo salvo

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
        <Text style={styles.hint}>
          Toque em um usuário para alterar o perfil de acesso.
        </Text>
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
