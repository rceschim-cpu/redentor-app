import React, { useCallback, useState } from 'react';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../theme';
import { AppText as Text, Avatar, Card, ChipGroup, PrimaryButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { updateUserProfile } from '../services/userProfile';
import { getMember, updateMember } from '../services/members';
import { getGroups } from '../services/groups';
import { requestToJoin } from '../services/memberships';
import { maskPhone, maskDate } from '../utils/masks';
import { showAlert } from '../utils/alert';
import { MARITAL_OPTIONS, STATUS_OPTIONS, MARITAL_LABEL } from '../constants/memberOptions';
import { Group, Member, MemberStatus } from '../types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, appUser, refreshAppUser } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // todos os campos
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [status, setStatus] = useState<MemberStatus>('visitante');
  const [baptismDate, setBaptismDate] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [cars, setCars] = useState<Array<{ plate: string; model: string; color: string }>>([]);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // grupos
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [requestingGroup, setRequestingGroup] = useState<string | null>(null);

  const fillFromMember = (m: Member) => {
    setMember(m);
    setName(m.name ?? '');
    setPhone(m.phone ?? '');
    setEmail(m.email ?? appUser?.email ?? '');
    setBirthDate(m.birthDate ?? '');
    setMaritalStatus(m.maritalStatus ?? '');
    setStatus(m.status ?? 'visitante');
    setBaptismDate(m.baptismDate ?? '');
    setMemberSince(m.memberSince ?? '');
    setStreet(m.street ?? '');
    setNeighborhood(m.neighborhood ?? '');
    setCity(m.city ?? '');
    setCars(m.cars?.map((c) => ({ plate: c.plate, model: c.model ?? '', color: c.color ?? '' })) ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      setLoadingData(true);
      if (appUser?.memberId) {
        getMember(appUser.memberId)
          .then((m) => { if (m) fillFromMember(m); })
          .finally(() => setLoadingData(false));
      } else {
        setName(appUser?.name ?? '');
        setEmail(appUser?.email ?? user?.email ?? '');
        setLoadingData(false);
      }
    }, [appUser?.memberId])
  );

  const addCar = () => setCars((p) => [...p, { plate: '', model: '', color: '' }]);
  const removeCar = (i: number) => setCars((p) => p.filter((_, idx) => idx !== i));
  const updateCar = (i: number, field: 'plate' | 'model' | 'color', val: string) =>
    setCars((p) => p.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));

  const handleSave = async () => {
    if (!name.trim()) { showAlert('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const cleanCars = cars
        .filter((c) => c.plate.trim())
        .map((c) => ({ plate: c.plate.trim().toUpperCase(), model: c.model.trim(), color: c.color.trim() }));

      await updateUserProfile(user!.uid, { name: name.trim() });

      if (appUser?.memberId) {
        await updateMember(appUser.memberId, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          birthDate: birthDate.trim() || undefined,
          maritalStatus: maritalStatus || undefined,
          status,
          baptismDate: baptismDate.trim() || undefined,
          memberSince: memberSince.trim() || undefined,
          street: street.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
          city: city.trim() || undefined,
          cars: cleanCars,
          carPlates: cleanCars.map((c) => c.plate),
        });
      }

      await refreshAppUser();
      setEditMode(false);
      showAlert('Perfil atualizado!');
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestGroup = async (group: Group) => {
    if (!user || !appUser) return;
    setRequestingGroup(group.id);
    try {
      await requestToJoin(group.id, user.uid, appUser.name, appUser.email ?? user.email ?? '');
      setShowGroupPicker(false);
      showAlert('Solicitação enviada!', `Aguarde a aprovação do líder do grupo "${group.name}".`);
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível enviar a solicitação.');
    } finally {
      setRequestingGroup(null);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm('Deseja encerrar a sessão?')) signOut();
    } else {
      Alert.alert('Sair', 'Deseja encerrar a sessão?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <Avatar name={name || 'U'} size={72} index={1} photoURL={appUser?.photoURL} />
        <Text style={styles.heroName}>{name}</Text>
        <Text style={styles.heroEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{appUser?.role ?? 'membro'}</Text>
        </View>
      </View>

      {/* ── DADOS PESSOAIS ── */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DADOS PESSOAIS</Text>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Text style={styles.editLink}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <>
            <Field label="NOME COMPLETO">
              <TextInput style={styles.input} value={name} onChangeText={setName}
                autoCapitalize="words" placeholder="Seu nome" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="TELEFONE / WHATSAPP">
              <TextInput style={styles.input} value={phone} onChangeText={(v) => setPhone(maskPhone(v))}
                keyboardType="phone-pad" placeholder="(41) 99999-9999" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="E-MAIL">
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                placeholder="email@exemplo.com" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="DATA DE NASCIMENTO">
              <TextInput style={styles.input} value={birthDate} onChangeText={(v) => setBirthDate(maskDate(v))}
                keyboardType="numeric" placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="ESTADO CIVIL">
              <ChipGroup options={MARITAL_OPTIONS} value={maritalStatus} onChange={setMaritalStatus} />
            </Field>
          </>
        ) : (
          <>
            <InfoRow label="Nome" value={name} />
            <InfoRow label="Telefone" value={phone} />
            <InfoRow label="E-mail" value={email} />
            <InfoRow label="Nascimento" value={birthDate} />
            <InfoRow label="Estado civil" value={MARITAL_LABEL[maritalStatus]} />
          </>
        )}
      </Card>

      {/* ── VIDA NA COMUNIDADE ── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>VIDA NA COMUNIDADE</Text>

        {editMode ? (
          <>
            <Field label="STATUS">
              <ChipGroup
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => v && setStatus(v as MemberStatus)}
              />
            </Field>
            <Field label="DATA DE BATISMO">
              <TextInput style={styles.input} value={baptismDate} onChangeText={(v) => setBaptismDate(maskDate(v))}
                keyboardType="numeric" placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="MEMBRO DESDE">
              <TextInput style={styles.input} value={memberSince} onChangeText={(v) => setMemberSince(maskDate(v))}
                keyboardType="numeric" placeholder="DD/MM/AAAA" placeholderTextColor={Colors.textMuted} />
            </Field>
          </>
        ) : (
          <>
            <InfoRow label="Status" value={STATUS_OPTIONS.find((o) => o.key === status)?.label} />
            <InfoRow label="Batismo" value={baptismDate} />
            <InfoRow label="Membro desde" value={memberSince} />
            <InfoRow label="Pequeno Grupo" value={member?.groupId ? '✓ Em grupo' : 'Sem grupo'} />
          </>
        )}
      </Card>

      {/* ── ENDEREÇO ── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>ENDEREÇO</Text>

        {editMode ? (
          <>
            <Field label="RUA / LOGRADOURO">
              <TextInput style={styles.input} value={street} onChangeText={setStreet}
                autoCapitalize="words" placeholder="Rua das Flores, 123" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="BAIRRO">
              <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood}
                autoCapitalize="words" placeholder="Ex: Boa Vista" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="CIDADE">
              <TextInput style={styles.input} value={city} onChangeText={setCity}
                autoCapitalize="words" placeholder="Curitiba" placeholderTextColor={Colors.textMuted} />
            </Field>
          </>
        ) : (
          <>
            <InfoRow label="Rua" value={street} />
            <InfoRow label="Bairro" value={neighborhood} />
            <InfoRow label="Cidade" value={city} />
          </>
        )}
      </Card>

      {/* ── VEÍCULOS ── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>VEÍCULOS</Text>

        {editMode ? (
          <>
            {cars.map((car, i) => (
              <View key={i} style={styles.carCard}>
                <View style={styles.carHeader}>
                  <Text style={styles.label}>VEÍCULO {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeCar(i)}>
                    <Text style={styles.removeText}>Remover</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} value={car.plate}
                  onChangeText={(v) => updateCar(i, 'plate', v.toUpperCase())}
                  placeholder="Placa (ABC-1234)" placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters" />
                <TextInput style={[styles.input, { marginTop: 6 }]} value={car.model}
                  onChangeText={(v) => updateCar(i, 'model', v)}
                  placeholder="Modelo (ex: HB20 Prata)" placeholderTextColor={Colors.textMuted} />
              </View>
            ))}
            <TouchableOpacity style={styles.addCarBtn} onPress={addCar}>
              <Text style={styles.addCarBtnText}>+ Adicionar veículo</Text>
            </TouchableOpacity>
          </>
        ) : (
          cars.length > 0
            ? cars.map((car, i) => (
                <InfoRow key={i} label={car.plate}
                  value={[car.model, car.color].filter(Boolean).join(' · ') || '—'} />
              ))
            : <Text style={styles.emptyText}>Nenhum veículo cadastrado.</Text>
        )}
      </Card>

      {/* ── BOTÕES DE AÇÃO ── */}
      {editMode && (
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setEditMode(false)}>
            <Text style={styles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnSaveText}>Salvar alterações</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── PEQUENO GRUPO ── */}
      {!editMode && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>PEQUENO GRUPO</Text>
          {member?.groupId ? (
            <InfoRow label="Grupo atual" value="✓ Membro de um grupo" />
          ) : (
            <>
              <Text style={styles.emptyText}>Você não está em nenhum pequeno grupo.</Text>
              {!showGroupPicker ? (
                <TouchableOpacity style={styles.joinBtn}
                  onPress={() => {
                    setShowGroupPicker(true);
                    setLoadingGroups(true);
                    getGroups().then(setGroups).finally(() => setLoadingGroups(false));
                  }}>
                  <Text style={styles.joinBtnText}>+ Solicitar entrada em um grupo</Text>
                </TouchableOpacity>
              ) : loadingGroups ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
              ) : (
                <View style={styles.groupList}>
                  {groups.map((g) => (
                    <TouchableOpacity key={g.id} style={styles.groupItem}
                      onPress={() => handleRequestGroup(g)} disabled={requestingGroup === g.id}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.groupItemName}>{g.name}</Text>
                        {g.schedule && <Text style={styles.groupItemSub}>{g.schedule}</Text>}
                      </View>
                      {requestingGroup === g.id
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : <Text style={styles.groupItemArrow}>›</Text>}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setShowGroupPicker(false)} style={{ alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </Card>
      )}

      {/* ── SAIR ── */}
      {!editMode && (
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: Colors.headerBg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  heroName: { fontSize: 20, fontWeight: '700', color: Colors.headerText, fontFamily: 'Inter_700Bold', marginTop: 8 },
  heroEmail: { fontSize: 12, color: Colors.textSecondary },
  roleBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(62,53,48,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  section: { margin: Spacing.md, marginBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  editLink: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 13, color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  field: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  removeText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  carCard: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addCarBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addCarBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  actionBtns: { flexDirection: 'row', gap: 10, margin: Spacing.md, marginTop: Spacing.lg },
  btnCancel: { flex: 1, paddingVertical: 13, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnSave: { flex: 2, paddingVertical: 13, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  joinBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  joinBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  groupList: { gap: 6, marginTop: 8 },
  groupItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  groupItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  groupItemSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  groupItemArrow: { fontSize: 22, color: Colors.textMuted },
  signOutBtn: { margin: Spacing.md, marginTop: Spacing.lg, paddingVertical: 13, borderRadius: Radius.md, backgroundColor: '#C0392B', alignItems: 'center' },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
