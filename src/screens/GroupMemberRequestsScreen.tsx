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
import { GroupMembership } from '../types';
import { getPendingRequests, respondToRequest } from '../services/memberships';
import { useAuth } from '../context/AuthContext';

export default function GroupMemberRequestsScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const [requests, setRequests] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: `Solicitações — ${groupName}` });
    getPendingRequests(groupId)
      .then(setRequests)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar as solicitações.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleRespond = (
    membershipId: string,
    status: 'aprovado' | 'rejeitado',
    name: string
  ) => {
    if (!user) return;
    const label = status === 'aprovado' ? 'Aprovar' : 'Rejeitar';

    const doRespond = async () => {
      setProcessing(membershipId);
      try {
        await respondToRequest(groupId, membershipId, status, user.uid);
        setRequests((prev) => prev.filter((r) => r.id !== membershipId));
      } catch (err: any) {
        const msg = err?.message ?? 'Não foi possível processar a solicitação.';
        if (Platform.OS === 'web') {
          // @ts-ignore
          window.alert(`Erro: ${msg}`);
        } else {
          Alert.alert('Erro', msg);
        }
      } finally {
        setProcessing(null);
      }
    };

    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm(`${label} o ingresso de ${name}?`)) doRespond();
    } else {
      Alert.alert(
        `${label} solicitação`,
        `${label} o ingresso de ${name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: label, style: status === 'aprovado' ? 'default' : 'destructive', onPress: doRespond },
        ]
      );
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
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Nenhuma solicitação pendente</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Avatar name={item.userName} size={42} index={index} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.userName}</Text>
                <Text style={styles.email}>{item.userEmail}</Text>
                <Text style={styles.date}>
                  Solicitado em {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnReject}
                onPress={() => handleRespond(item.id, 'rejeitado', item.userName)}
                disabled={processing === item.id}
              >
                <Text style={styles.btnRejectText}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnApprove}
                onPress={() => handleRespond(item.id, 'aprovado', item.userName)}
                disabled={processing === item.id}
              >
                {processing === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnApproveText}>Aprovar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  btnReject: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnRejectText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnApprove: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  btnApproveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
