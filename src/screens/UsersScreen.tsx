import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, getAvatarColor } from '../theme';
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

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os usuários.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = (profile: AppUserProfile) => {
    Alert.alert(
      profile.name,
      'Selecione o perfil de acesso:',
      [
        ...ROLES.map((role) => ({
          text: `${role === profile.role ? '✓ ' : ''}${ROLE_LABELS[role]}`,
          onPress: async () => {
            if (role === profile.role) return;
            try {
              await updateUserProfile(profile.uid, { role });
              setUsers((prev) =>
                prev.map((u) => (u.uid === profile.uid ? { ...u, role } : u))
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
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
        return (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => handleRoleChange(item)}
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
          </TouchableOpacity>
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
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
