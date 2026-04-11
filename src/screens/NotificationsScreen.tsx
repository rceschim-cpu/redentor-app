import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText as Text } from '../components';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllRead, markOneRead } from '../services/notifications';
import { AppNotification } from '../types';
import { Colors, Spacing, Radius } from '../theme';
import { showAlert } from '../utils/alert';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `${days} dias atrás`;
}

const TYPE_COLOR: Record<AppNotification['type'], string> = {
  join_request: Colors.archBlue,
  parking: Colors.archYellow,
  general: Colors.textMuted,
};

export default function NotificationsScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!appUser?.uid) return;
    setLoading(true);
    try {
      const items = await getNotifications(appUser.uid);
      setNotifications(items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [appUser?.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const hasUnread = notifications.some((n) => !n.read);

  const handleMarkAllRead = async () => {
    if (!appUser?.uid) return;
    try {
      await markAllRead(appUser.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      showAlert('Erro', 'Não foi possível marcar as notificações como lidas.');
    }
  };

  const handleTap = async (item: AppNotification) => {
    if (!appUser?.uid) return;
    if (!item.read) {
      try {
        await markOneRead(appUser.uid, item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      } catch {
        // silent
      }
    }
    if (item.type === 'join_request' && item.metadata?.groupId) {
      navigation.navigate('GroupMemberRequests', {
        groupId: item.metadata.groupId,
        groupName: item.metadata.groupName ?? 'Grupo',
      });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.item, item.read ? styles.itemRead : styles.itemUnread]}
      onPress={() => handleTap(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.typeBorder, { backgroundColor: TYPE_COLOR[item.type] }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemTime}>{relativeTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasUnread && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Nenhuma notificação</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  markAllBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  markAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: { paddingBottom: Spacing.xl },
  emptyContainer: { flex: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
  item: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.lg,
    alignItems: 'center',
  },
  itemRead: {
    backgroundColor: Colors.surface,
  },
  itemUnread: {
    backgroundColor: '#EEF4FB',
  },
  typeBorder: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginHorizontal: Spacing.md,
  },
  itemContent: { flex: 1, gap: 4 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  itemTime: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  itemBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.xl + 4,
  },
});
