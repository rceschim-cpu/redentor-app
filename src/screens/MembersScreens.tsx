import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Avatar, StatusBadge, Card, DetailRow, PrimaryButton } from '../components';
import { Member, MemberStatus } from '../types';
import { getMembers, getMember, addMember, updateMember, deleteMember } from '../services/members';
import { getGroup } from '../services/groups';
import { useAuth } from '../context/AuthContext';
import { maskPhone, maskDate } from '../utils/masks';
import { useFocusEffect } from '@react-navigation/native';

// ─── Lista de Membros ─────────────────────────────────────────────────────
export function MembersListScreen({ navigation }: any) {
  const { appUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemberStatus | 'todos'>('todos');
  const canAddMember = appUser?.role === 'administrador' || appUser?.role === 'pastor';

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMembers()
        .then(setMembers)
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar os membros.'))
        .finally(() => setLoading(false));
    }, [])
  );

  const filtered = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  const FILTERS: Array<{ key: MemberStatus | 'todos'; label: string }> = [
    { key: 'todos', label: `Todos (${members.length})` },
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum membro encontrado.</Text>
          }
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
                  {item.groupId ? 'Em grupo' : 'Sem grupo'} · {item.neighborhood ?? ''}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </TouchableOpacity>
          )}
        />
      )}

      {canAddMember && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMember')}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Detalhe do Membro ────────────────────────────────────────────────────
export function MemberDetailScreen({ route, navigation }: any) {
  const { memberId } = route.params;
  const { appUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canEdit = appUser?.role === 'administrador' || appUser?.role === 'pastor';
  const canDelete = appUser?.role === 'administrador';

  useEffect(() => {
    getMember(memberId)
      .then((m) => {
        setMember(m);
        if (m) navigation.setOptions({ title: m.name });
        if (m?.groupId) {
          getGroup(m.groupId).then((g) => setGroupName(g?.name ?? null)).catch(() => {});
        }
      })
      .catch(() => Alert.alert('Erro', 'Membro não encontrado.'))
      .finally(() => setLoading(false));
  }, [memberId]);

  const MARITAL_MAP: Record<string, string> = {
    solteiro: 'Solteiro(a)',
    casado: 'Casado(a)',
    divorciado: 'Divorciado(a)',
    viuvo: 'Viúvo(a)',
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteMember(member!.id);
        navigation.goBack();
      } catch {
        Alert.alert('Erro', 'Não foi possível excluir o membro.');
      }
    };
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm(`Excluir "${member!.name}"? Esta ação não pode ser desfeita.`)) doDelete();
    } else {
      Alert.alert(
        'Excluir membro',
        `Tem certeza que deseja excluir "${member!.name}"? Esta ação não pode ser desfeita.`,
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: doDelete }]
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

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Membro não encontrado.</Text>
      </View>
    );
  }

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
          <DetailRow label="Batismo" value={member.baptismDate} />
          <DetailRow label="Membro desde" value={member.memberSince} />
          <DetailRow label="Pequeno Grupo" value={groupName ?? (member.groupId ? '—' : 'Sem grupo')} />
        </Card>
        {member.cars && member.cars.length > 0 && (
          <Card style={{ marginBottom: 10 }}>
            <Text style={styles.cardTitle}>VEÍCULOS</Text>
            {member.cars.map((car, i) => (
              <DetailRow
                key={i}
                label={car.plate}
                value={[car.model, car.color].filter(Boolean).join(' · ') || '—'}
              />
            ))}
          </Card>
        )}
        {(member.street || member.neighborhood || member.city) && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.cardTitle}>ENDEREÇO</Text>
            {member.street && <DetailRow label="Rua" value={member.street} />}
            {member.neighborhood && <DetailRow label="Bairro" value={member.neighborhood} />}
            {member.city && <DetailRow label="Cidade" value={member.city} />}
          </Card>
        )}
        <PrimaryButton
          label="Entrar em Contato"
          onPress={() => Alert.alert('Contato', `Ligar para ${member.phone}`)}
        />
        {canEdit && (
          <TouchableOpacity
            style={styles.btnEdit}
            onPress={() => navigation.navigate('AddMember', { member })}
          >
            <Text style={styles.btnEditText}>Editar membro</Text>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            style={styles.btnDelete}
            onPress={handleDelete}
          >
            <Text style={styles.btnDeleteText}>Excluir membro</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ─── Cadastro / Edição de Membro ─────────────────────────────────────────────
export function AddMemberScreen({ navigation, route }: any) {
  const editing: Member | undefined = route.params?.member;
  const [name, setName] = useState(editing?.name ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [birthDate, setBirthDate] = useState(editing?.birthDate ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [street, setStreet] = useState(editing?.street ?? '');
  const [neighborhood, setNeighborhood] = useState(editing?.neighborhood ?? '');
  const [city, setCity] = useState(editing?.city ?? 'Curitiba');
  const [cars, setCars] = useState<Array<{ plate: string; model: string; color: string }>>(
    editing?.cars?.map((c) => ({ plate: c.plate, model: c.model ?? '', color: c.color ?? '' })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const addCar = () => setCars((prev) => [...prev, { plate: '', model: '', color: '' }]);
  const removeCar = (i: number) => setCars((prev) => prev.filter((_, idx) => idx !== i));
  const updateCar = (i: number, field: 'plate' | 'model' | 'color', value: string) =>
    setCars((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const cleanCars = cars
        .filter((c) => c.plate.trim())
        .map((c) => ({ plate: c.plate.trim().toUpperCase(), model: c.model.trim(), color: c.color.trim() }));
      const carPlates = cleanCars.map((c) => c.plate);
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim(),
        email: email.trim(),
        street: street.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        cars: cleanCars,
        carPlates,
      };
      if (editing) {
        await updateMember(editing.id, data);
      } else {
        await addMember({ ...data, status: 'visitante' } as any);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>NOME COMPLETO</Text>
        <TextInput style={styles.formInput} value={name} onChangeText={setName}
          placeholder="Nome do membro" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>TELEFONE / WHATSAPP</Text>
        <TextInput style={styles.formInput} value={phone}
          onChangeText={(v) => setPhone(maskPhone(v))}
          placeholder="(41) 99999-9999" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>DATA DE NASCIMENTO</Text>
        <TextInput style={styles.formInput} value={birthDate}
          onChangeText={(v) => setBirthDate(maskDate(v))}
          placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>E-MAIL</Text>
        <TextInput style={styles.formInput} value={email} onChangeText={setEmail}
          placeholder="email@exemplo.com" placeholderTextColor={Colors.textMuted}
          keyboardType="email-address" autoCapitalize="none" />
      </View>

      <Text style={styles.sectionDivider}>ENDEREÇO</Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>RUA / LOGRADOURO</Text>
        <TextInput style={styles.formInput} value={street} onChangeText={setStreet}
          placeholder="Rua das Flores, 123" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>BAIRRO</Text>
        <TextInput style={styles.formInput} value={neighborhood} onChangeText={setNeighborhood}
          placeholder="Ex: Boa Vista" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>CIDADE</Text>
        <TextInput style={styles.formInput} value={city} onChangeText={setCity}
          placeholder="Curitiba" placeholderTextColor={Colors.textMuted} autoCapitalize="words" />
      </View>

      <Text style={styles.sectionDivider}>VEÍCULOS</Text>

      {cars.map((car, i) => (
        <View key={i} style={styles.carCard}>
          <View style={styles.carHeader}>
            <Text style={styles.formLabel}>VEÍCULO {i + 1}</Text>
            <TouchableOpacity onPress={() => removeCar(i)}>
              <Text style={{ color: '#C0392B', fontSize: 13, fontWeight: '600' }}>Remover</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.formInput}
            value={car.plate}
            onChangeText={(v) => updateCar(i, 'plate', v.toUpperCase())}
            placeholder="Placa (ABC-1234)"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.formInput, { marginTop: 6 }]}
            value={car.model}
            onChangeText={(v) => updateCar(i, 'model', v)}
            placeholder="Modelo (ex: HB20 Prata)"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addCarBtn} onPress={addCar}>
        <Text style={styles.addCarBtnText}>+ Adicionar veículo</Text>
      </TouchableOpacity>

      <PrimaryButton label={saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar membro'} onPress={handleSave} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Cancelar</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
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
  memberHero: { backgroundColor: Colors.headerBg, padding: Spacing.xl, alignItems: 'center' },
  heroName: { fontSize: 20, fontWeight: '700', color: Colors.headerText, marginTop: 10, fontFamily: 'Lora_600SemiBold' },
  heroRole: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' },
  detailBody: { flex: 1, padding: Spacing.md },
  cardTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  formContent: { padding: Spacing.lg, gap: 14 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  formInput: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: Colors.textPrimary },
  sectionDivider: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14, marginTop: 2 },
  carCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, gap: 0 },
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addCarBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center' },
  addCarBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  btnEdit: { marginTop: 10, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  btnEditText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDelete: { marginTop: 8, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: '#C0392B', alignItems: 'center' },
  btnDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
