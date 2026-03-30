import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, StatusBadge, Card, DetailRow, PrimaryButton } from '../components';
import { mockMembers } from '../data/mock';
import { MemberStatus } from '../types';

// ─── Lista de Membros ─────────────────────────────────────────────────────
export function MembersListScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemberStatus | 'todos'>('todos');

  const filtered = mockMembers.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  const FILTERS: Array<{ key: MemberStatus | 'todos'; label: string }> = [
    { key: 'todos', label: `Todos (${mockMembers.length})` },
    { key: 'ativo', label: 'Ativos' },
    { key: 'visitante', label: 'Visitantes' },
    { key: 'inativo', label: 'Inativos' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar membro..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.memberRow}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
          >
            <Avatar name={item.name} size={40} index={item.avatarIndex ?? index} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberSub}>
                {item.groupId ? 'Em grupo' : 'Sem grupo'} · {item.neighborhood}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        )}
      />
      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMember')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Detalhe do Membro ────────────────────────────────────────────────────
export function MemberDetailScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const member = mockMembers.find((m) => m.id === memberId);

  if (!member) return null;

  const MARITAL_MAP: Record<string, string> = {
    solteiro: 'Solteiro(a)',
    casado: 'Casado(a)',
    divorciado: 'Divorciado(a)',
    viuvo: 'Viúvo(a)',
  };

  return (
    <View style={styles.container}>
      <View style={styles.memberHero}>
        <Avatar name={member.name} size={72} index={member.avatarIndex} />
        <Text style={styles.heroName}>{member.name}</Text>
        <Text style={styles.heroRole}>
          {member.status === 'ativo'
            ? 'Membro Ativo · IECLB'
            : member.status === 'visitante'
            ? 'Visitante'
            : 'Membro Inativo'}
        </Text>
      </View>
      <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 10 }}>
          <Text style={styles.cardTitle}>INFORMAÇÕES PESSOAIS</Text>
          <DetailRow label="Telefone" value={member.phone} />
          <DetailRow label="E-mail" value={member.email} />
          <DetailRow label="Nascimento" value={member.birthDate} />
          <DetailRow label="Estado civil" value={MARITAL_MAP[member.maritalStatus ?? ''] ?? '—'} />
        </Card>
        <Card style={{ marginBottom: 10 }}>
          <Text style={styles.cardTitle}>VIDA NA COMUNIDADE</Text>
          <DetailRow label="Pequeno Grupo" value={member.groupId ? 'Célula Norte' : 'Sem grupo'} accent />
          <DetailRow label="Batismo" value={member.baptismDate} />
          <DetailRow label="Membro desde" value={member.memberSince} />
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.cardTitle}>ENDEREÇO</Text>
          <DetailRow label="Bairro" value={member.neighborhood} />
          <DetailRow label="Cidade" value={member.city} />
        </Card>
        <PrimaryButton
          label="Entrar em Contato"
          onPress={() => Alert.alert('Contato', `Ligar para ${member.phone}`)}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ─── Cadastro de Membro ───────────────────────────────────────────────────
export function AddMemberScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório');
      return;
    }
    // TODO: salvar no backend
    Alert.alert('Sucesso', 'Membro cadastrado!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
      {[
        { label: 'NOME COMPLETO', value: name, setter: setName, placeholder: 'Nome do membro' },
        { label: 'TELEFONE / WHATSAPP', value: phone, setter: setPhone, placeholder: '(41) 9xxxx-xxxx', type: 'phone-pad' },
        { label: 'E-MAIL', value: email, setter: setEmail, placeholder: 'email@exemplo.com', type: 'email-address' },
      ].map((field) => (
        <View key={field.label} style={styles.formGroup}>
          <Text style={styles.formLabel}>{field.label}</Text>
          <TextInput
            style={styles.formInput}
            value={field.value}
            onChangeText={field.setter}
            placeholder={field.placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={(field.type as any) || 'default'}
            autoCapitalize={field.type ? 'none' : 'words'}
          />
        </View>
      ))}
      <PrimaryButton label="Salvar Membro" onPress={handleSave} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Cancelar</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: { padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 10, fontSize: 14, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 6, padding: Spacing.md, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: Spacing.md, gap: 8 },
  memberRow: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  memberSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  memberHero: { backgroundColor: Colors.primary, padding: Spacing.xl, alignItems: 'center' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 10, fontFamily: 'Lora_600SemiBold' },
  heroRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' },
  detailBody: { flex: 1, padding: Spacing.md },
  cardTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  formContent: { padding: Spacing.lg, gap: 14 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  formInput: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: Colors.textPrimary },
});
