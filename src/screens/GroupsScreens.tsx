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
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, Card, DetailRow, PrimaryButton } from '../components';
import { Group } from '../types';
import { getGroups, getGroup } from '../services/groups';

// ─── Lista de Grupos ───────────────────────────────────────────────────────
export function GroupsListScreen({ navigation }: any) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os grupos.'))
      .finally(() => setLoading(false));
  }, []);

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
          <Text style={styles.empty}>Nenhum grupo cadastrado.</Text>
        }
        renderItem={({ item: group }) => (
          <TouchableOpacity
            style={styles.groupCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
          >
            <View style={styles.groupTop}>
              <View style={styles.groupIconWrap}>
                <Text style={styles.groupEmoji}>{group.icon ?? '🏠'}</Text>
              </View>
              <View style={styles.groupMeta}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupLeader}>
                  {group.meetingDay} · {group.meetingTime}
                </Text>
              </View>
            </View>
            <View style={styles.pillRow}>
              <View style={styles.pillBlue}>
                <Text style={styles.pillBlueText}>{(group.memberIds ?? []).length} membros</Text>
              </View>
              <View style={group.status === 'ativo' ? styles.pillGreen : styles.pillOrange}>
                <Text style={group.status === 'ativo' ? styles.pillGreenText : styles.pillOrangeText}>
                  {group.status === 'ativo' ? 'Ativo' : 'Em formação'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Novo Grupo', 'Em breve!')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Detalhe do Grupo ─────────────────────────────────────────────────────
export function GroupDetailScreen({ route }: any) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroup(groupId)
      .then(setGroup)
      .catch(() => Alert.alert('Erro', 'Grupo não encontrado.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Grupo não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.groupHero}>
        <View style={styles.heroIconRow}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroEmoji}>{group.icon ?? '🏠'}</Text>
          </View>
          <View>
            <Text style={styles.heroName}>{group.name}</Text>
            <Text style={styles.heroSub}>
              {group.meetingDay} · {group.meetingTime}
              {group.neighborhood ? ` · ${group.neighborhood}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          {[
            { num: (group.memberIds ?? []).length.toString(), lbl: 'Membros' },
            { num: group.status === 'ativo' ? 'Ativo' : 'Formação', lbl: 'Status' },
          ].map((s) => (
            <View key={s.lbl} style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{s.num}</Text>
              <Text style={styles.heroStatLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.cardTitle}>INFORMAÇÕES</Text>
          {group.location && <DetailRow label="Local" value={group.location} />}
          {group.neighborhood && <DetailRow label="Bairro" value={group.neighborhood} />}
        </Card>

        <PrimaryButton
          label="+ Adicionar Membro"
          onPress={() => Alert.alert('Adicionar', 'Em breve!')}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
  list: { padding: Spacing.md, gap: 10 },
  groupCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  groupTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  groupIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 20 },
  groupMeta: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Lora_600SemiBold' },
  groupLeader: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pillBlue: { backgroundColor: '#E8F2FA', borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  pillBlueText: { fontSize: 11, fontWeight: '700', color: '#2D6EA0' },
  pillGreen: { backgroundColor: Colors.activeBg, borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  pillGreenText: { fontSize: 11, fontWeight: '700', color: Colors.activeText },
  pillOrange: { backgroundColor: Colors.visitorBg, borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  pillOrangeText: { fontSize: 11, fontWeight: '700', color: Colors.visitorText },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  groupHero: { backgroundColor: Colors.primary, padding: Spacing.lg },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIconWrap: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 24 },
  heroName: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  heroStats: { flexDirection: 'row', gap: 8 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' },
  heroStatNum: { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: 'Lora_600SemiBold' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginTop: 2 },
  detailBody: { flex: 1, padding: Spacing.md },
  cardTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
});
